"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { writeAudit } from "@/lib/db/audit";
import { db, must } from "@/lib/db/client";
import { getAssessment } from "@/lib/db/rto";
import { getProject } from "@/lib/db/tracker";

interface State { ok?: boolean; error?: string; items?: string[] }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function createAssessment(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("rto.write");
  const project = await getProject(s(fd, "project_id"), user);
  const date = s(fd, "assessment_date"), point = s(fd, "assessment_point"), led = s(fd, "led_by");
  if (!date || !point || !led) return { error: "Tanggal, titik penilaian, dan OR Team Lead wajib diisi." };
  const a = must(
    await db().from("rto_assessment").insert({ project_id: project.id, assessment_date: date, assessment_point: point, led_by: led, created_by: user.id }).select("id").single(),
    "rto_assessment",
  ) as { id: string };
  const reqs = must(await db().from("rto_requirement").select("id"), "rto_requirement") as { id: number }[];
  must(await db().from("rto_result").insert(reqs.map((r) => ({ assessment_id: a.id, requirement_id: r.id }))), "rto_result");
  const subs = must(await db().from("rto_sub_element").select("id"), "rto_sub_element") as { id: number }[];
  await db().from("rto_project_sub_element").upsert(subs.map((x) => ({ project_id: project.id, sub_element_id: x.id })), { onConflict: "project_id,sub_element_id", ignoreDuplicates: true });
  await writeAudit(user, "rto_assessment", a.id, "CREATE", { project: project.code, date, point });
  redirect(`/rto/${a.id}`);
}

export async function saveRtoResult(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("rto.write");
  const { assessment } = await getAssessment(s(fd, "assessment_id"), user);
  if (assessment.status !== "DRAFT") return { error: "Assessment sudah diserahkan — tidak dapat diubah." };
  const raw = s(fd, "maturity_score");
  const isNa = raw === "NA";
  const score = raw === "" || isNa ? null : Number(raw);
  if (score !== null && (!Number.isInteger(score) || score < 0 || score > 4)) return { error: `Skor maturity harus 0–4 atau NA. Nilai: ${raw}` };
  const requirementId = Number(s(fd, "requirement_id"));
  must(
    await db().from("rto_result").update({
      maturity_score: score,
      is_na: isNa,
      is_delivered: fd.get("is_delivered") === "on",
      notes: s(fd, "notes") || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }).eq("assessment_id", assessment.id).eq("requirement_id", requirementId),
    "rto_result",
  );
  await writeAudit(user, "rto_result", `${assessment.id}/${requirementId}`, "UPDATE", { maturity_score: isNa ? "NA" : score, delivered: fd.get("is_delivered") === "on" });
  revalidatePath(`/rto/${assessment.id}`);
  return { ok: true };
}

export async function toggleSubElement(fd: FormData): Promise<void> {
  const user = await requirePermission("rto.write");
  const { assessment, project } = await getAssessment(s(fd, "assessment_id"), user);
  const subId = Number(s(fd, "sub_element_id"));
  const applicable = s(fd, "applicable") === "true";
  must(await db().from("rto_project_sub_element").upsert({ project_id: project.id, sub_element_id: subId, applicable }), "rto_project_sub_element");
  await writeAudit(user, "rto_project_sub_element", `${project.id}/${subId}`, "UPDATE", { applicable });
  revalidatePath(`/rto/${assessment.id}`);
}

export async function changeAssessmentStatus(_: State, fd: FormData): Promise<State> {
  const target = s(fd, "status");
  const user = await requirePermission(target === "REVIEWED" ? "rto.review" : "rto.write");
  const { assessment } = await getAssessment(s(fd, "assessment_id"), user);
  const allowed = (assessment.status === "DRAFT" && target === "SUBMITTED") || (assessment.status === "SUBMITTED" && target === "REVIEWED");
  if (!allowed) return { error: `Transisi ${assessment.status} → ${target} tidak sah.` };
  must(await db().from("rto_assessment").update({ status: target }).eq("id", assessment.id), "rto_assessment");
  await writeAudit(user, "rto_assessment", assessment.id, "STATUS", { status: [assessment.status, target] });
  revalidatePath(`/rto/${assessment.id}`);
  return { ok: true };
}
