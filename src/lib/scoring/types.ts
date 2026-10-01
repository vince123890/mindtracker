// Tipe domain scoring engine — docs/SPEK-RUMUS-Tracker-v1.4.md

export type Marker = "G" | "A" | "C" | "N"; // N = Not Required (sel kosong di Excel)
export type Accepted = "G" | "A" | "N" | "?"; // ? = Conditional belum diputuskan
export type ConditionalResolution = "GATE" | "APPLICABLE" | "NOT_REQUIRED";
export type NaTreatment = "EXCLUDE" | "EXCEL_PARITY";

export interface ScoringConfig {
  version: number;
  startThreshold: number; // Starting Status (kolom Z) — default 1
  passThreshold: number; // Completion Status (kolom AA) — default 3
  maxScore: number; // default 4
  gateMinMaturityPct: number | null; // Index 1 — default 0.60
  gateControlMustComplete: boolean; // Index 2 = 100%
  naTreatment: NaTreatment;
}

export const DEFAULT_CONFIG: ScoringConfig = {
  version: 1,
  startThreshold: 1,
  passThreshold: 3,
  maxScore: 4,
  gateMinMaturityPct: 0.6,
  gateControlMustComplete: true,
  naTreatment: "EXCLUDE",
};

/** Mode replikasi Excel v1.4 — HANYA untuk uji paritas (AM-21). */
export interface ParityOptions {
  /** F-01: kode A tidak dikenali rumus Excel → jatuh menjadi Not Required. */
  excelRequirement?: boolean;
  /** F-02: pembagi memakai bobot Type 1 saja. */
  excelDenominatorWeight?: boolean;
}

export interface Applicability {
  marker: Marker;
  modifier: number;
}

export interface ScoreInput {
  deliverableId: number;
  chapterNo: number;
  dimensionId: number | null;
  code: string;
  baseWeight: number;
  type1: Applicability;
  type2: Applicability | null;
  score: number | null;
  isNa: boolean;
  resolution: ConditionalResolution | null;
}

export interface RowResult {
  deliverableId: number;
  overall: Marker;
  accepted: Accepted;
  effectiveWeight: number;
  /** Bobot pembagi (sama dengan effectiveWeight kecuali mode paritas F-02). */
  denominatorWeight: number;
  starting: 0 | 1 | "NA" | null;
  completion: 0 | 1 | "NA" | null;
  weightedScore: number | "NA";
}

export interface Accumulator {
  scoreNum: number;
  scoreDen: number;
  statusNum: number;
  statusDen: number;
  startNum: number;
  gateTotal: number;
  gateDone: number;
}

export interface DimensionResult {
  dimensionId: number;
  scoreNum: number;
  scoreDen: number;
  statusNum: number;
  statusDen: number;
  scorePct: number | null;
  statusPct: number | null;
}

export interface PhaseIndices {
  /** FDMI — FEL Delivery Maturity Index */
  index1: number | null;
  /** FGDI — FEL Gate Control Deliverable Index */
  index2: number | null;
  /** FDCI — FEL Deliverable Completeness Index */
  index3: number | null;
  /** Deliverables with requirements still to be defined */
  index4: number;
}

export interface PhaseResult {
  rows: RowResult[];
  chapters: Map<number, Accumulator>;
  dimensions: DimensionResult[];
  indices: PhaseIndices;
}
