// Scoring engine MIND Tracker — fungsi murni (AM-7, AM-8, AM-9).
// Rumus: docs/SPEK-RUMUS-Tracker-v1.4.md §3–§7 dan §13.

import type {
  Accepted,
  Accumulator,
  ConditionalResolution,
  DimensionResult,
  Marker,
  ParityOptions,
  PhaseIndices,
  PhaseResult,
  RowResult,
  ScoreInput,
  ScoringConfig,
} from "./types";

const STRENGTH: Record<Marker, number> = { G: 3, A: 2, C: 1, N: 0 };

/** Kolom H — requirement terkuat dari Type 1 dan Type 2: G > A > C > kosong. */
export function overallRequirement(m1: Marker, m2: Marker | null, parity: ParityOptions = {}): Marker {
  const norm = (m: Marker | null): Marker => (m === null ? "N" : parity.excelRequirement && m === "A" ? "N" : m);
  const a = norm(m1);
  const b = norm(m2);
  return STRENGTH[a] >= STRENGTH[b] ? a : b;
}

/** Kolom T + keputusan tim atas "?" (FR-1.3.3). */
export function acceptedRequirement(overall: Marker, resolution: ConditionalResolution | null): Accepted {
  if (overall === "C") {
    if (resolution === "GATE") return "G";
    if (resolution === "APPLICABLE") return "A";
    if (resolution === "NOT_REQUIRED") return "N";
    return "?";
  }
  return overall;
}

/** Kolom AB/AC/AD — Base Weight × MAX(modifier Type 1, modifier Type 2). */
export function effectiveWeight(baseWeight: number, mod1: number, mod2: number | null): number {
  return baseWeight * Math.max(mod1, mod2 ?? 0);
}

/** Kolom Z (start) dan AA (pass). */
export function evaluateStatus(score: number | null, isNa: boolean, threshold: number): 0 | 1 | "NA" | null {
  if (isNa) return "NA";
  if (score === null) return null;
  return score >= threshold ? 1 : 0;
}

export function evaluateRow(input: ScoreInput, config: ScoringConfig, parity: ParityOptions = {}): RowResult {
  const overall = overallRequirement(input.type1.marker, input.type2?.marker ?? null, parity);
  const accepted = acceptedRequirement(overall, input.resolution);
  const effW = effectiveWeight(input.baseWeight, input.type1.modifier, input.type2?.modifier ?? null);
  const denW = parity.excelDenominatorWeight ? input.baseWeight * input.type1.modifier : effW;
  return {
    deliverableId: input.deliverableId,
    overall,
    accepted,
    effectiveWeight: effW,
    denominatorWeight: denW,
    starting: evaluateStatus(input.score, input.isNa, config.startThreshold),
    completion: evaluateStatus(input.score, input.isNa, config.passThreshold),
    weightedScore: input.isNa ? "NA" : effW * (input.score ?? 0),
  };
}

export function emptyAccumulator(): Accumulator {
  return { scoreNum: 0, scoreDen: 0, statusNum: 0, statusDen: 0, startNum: 0, gateTotal: 0, gateDone: 0 };
}

/** Kolom AN, AO, AP, AQ + akumulator Index 2/3. */
export function accumulate(acc: Accumulator, input: ScoreInput, row: RowResult, config: ScoringConfig): void {
  if (row.accepted !== "G" && row.accepted !== "A") return;
  const inDenominator = !input.isNa || config.naTreatment === "EXCEL_PARITY";
  if (!input.isNa) {
    acc.scoreNum += row.weightedScore as number;
    if (row.completion === 1) acc.statusNum += 1;
    if (row.starting === 1) acc.startNum += 1;
  }
  if (inDenominator) {
    acc.scoreDen += config.maxScore * row.denominatorWeight;
    acc.statusDen += 1;
    if (row.accepted === "G") {
      acc.gateTotal += 1;
      if (row.completion === 1) acc.gateDone += 1;
    }
  }
}

function ratio(num: number, den: number): number | null {
  return den === 0 ? null : num / den; // AM-3: pembagi nol → kosong, bukan 0
}

export function calculatePhase(inputs: ScoreInput[], config: ScoringConfig, parity: ParityOptions = {}): PhaseResult {
  const rows: RowResult[] = [];
  const chapters = new Map<number, Accumulator>();
  const dimAcc = new Map<number, Accumulator>();
  const total = emptyAccumulator();
  let pending = 0;

  for (const input of inputs) {
    const row = evaluateRow(input, config, parity);
    rows.push(row);
    if (row.accepted === "?") pending += 1;

    const ch = chapters.get(input.chapterNo) ?? emptyAccumulator();
    accumulate(ch, input, row, config);
    chapters.set(input.chapterNo, ch);
    accumulate(total, input, row, config);
    if (input.dimensionId !== null) {
      const d = dimAcc.get(input.dimensionId) ?? emptyAccumulator();
      accumulate(d, input, row, config);
      dimAcc.set(input.dimensionId, d);
    }
  }

  const dimensions: DimensionResult[] = [...dimAcc.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dimensionId, a]) => ({
      dimensionId,
      scoreNum: a.scoreNum,
      scoreDen: a.scoreDen,
      statusNum: a.statusNum,
      statusDen: a.statusDen,
      scorePct: ratio(a.scoreNum, a.scoreDen),
      statusPct: ratio(a.statusNum, a.statusDen),
    }));

  const indices: PhaseIndices = {
    index1: ratio(total.scoreNum, total.scoreDen),
    index2: ratio(total.gateDone, total.gateTotal),
    index3: ratio(total.startNum, total.statusDen),
    index4: pending,
  };

  return { rows, chapters, dimensions, indices };
}
