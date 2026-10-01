"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { writeAudit } from "@/lib/db/audit";
import { db, must } from "@/lib/db/client";
import { getConfig } from "@/lib/db/tracker";

interface State {
  ok?: boolean;
  error?: string;
  items?: string[];
}
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Edit requirement + modifier satu sel matriks (VR-M17: modifier > 0 ⇔ requirement terisi). */
export async function updateApplicability(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("master.write");
  const deliverableId = Number(s(fd, "deliverable_id"));
  const type = s(fd, "project_type_code");
  const marker = s(fd, "marker");
  const modifier = Number(s(fd, "modifier").replace(",", "."));
  if (!["G", "A", "C", "N"].includes(marker)) return { error: "Requirement harus G, A, C, atau kosong." };
  if (!Number.isFinite(modifier) || modifier < 0 || modifier > 2) return { error: `Modifier ${s(fd, "modifier")} di luar rentang 0–2.` };
  if (marker === "N" && modifier !== 0) return { error: "Requirement kosong wajib bermodifier 0 (VR-M17)." };
  if (marker !== "N" && modifier === 0) return { error: `Requirement ${marker} wajib bermodifier > 0 (VR-M17).` };
  const before = must(
    await db().from("deliverable_applicability").select("marker, modifier").eq("deliverable_id", deliverableId).eq("project_type_code", type).single(),
    "applicability",
  ) as { marker: string; modifier: number };
  must(
    await db().from("deliverable_applicability").update({ marker, modifier }).eq("deliverable_id", deliverableId).eq("project_type_code", type),
    "applicability",
  );
  await writeAudit(user, "deliverable_applicability", `${deliverableId}/${type}`, "UPDATE", {
    marker: [before.marker, marker],
    modifier: [Number(before.modifier), modifier],
  });
  revalidatePath("/master/deliverables");
  return { ok: true };
}

export async function updateBaseWeight(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("master.write");
  const id = Number(s(fd, "deliverable_id"));
  const w = Number(s(fd, "base_weight").replace(",", "."));
  if (!Number.isFinite(w) || w <= 0) return { error: `Base Weight harus lebih besar dari 0. Nilai dikirim: ${s(fd, "base_weight")} (VR-M11).` };
  must(await db().from("deliverable").update({ base_weight: w }).eq("id", id), "deliverable");
  await writeAudit(user, "deliverable", String(id), "UPDATE_BASE_WEIGHT", { base_weight: w });
  revalidatePath("/master/deliverables");
  return { ok: true };
}

export async function mapChapter(fd: FormData): Promise<void> {
  const user = await requirePermission("master.write");
  const chapter = Number(s(fd, "chapter_no"));
  const dim = s(fd, "dimension_id");
  must(await db().from("chapter_function").update({ dimension_id: dim ? Number(dim) : null }).eq("chapter_no", chapter), "chapter");
  await writeAudit(user, "chapter_function", String(chapter), "MAP_DIMENSION", { dimension_id: dim || null });
  revalidatePath("/master/chapters");
}

export async function updateProjectType(fd: FormData): Promise<void> {
  const user = await requirePermission("master.write");
  const code = s(fd, "code");
  must(await db().from("project_type").update({ name: s(fd, "name"), criteria: s(fd, "criteria") || null }).eq("code", code), "project_type");
  await writeAudit(user, "project_type", code, "UPDATE", { name: s(fd, "name"), criteria: s(fd, "criteria") });
  revalidatePath("/master/project-types");
}

/** Konfigurasi tidak pernah di-update di tempat — selalu versi baru (prospektif). */
export async function newScoringConfig(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("master.write");
  const current = await getConfig();
  const start = Number(s(fd, "start_threshold"));
  const pass = Number(s(fd, "pass_threshold"));
  const gate = s(fd, "gate_min_maturity_pct");
  const gatePct = gate === "" ? null : Number(gate) / 100;
  if (!(start >= 0 && start <= pass && pass <= current.maxScore)) return { error: "Syarat: 0 ≤ start ≤ pass ≤ skor maksimum." };
  if (gatePct !== null && !(gatePct >= 0 && gatePct <= 1)) return { error: "Ambang gate harus 0–100%." };
  const row = {
    version: current.version + 1,
    start_threshold: start,
    pass_threshold: pass,
    max_score: current.maxScore,
    gate_min_maturity_pct: gatePct,
    gate_control_must_complete: fd.get("gate_control_must_complete") === "on",
    na_treatment: s(fd, "na_treatment") === "EXCEL_PARITY" ? "EXCEL_PARITY" : "EXCLUDE",
    created_by: user.id,
  };
  must(await db().from("scoring_config").insert(row), "scoring_config");
  await writeAudit(user, "scoring_config", String(row.version), "CREATE_VERSION", row);
  revalidatePath("/", "layout");
  return { ok: true };
}
