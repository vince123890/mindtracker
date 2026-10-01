"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import type { DummyUser } from "@/lib/auth/users";
import { writeAudit } from "@/lib/db/audit";
import { db, must } from "@/lib/db/client";
import { buildScorecard, getPhaseInstance, getPhases, getProject } from "@/lib/db/tracker";

export interface ActionState {
  ok?: boolean;
  error?: string;
  items?: string[];
}

const TYPE_CODES = ["NFP", "NMF", "MPM", "m-PM", "NSI"];

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

async function createPhaseInstance(projectId: string, phase: string): Promise<string> {
  const ppi = must(
    await db().from("project_phase_instance").insert({ project_id: projectId, phase_code: phase }).select("id").single(),
    "phase instance",
  ) as { id: string };
  const deliverables = must(
    await db().from("deliverable").select("id").eq("phase_code", phase).eq("is_active", true),
    "deliverable",
  ) as { id: number }[];
  if (deliverables.length) {
    must(
      await db().from("deliverable_score").insert(deliverables.map((d) => ({ phase_instance_id: ppi.id, deliverable_id: d.id }))),
      "deliverable_score",
    );
  }
  return ppi.id;
}

// ------------------------------------------------------------------ proyek
export async function createProject(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requirePermission("project.write");
  const organizationId = user.role === "PMO_ADMIN" ? str(fd, "organization_id") : user.organizationId;
  const t1 = str(fd, "project_type_1");
  const t2 = str(fd, "project_type_2") || null;
  const entry = str(fd, "entry_phase");
  const required = { code: str(fd, "code"), name: str(fd, "name"), location: str(fd, "location"), organizationId, t1, entry };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return { error: `Field wajib belum diisi: ${missing.join(", ")}` };
  if (!TYPE_CODES.includes(t1) || (t2 && !TYPE_CODES.includes(t2))) return { error: "Kode tipe proyek tidak sah (VR-13)." };
  if (t2 && t2 === t1) return { error: "Project Type 2 tidak boleh sama dengan Project Type 1 (VR-21)." };

  const res = await db()
    .from("project")
    .insert({
      code: required.code,
      name: required.name,
      organization_id: organizationId,
      location: required.location,
      project_type_1: t1,
      project_type_2: t2,
      entry_phase: entry,
      current_phase: entry,
      project_manager: str(fd, "project_manager") || null,
      executive_sponsor: str(fd, "executive_sponsor") || null,
      key_dependencies: str(fd, "key_dependencies") || null,
      depended_by: str(fd, "depended_by") || null,
      description: str(fd, "description") || null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (res.error) return { error: res.error.message.includes("duplicate") ? `Kode proyek ${required.code} sudah dipakai.` : res.error.message };
  const id = (res.data as { id: string }).id;
  await createPhaseInstance(id, entry);
  await writeAudit(user, "project", id, "CREATE", { ...required, t2 });
  redirect(`/projects/${id}`);
}

export async function changeProjectTypes(fd: FormData): Promise<void> {
  const user = await requirePermission("project.changetype");
  const project = await getProject(str(fd, "project_id"), user);
  const t1 = str(fd, "project_type_1");
  const t2 = str(fd, "project_type_2") || null;
  if (!TYPE_CODES.includes(t1) || (t2 && (!TYPE_CODES.includes(t2) || t2 === t1))) throw new Error("Kombinasi tipe proyek tidak sah.");
  must(await db().from("project").update({ project_type_1: t1, project_type_2: t2 }).eq("id", project.id), "project");
  await writeAudit(user, "project", project.id, "CHANGE_TYPE",
    { project_type_1: [project.project_type_1, t1], project_type_2: [project.project_type_2, t2] }, str(fd, "reason") || undefined);
  revalidatePath(`/projects/${project.id}`);
  redirect(`/projects/${project.id}`);
}

export async function deactivateProject(fd: FormData): Promise<void> {
  const user = await requirePermission("project.changetype");
  const project = await getProject(str(fd, "project_id"), user);
  const waiting = must(
    await db().from("project_phase_instance").select("id").eq("project_id", project.id).eq("gate_status", "WAITING_APPROVAL"),
    "ppi",
  ) as unknown[];
  if (waiting.length) throw new Error("Proyek memiliki pengajuan gate menunggu keputusan (VR-M35).");
  must(await db().from("project").update({ is_active: false }).eq("id", project.id), "project");
  await writeAudit(user, "project", project.id, "DEACTIVATE");
  redirect("/projects");
}

export async function saveSummaryComment(fd: FormData): Promise<void> {
  const user = await requirePermission("phase.comment");
  const project = await getProject(str(fd, "project_id"), user);
  const inst = await getPhaseInstance(project.id, str(fd, "phase"));
  const comment = str(fd, "summary_comment");
  must(await db().from("project_phase_instance").update({ summary_comment: comment || null }).eq("id", inst.id), "ppi");
  await writeAudit(user, "phase_instance", inst.id, "UPDATE_SUMMARY", { summary_comment: [inst.summary_comment, comment] });
  revalidatePath(`/projects/${project.id}`);
}

// ------------------------------------------------------------------ scorecard
async function loadForEdit(user: DummyUser, fd: FormData) {
  const project = await getProject(str(fd, "project_id"), user);
  const inst = await getPhaseInstance(project.id, str(fd, "phase"));
  return { project, inst };
}

function editable(status: string): boolean {
  return status === "DRAFT" || status === "REVISION_REQUIRED";
}

export async function saveScore(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requirePermission("score.write");
  const { project, inst } = await loadForEdit(user, fd);
  if (!editable(inst.gate_status)) return { error: "Skor hanya dapat diubah saat gate berstatus Draft (VR-P06/P07)." };
  const deliverableId = Number(str(fd, "deliverable_id"));
  const sc = await buildScorecard(project, inst);
  const idx = sc.meta.findIndex((m) => m.deliverableId === deliverableId);
  if (idx < 0) return { error: "Deliverable tidak ditemukan pada fase ini." };
  const row = sc.result.rows[idx];
  const meta = sc.meta[idx];
  if (row.accepted === "N") return { error: `Deliverable ${meta.code} tidak berlaku untuk tipe proyek ini (VR-P03).` };
  if (row.accepted === "?") return { error: `Deliverable ${meta.code} belum diputuskan (G / A / Not Required) (VR-P04).` };

  const raw = str(fd, "score");
  const isNa = raw === "NA";
  const score = raw === "" || isNa ? null : Number(raw);
  if (score !== null && (!Number.isInteger(score) || score < 0 || score > 4)) {
    return { error: `Skor harus 0–4 atau NA. Nilai dikirim: ${raw} (VR-P01).` };
  }
  const patch = {
    score,
    is_na: isNa,
    notes: str(fd, "notes") || null,
    action_plan: str(fd, "action_plan") || null,
    responsible_person: str(fd, "responsible_person") || null,
    due_date: str(fd, "due_date") || null,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };
  must(await db().from("deliverable_score").update(patch).eq("phase_instance_id", inst.id).eq("deliverable_id", deliverableId), "score");
  await writeAudit(user, "deliverable_score", `${inst.id}/${deliverableId}`, "UPDATE", {
    code: meta.code,
    score: [meta.isNa ? "NA" : meta.score, isNa ? "NA" : score],
  });
  revalidatePath(`/projects/${project.id}/phases/${inst.phase_code}`);
  return { ok: true };
}

export async function decideConditional(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requirePermission("conditional.resolve");
  const { project, inst } = await loadForEdit(user, fd);
  if (!editable(inst.gate_status)) return { error: "Keputusan hanya dapat diubah saat gate berstatus Draft." };
  const resolution = str(fd, "resolution");
  const justification = str(fd, "justification");
  if (!["GATE", "APPLICABLE", "NOT_REQUIRED"].includes(resolution)) return { error: "Pilih G, A, atau Not Required." };
  if (justification.length < 10) return { error: "Justifikasi wajib diisi, minimal 10 karakter (VR-22)." };
  const deliverableId = Number(str(fd, "deliverable_id"));
  const sc = await buildScorecard(project, inst);
  const idx = sc.meta.findIndex((m) => m.deliverableId === deliverableId);
  if (idx < 0 || sc.result.rows[idx].overall !== "C") return { error: "Hanya deliverable ber-Overall Requirement C yang dapat diputuskan." };
  must(
    await db()
      .from("deliverable_score")
      .update({
        conditional_resolution: resolution,
        conditional_justification: justification,
        conditional_decided_by: user.id,
        conditional_decided_at: new Date().toISOString(),
        ...(resolution === "NOT_REQUIRED" ? { score: null, is_na: false } : {}),
      })
      .eq("phase_instance_id", inst.id)
      .eq("deliverable_id", deliverableId),
    "conditional",
  );
  await writeAudit(user, "deliverable_score", `${inst.id}/${deliverableId}`, "DECIDE_CONDITIONAL",
    { code: sc.meta[idx].code, resolution: [sc.meta[idx].resolution, resolution] }, justification);
  revalidatePath(`/projects/${project.id}/phases/${inst.phase_code}`);
  return { ok: true };
}

export async function addFeedback(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requirePermission("feedback.write");
  const { project, inst } = await loadForEdit(user, fd);
  const body = str(fd, "body");
  if (body.length < 3) return { error: "Isi feedback wajib diisi." };
  const deliverableId = str(fd, "deliverable_id");
  must(
    await db().from("revision_log_entry").insert({
      phase_instance_id: inst.id,
      deliverable_id: deliverableId ? Number(deliverableId) : null,
      author_id: user.id,
      body,
      is_blocking: false, // AM-13: feedback bukan approval
    }),
    "feedback",
  );
  await writeAudit(user, "revision_log", inst.id, "FEEDBACK", { deliverable_id: deliverableId || null, body });
  revalidatePath(`/projects/${project.id}/phases/${inst.phase_code}`);
  return { ok: true };
}

// ------------------------------------------------------------------ phase gate
export async function submitGate(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requirePermission("gate.submit");
  const { project, inst } = await loadForEdit(user, fd);
  if (!editable(inst.gate_status)) return { error: "Gate tidak dalam status Draft." };
  const sc = await buildScorecard(project, inst);
  if (sc.blocking.length) {
    return { error: "Pengajuan gate ditolak — syarat tracker v1.4 belum terpenuhi.", items: sc.blocking.flatMap((b) => [b.message, ...b.items.map((i) => `  • ${i}`)]) };
  }
  must(
    await db().from("project_phase_instance").update({ gate_status: "WAITING_APPROVAL", submitted_by: user.id, submitted_at: new Date().toISOString() }).eq("id", inst.id),
    "ppi",
  );
  must(
    await db().from("phase_gate_transition").insert({ phase_instance_id: inst.id, from_status: inst.gate_status, to_status: "WAITING_APPROVAL", actor_id: user.id, indices: sc.result.indices }),
    "transition",
  );
  await writeAudit(user, "phase_gate", inst.id, "SUBMIT", { indices: sc.result.indices });
  revalidatePath(`/projects/${project.id}`, "layout");
  return { ok: true };
}

async function nextPhase(current: string): Promise<string | null> {
  const phases = await getPhases(true);
  const i = phases.findIndex((p) => p.code === current);
  return i >= 0 && i + 1 < phases.length ? phases[i + 1].code : null;
}

export async function approveGate(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requirePermission("gate.approve");
  const { project, inst } = await loadForEdit(user, fd);
  if (inst.gate_status !== "WAITING_APPROVAL") return { error: "Gate tidak dalam status menunggu persetujuan." };
  if (inst.submitted_by === user.id) return { error: "Pengaju tidak dapat menyetujui pengajuannya sendiri (segregation of duty)." };
  const sc = await buildScorecard(project, inst);

  must(await db().from("project_phase_instance").update({ gate_status: "APPROVED", decided_by: user.id, decided_at: new Date().toISOString() }).eq("id", inst.id), "ppi");
  must(await db().from("phase_gate_transition").insert({ phase_instance_id: inst.id, from_status: "WAITING_APPROVAL", to_status: "APPROVED", actor_id: user.id, note: str(fd, "note") || null, indices: sc.result.indices }), "transition");
  must(
    await db().from("score_snapshot").insert({
      phase_instance_id: inst.id,
      label: "PHASE_CLOSE",
      indices: sc.result.indices,
      dimension_results: sc.result.dimensions,
      scores: sc.meta.map((m) => ({ id: m.deliverableId, code: m.code, score: m.isNa ? "NA" : m.score, resolution: m.resolution })),
      config_version: sc.config.version,
    }),
    "snapshot",
  );
  const next = await nextPhase(inst.phase_code);
  if (next) {
    await createPhaseInstance(project.id, next);
    must(await db().from("project").update({ current_phase: next }).eq("id", project.id), "project");
  }
  await writeAudit(user, "phase_gate", inst.id, "APPROVE", { next_phase: next, indices: sc.result.indices });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function requestRevision(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requirePermission("gate.approve");
  const { project, inst } = await loadForEdit(user, fd);
  if (inst.gate_status !== "WAITING_APPROVAL") return { error: "Gate tidak dalam status menunggu persetujuan." };
  const note = str(fd, "note");
  if (note.length < 5) return { error: "Alasan revisi wajib diisi (VR-07)." };
  const sc = await buildScorecard(project, inst);
  // Status kembali dapat diedit; skor TIDAK direset (FR-4.5 / TL §4.5)
  must(await db().from("project_phase_instance").update({ gate_status: "DRAFT", decided_by: user.id, decided_at: new Date().toISOString() }).eq("id", inst.id), "ppi");
  must(await db().from("phase_gate_transition").insert({ phase_instance_id: inst.id, from_status: "WAITING_APPROVAL", to_status: "REVISION_REQUIRED", actor_id: user.id, note, indices: sc.result.indices }), "transition");
  must(await db().from("revision_log_entry").insert({ phase_instance_id: inst.id, author_id: user.id, body: note, is_blocking: true }), "revision log");
  await writeAudit(user, "phase_gate", inst.id, "REQUEST_REVISION", { indices: sc.result.indices }, note);
  revalidatePath("/", "layout");
  return { ok: true };
}

