"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertOrgAccess, isMindId, requirePermission } from "@/lib/auth/session";
import { writeAudit } from "@/lib/db/audit";
import { db, must } from "@/lib/db/client";
import { getRca, RCA_CATEGORIES, ROOT_CAUSE_6M, type ActionPlan } from "@/lib/db/do";

interface State {
  ok?: boolean;
  error?: string;
  items?: string[];
}

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function saveRca(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("do.rca.write");
  const id = s(fd, "id");
  const org = isMindId(user) ? s(fd, "organization_id") : user.organizationId;
  const data = {
    organization_id: org,
    plant: s(fd, "plant"),
    product: s(fd, "product"),
    unit: s(fd, "unit"),
    period: s(fd, "period"),
    gap: s(fd, "gap") === "" ? null : Number(s(fd, "gap")),
    category: s(fd, "category"),
    problem: s(fd, "problem"),
    root_cause_category: s(fd, "root_cause_category"),
    root_cause: s(fd, "root_cause"),
    analysis: s(fd, "analysis") || null,
    updated_at: new Date().toISOString(),
  };
  const missing = (["plant", "product", "unit", "period", "category", "problem", "root_cause_category", "root_cause"] as const).filter((k) => !data[k]);
  if (!org) missing.unshift("organization_id" as never);
  if (missing.length) return { error: `Field wajib belum diisi: ${missing.join(", ")}` };
  if (!RCA_CATEGORIES.includes(data.category)) return { error: "Kategori penyebab tidak dikenal." };
  if (!ROOT_CAUSE_6M.includes(data.root_cause_category)) return { error: "Kategori akar masalah harus salah satu 6M." };
  if (data.period.length === 7) data.period = `${data.period}-01`;

  if (id) {
    const rca = await getRca(id, user);
    if (rca.status !== "DRAFT" && rca.status !== "PERLU_PERBAIKAN") return { error: "RCA hanya dapat diubah saat Draft atau Perlu Perbaikan." };
    if (rca.created_by !== user.id && !isMindId(user)) return { error: "Hanya pembuat RCA yang dapat mengubahnya." };
    must(await db().from("rca").update(data).eq("id", id), "rca");
    await writeAudit(user, "rca", id, "UPDATE", data);
    revalidatePath(`/do/rca/${id}`);
    return { ok: true };
  }

  const year = data.period.slice(0, 4);
  const count = must(await db().from("rca").select("id", { count: "exact", head: false }).eq("organization_id", org), "rca count") as unknown[];
  const number = `RCA-${org}-${year}-${String(count.length + 1).padStart(3, "0")}`;
  const created = must(await db().from("rca").insert({ ...data, number, created_by: user.id }).select("id").single(), "rca") as { id: string };
  await writeAudit(user, "rca", created.id, "CREATE", { number, ...data });
  redirect(`/do/rca/${created.id}`);
}

async function transition(rcaId: string, from: string, to: string, actorId: string, note: string | null) {
  must(await db().from("rca").update({ status: to, updated_at: new Date().toISOString() }).eq("id", rcaId), "rca");
  must(await db().from("rca_review_log").insert({ rca_id: rcaId, from_status: from, to_status: to, actor_id: actorId, note }), "rca review log");
}

export async function submitRca(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("do.rca.write");
  const rca = await getRca(s(fd, "id"), user);
  if (rca.status !== "DRAFT" && rca.status !== "PERLU_PERBAIKAN") return { error: "RCA tidak dalam status Draft / Perlu Perbaikan." };
  await transition(rca.id, rca.status, "MENUNGGU_REVIEW", user.id, null);
  await writeAudit(user, "rca", rca.id, "SUBMIT");
  revalidatePath(`/do/rca/${rca.id}`);
  return { ok: true };
}

export async function reviewRca(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("do.rca.approve");
  const rca = await getRca(s(fd, "id"), user);
  const decision = s(fd, "decision");
  const note = s(fd, "note");
  if (rca.status !== "MENUNGGU_REVIEW") return { error: "RCA tidak menunggu review." };
  if (rca.created_by === user.id) return { error: "Pembuat RCA tidak dapat menyetujui RCA-nya sendiri (segregation of duty)." };
  if (decision === "approve") {
    await transition(rca.id, rca.status, "DISETUJUI", user.id, note || null);
  } else {
    if (note.length < 5) return { error: "Catatan perbaikan wajib diisi." };
    await transition(rca.id, rca.status, "PERLU_PERBAIKAN", user.id, note);
  }
  await writeAudit(user, "rca", rca.id, decision === "approve" ? "APPROVE" : "REQUEST_FIX", undefined, note || undefined);
  revalidatePath(`/do/rca/${rca.id}`);
  return { ok: true };
}

