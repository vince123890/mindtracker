// Guard pengajuan Phase Gate — TL §4.2, FSD-3 §2 (aturan tracker v1.4 langkah 4 & 6).

import type { PhaseResult, ScoreInput, ScoringConfig } from "./types";

export interface BlockingReason {
  code: "GATE-01" | "GATE-02" | "GATE-03";
  message: string;
  items: string[];
}

export function evaluateGate(inputs: ScoreInput[], result: PhaseResult, config: ScoringConfig): BlockingReason[] {
  const reasons: BlockingReason[] = [];
  const byId = new Map(inputs.map((i) => [i.deliverableId, i]));

  const unresolved = result.rows.filter((r) => r.accepted === "?").map((r) => byId.get(r.deliverableId)!.code);
  if (unresolved.length > 0) {
    reasons.push({
      code: "GATE-01",
      message: `${unresolved.length} deliverable conditional belum diputuskan (Index 4)`,
      items: unresolved,
    });
  }

  if (config.gateControlMustComplete) {
    const pending = result.rows
      .filter((r) => r.accepted === "G" && r.completion !== "NA" && r.completion !== 1)
      .map((r) => {
        const i = byId.get(r.deliverableId)!;
        return `${i.code} (skor ${i.score ?? "kosong"})`;
      });
    if (pending.length > 0) {
      reasons.push({
        code: "GATE-02",
        message: `${pending.length} deliverable Gate Control belum mencapai skor ${config.passThreshold} — tidak dapat dikompensasi`,
        items: pending,
      });
    }
  }

  const threshold = config.gateMinMaturityPct;
  const index1 = result.indices.index1;
  if (threshold !== null && (index1 === null || index1 < threshold)) {
    reasons.push({
      code: "GATE-03",
      message: `Overall Maturity ${index1 === null ? "—" : Math.round(index1 * 100) + "%"} di bawah ambang ${Math.round(threshold * 100)}% (Index 1)`,
      items: [],
    });
  }

  return reasons;
}
