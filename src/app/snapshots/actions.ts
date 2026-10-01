"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { writeAudit } from "@/lib/db/audit";
import { db } from "@/lib/db/client";
import { buildScorecard, getConfig, getPhaseInstance, listProjects } from "@/lib/db/tracker";

interface State { ok?: boolean; error?: string; items?: string[] }

/** Snapshot Builder (FR-5.1) — idempoten per (phase instance, periode) lewat unique index. */
export async function buildSnapshots(_: State, fd: FormData): Promise<State> {
  const user = await requirePermission("snapshot.build");
  const label = String(fd.get("label") ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(label)) return { error: "Periode harus berformat YYYY-MM." };
  const config = await getConfig();
  const projects = await listProjects(user);
  const created: string[] = [];
  const skipped: string[] = [];
  for (const p of projects) {
    const inst = await getPhaseInstance(p.id, p.current_phase);
    const sc = await buildScorecard(p, inst, config);
    const res = await db().from("score_snapshot").insert({
      phase_instance_id: inst.id,
      label,
      indices: sc.result.indices,
      dimension_results: sc.result.dimensions,
      scores: sc.meta.map((m) => ({ id: m.deliverableId, score: m.isNa ? "NA" : m.score })),
      config_version: config.version,
    });
    if (res.error) {
      if (res.error.code === "23505") skipped.push(`${p.code} ${inst.phase_code}`);
      else return { error: res.error.message };
    } else created.push(`${p.code} ${inst.phase_code}`);
  }
  await writeAudit(user, "score_snapshot", label, "BUILD", { created, skipped });
  revalidatePath("/snapshots");
  return {
    ok: true,
    items: [`Dibentuk: ${created.join(", ") || "—"}`, `Sudah ada (dilewati, idempoten): ${skipped.join(", ") || "—"}`],
  };
}