export async function deleteRca(fd: FormData): Promise<void> {
  const user = await requirePermission("do.rca.write");
  const rca = await getRca(s(fd, "id"), user);
  if (rca.status !== "DRAFT" || rca.created_by !== user.id) throw new Error("RCA hanya dapat dihapus pembuatnya saat Draft.");
  must(await db().from("rca").update({ deleted_at: new Date().toISOString() }).eq("id", rca.id), "rca");
  await writeAudit(user, "rca", rca.id, "SOFT_DELETE");
  redirect("/do/rca");
}

// ------------------------------------------------------------------ action plan
async function getAp(id: string) {
  return must(await db().from("action_plan").select("*, rca:rca_id(id, organization_id, status)").eq("id", id).is("deleted_at", null).single(), "action_plan") as ActionPlan & {
    rca: { id: string; organization_id: string; status: string };
  };
}

export async function createActionPlan(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("do.actionplan.write");
  const rca = await getRca(s(fd, "rca_id"), user);
  const action = s(fd, "action"), pic = s(fd, "pic"), target = s(fd, "target_date");
  if (!action || !pic || !target) return { error: "Tindakan, PIC, dan target wajib diisi." };
  must(await db().from("action_plan").insert({ rca_id: rca.id, action, pic, target_date: target, created_by: user.id }), "action_plan");
  await writeAudit(user, "action_plan", rca.id, "CREATE", { action, pic, target });
  revalidatePath(`/do/rca/${rca.id}`);
  return { ok: true };
}

export async function updateProgress(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("do.actionplan.write");
  const ap = await getAp(s(fd, "id"));
  assertOrgAccess(user, ap.rca.organization_id);
  if (ap.status === "VERIFIED") return { error: "Action plan sudah terverifikasi." };
  const progress = Number(s(fd, "progress"));
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) return { error: `Progres ${s(fd, "progress")} di luar rentang 0–100.` };
  const status = progress === 100 ? "DONE_PENDING_VERIFY" : progress > 0 ? "IN_PROGRESS" : "OPEN";
  must(await db().from("action_plan").update({ progress, status }).eq("id", ap.id), "action_plan");
  must(await db().from("action_plan_progress").insert({ action_plan_id: ap.id, progress, note: s(fd, "note") || null, actor_id: user.id }), "progress");
  await writeAudit(user, "action_plan", ap.id, "PROGRESS", { progress: [ap.progress, progress] });
  revalidatePath("/do", "layout");
  return { ok: true };
}

export async function verifyActionPlan(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("do.actionplan.verify");
  const ap = await getAp(s(fd, "id"));
  if (ap.status !== "DONE_PENDING_VERIFY") return { error: "Action plan belum dinyatakan selesai (progres 100%)." };
  const decision = s(fd, "decision");
  const note = s(fd, "note");
  if (decision === "verify") {
    must(await db().from("action_plan").update({ status: "VERIFIED" }).eq("id", ap.id), "action_plan");
  } else {
    if (note.length < 5) return { error: "Catatan wajib saat mengembalikan action plan." };
    must(await db().from("action_plan").update({ status: "IN_PROGRESS", progress: 90 }).eq("id", ap.id), "action_plan");
    must(await db().from("action_plan_progress").insert({ action_plan_id: ap.id, progress: 90, note: `Dikembalikan: ${note}`, actor_id: user.id }), "progress");
  }
  await writeAudit(user, "action_plan", ap.id, decision === "verify" ? "VERIFY" : "RETURN", undefined, note || undefined);
  revalidatePath("/do", "layout");
  return { ok: true };
}

export async function deleteActionPlan(fd: FormData): Promise<void> {
  const user = await requirePermission("do.actionplan.write");
  const ap = await getAp(s(fd, "id"));
  assertOrgAccess(user, ap.rca.organization_id);
  if (ap.progress > 0) throw new Error("Action plan yang sudah berprogres tidak dapat dihapus.");
  must(await db().from("action_plan").update({ deleted_at: new Date().toISOString() }).eq("id", ap.id), "action_plan");
  await writeAudit(user, "action_plan", ap.id, "SOFT_DELETE");
  revalidatePath("/do", "layout");
}
