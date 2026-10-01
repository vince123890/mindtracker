import "server-only";
import { notFound } from "next/navigation";
import type { DummyUser } from "@/lib/auth/users";
import { calculateRto, type RtoInput } from "@/lib/scoring/rto";
import { db, must } from "./client";
import { getProject, type Project } from "./tracker";

export interface RtoPillar { id: number; name: string; description: string | null }
export interface RtoSubElement { id: number; pillar_id: number; code: string; name: string; verified: boolean }
export interface RtoRequirement { id: number; sub_element_id: number; code: string; deliverable_description: string; guidance: string | null; weight: number }
export interface RtoAssessment {
  id: string;
  project_id: string;
  assessment_date: string;
  assessment_point: string;
  led_by: string;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  created_by: string;
  created_at: string;
}
export interface RtoResultRow {
  id: string;
  requirement_id: number;
  maturity_score: number | null;
  is_delivered: boolean;
  is_na: boolean;
  notes: string | null;
}

export const RTO_STATUS_LABEL = { DRAFT: "Draft", SUBMITTED: "Diserahkan", REVIEWED: "Ditinjau" } as const;

export async function getRtoMaster() {
  const [pillars, subs, reqs] = await Promise.all([
    db().from("rto_pillar").select("*").order("id"),
    db().from("rto_sub_element").select("*").order("id"),
    db().from("rto_requirement").select("*").order("id"),
  ]);
  return {
    pillars: must(pillars, "rto_pillar") as RtoPillar[],
    subElements: must(subs, "rto_sub_element") as RtoSubElement[],
    requirements: (must(reqs, "rto_requirement") as RtoRequirement[]).map((r) => ({ ...r, weight: Number(r.weight) })),
  };
}

export async function listAssessments(projects: Project[]): Promise<RtoAssessment[]> {
  if (projects.length === 0) return [];
  return must(
    await db().from("rto_assessment").select("*").in("project_id", projects.map((p) => p.id)).order("assessment_date", { ascending: false }),
    "rto_assessment",
  );
}

export async function getAssessment(id: string, user: DummyUser) {
  const a = must(await db().from("rto_assessment").select("*").eq("id", id).maybeSingle(), "rto_assessment") as RtoAssessment | null;
  if (!a) notFound();
  const project = await getProject(a.project_id, user); // isolasi AH
  const [master, results, applic] = await Promise.all([
    getRtoMaster(),
    db().from("rto_result").select("*").eq("assessment_id", a.id),
    db().from("rto_project_sub_element").select("sub_element_id, applicable").eq("project_id", project.id),
  ]);
  const resultRows = must(results, "rto_result") as RtoResultRow[];
  const applicable = new Map((must(applic, "rto_project_sub_element") as { sub_element_id: number; applicable: boolean }[]).map((x) => [x.sub_element_id, x.applicable]));
  const byReq = new Map(resultRows.map((r) => [r.requirement_id, r]));
  const subById = new Map(master.subElements.map((s) => [s.id, s]));
  const inputs: RtoInput[] = master.requirements.map((req) => {
    const sub = subById.get(req.sub_element_id)!;
    const res = byReq.get(req.id);
    return {
      requirementId: req.id,
      subElementCode: sub.code,
      pillarId: sub.pillar_id,
      weight: req.weight,
      applicable: applicable.get(sub.id) ?? true,
      maturityScore: res?.maturity_score ?? null,
      isDelivered: res?.is_delivered ?? false,
      isNa: res?.is_na ?? false,
    };
  });
  return { assessment: a, project, master, results: byReq, applicable, metrics: calculateRto(inputs) };
}
