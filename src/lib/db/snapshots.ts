import "server-only";
import type { PhaseIndices } from "@/lib/scoring/types";
import { db, must } from "./client";
import type { Project } from "./tracker";

export interface SnapshotRow {
  id: number;
  label: string;
  indices: PhaseIndices;
  created_at: string;
  config_version: number;
  ppi: { phase_code: string; project_id: string };
}

export async function listSnapshots(projects: Project[]): Promise<SnapshotRow[]> {
  if (projects.length === 0) return [];
  const rows = must(
    await db()
      .from("score_snapshot")
      .select("id, label, indices, created_at, config_version, ppi:phase_instance_id!inner(phase_code, project_id)")
      .in("ppi.project_id", projects.map((p) => p.id))
      .order("label"),
    "score_snapshot",
  ) as unknown as SnapshotRow[];
  return rows;
}
