import "server-only";
import { notFound } from "next/navigation";
import { assertOrgAccess, isMindId } from "@/lib/auth/session";
import type { DummyUser } from "@/lib/auth/users";
import { db, must } from "./client";

export interface Production {
  id: number;
  organization_id: string;
  plant: string;
  product: string;
  unit: string;
  period: string;
  target: number;
  actual: number;
}

export type RcaStatus = "DRAFT" | "MENUNGGU_REVIEW" | "DISETUJUI" | "PERLU_PERBAIKAN";

export interface Rca {
  id: string;
  number: string;
  organization_id: string;
  plant: string;
  product: string;
  unit: string;
  period: string;
  gap: number | null;
  category: string;
  problem: string;
  root_cause_category: string;
  root_cause: string;
  analysis: string | null;
  status: RcaStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ActionPlanStatus = "OPEN" | "IN_PROGRESS" | "DONE_PENDING_VERIFY" | "VERIFIED";

export interface ActionPlan {
  id: string;
  rca_id: string;
  action: string;
  pic: string;
  target_date: string;
  progress: number;
  status: ActionPlanStatus;
  created_by: string;
  created_at: string;
}

export const RCA_CATEGORIES = ["Teknis", "Bahan Baku", "SDM", "Eksternal", "Perizinan"];
export const ROOT_CAUSE_6M = ["Man", "Machine", "Method", "Material", "Measurement", "Environment"];

export const RCA_STATUS_LABEL: Record<RcaStatus, string> = {
  DRAFT: "Draft",
  MENUNGGU_REVIEW: "Menunggu Review",
  DISETUJUI: "Disetujui",
  PERLU_PERBAIKAN: "Perlu Perbaikan",
};

export const AP_STATUS_LABEL: Record<ActionPlanStatus, string> = {
  OPEN: "Terbuka",
  IN_PROGRESS: "Berjalan",
  DONE_PENDING_VERIFY: "Selesai — menunggu verifikasi",
  VERIFIED: "Terverifikasi",
};

export function isOverdue(ap: ActionPlan): boolean {
  return ap.status !== "VERIFIED" && ap.status !== "DONE_PENDING_VERIFY" && new Date(ap.target_date) < new Date();
}

export async function listProduction(user: DummyUser): Promise<Production[]> {
  let q = db().from("do_production").select("*").order("period").order("organization_id");
  if (!isMindId(user)) q = q.eq("organization_id", user.organizationId);
  return (must(await q, "do_production") as Production[]).map((p) => ({ ...p, target: Number(p.target), actual: Number(p.actual) }));
}

export async function listRca(user: DummyUser): Promise<Rca[]> {
  let q = db().from("rca").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  if (!isMindId(user)) q = q.eq("organization_id", user.organizationId);
  return must(await q, "rca");
}

export async function getRca(id: string, user: DummyUser): Promise<Rca> {
  const rca = must(await db().from("rca").select("*").eq("id", id).is("deleted_at", null).maybeSingle(), "rca") as Rca | null;
  if (!rca) notFound();
  assertOrgAccess(user, rca.organization_id);
  return rca;
}

export async function listActionPlans(user: DummyUser, rcaId?: string): Promise<(ActionPlan & { rca: Pick<Rca, "number" | "organization_id"> })[]> {
  let q = db()
    .from("action_plan")
    .select("*, rca:rca_id!inner(number, organization_id)")
    .is("deleted_at", null)
    .order("target_date");
  if (rcaId) q = q.eq("rca_id", rcaId);
  if (!isMindId(user)) q = q.eq("rca.organization_id", user.organizationId);
  return must(await q, "action_plan");
}

export async function listRcaReviewLog(rcaId: string) {
  return must(
    await db()
      .from("rca_review_log")
      .select("id, from_status, to_status, note, created_at, actor:actor_id(name)")
      .eq("rca_id", rcaId)
      .order("created_at", { ascending: false }),
    "rca_review_log",
  ) as unknown as { id: number; from_status: string; to_status: string; note: string | null; created_at: string; actor: { name: string } | null }[];
}

export async function listActionPlanProgress(actionPlanId: string) {
  return must(
    await db()
      .from("action_plan_progress")
      .select("id, progress, note, created_at, actor:actor_id(name)")
      .eq("action_plan_id", actionPlanId)
      .order("created_at", { ascending: false }),
    "action_plan_progress",
  ) as unknown as { id: number; progress: number; note: string | null; created_at: string; actor: { name: string } | null }[];
}
