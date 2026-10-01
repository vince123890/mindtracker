import { describe, expect, it } from "vitest";
import fixture from "./fixtures/tracker-v1.4.json";
import { calculatePhase, effectiveWeight, overallRequirement, acceptedRequirement } from "./engine";
import { evaluateGate } from "./gate";
import { DEFAULT_CONFIG, type Marker, type ScoreInput, type ScoringConfig } from "./types";

type FixtureDeliverable = (typeof fixture.deliverables)[number];
const DIM: Record<number, number | null> = { 3: 2, 4: 2, 6: 2, 7: 2, 10: 1, 11: 4, 15: 3 };

function inputsFor(
  phase: string,
  type1: string,
  type2: string | null,
  score: (d: FixtureDeliverable) => number | null,
): ScoreInput[] {
  return fixture.deliverables
    .filter((d) => d.phase === phase)
    .map((d) => {
      const appl = d.applicability as Record<string, { marker: string; modifier: number }>;
      return {
        deliverableId: d.id,
        chapterNo: d.chapterNo,
        dimensionId: DIM[d.chapterNo] ?? null,
        code: d.code,
        baseWeight: d.baseWeight,
        type1: { marker: appl[type1].marker as Marker, modifier: appl[type1].modifier },
        type2: type2 ? { marker: appl[type2].marker as Marker, modifier: appl[type2].modifier } : null,
        score: score(d),
        isNa: false,
        resolution: null,
      };
    });
}

const EXCEL_PARITY = { excelRequirement: true, excelDenominatorWeight: true };
const PARITY_CONFIG: ScoringConfig = { ...DEFAULT_CONFIG, naTreatment: "EXCEL_PARITY" };
const excelScore = (d: FixtureDeliverable) => (typeof d.excelScore === "number" ? d.excelScore : null);

describe("primitives", () => {
  it("overall requirement picks the strongest of two types (G > A > C > blank)", () => {
    expect(overallRequirement("A", "G")).toBe("G");
    expect(overallRequirement("C", "A")).toBe("A");
    expect(overallRequirement("C", null)).toBe("C");
    expect(overallRequirement("N", "C")).toBe("C");
  });

  it("F-01: Excel parity drops A to Not Required, production keeps it", () => {
    expect(overallRequirement("A", null, { excelRequirement: true })).toBe("N");
    expect(overallRequirement("A", null)).toBe("A");
  });

  it("conditional decision maps to G / A / Not Required, otherwise unresolved", () => {
    expect(acceptedRequirement("C", "GATE")).toBe("G");
    expect(acceptedRequirement("C", "APPLICABLE")).toBe("A");
    expect(acceptedRequirement("C", "NOT_REQUIRED")).toBe("N");
    expect(acceptedRequirement("C", null)).toBe("?");
  });

  it("effective weight = base × max modifier, without rounding", () => {
    expect(effectiveWeight(3.5, 1.15, 0.9)).toBeCloseTo(4.025, 10);
    expect(effectiveWeight(4, 1.25, null)).toBe(5);
  });
});

describe("parity with cached values of Dummy Tracker v1.4 (Type 1 NMF, Type 2 NFP)", () => {
  const cached = fixture.excelCachedIndices as Record<string, { index1: number; index2: number; index3: number }>;

  for (const phase of ["FEL-0", "FEL-1", "FEL-2", "FEL-3"]) {
    it(`${phase}: Index 1–3 equal Excel E3:E5 in parity mode`, () => {
      const inputs = inputsFor(phase, "NMF", "NFP", excelScore);
      const r = calculatePhase(inputs, PARITY_CONFIG, EXCEL_PARITY);
      expect(r.indices.index1 ?? 0).toBeCloseTo(cached[phase].index1, 9);
      expect(r.indices.index2 ?? 0).toBeCloseTo(cached[phase].index2, 9);
      expect(r.indices.index3 ?? 0).toBeCloseTo(cached[phase].index3, 9);
    });
  }

  it("FEL-1 Index 1 = 6 / (4 × 253.2)", () => {
    const r = calculatePhase(inputsFor("FEL-1", "NMF", "NFP", excelScore), PARITY_CONFIG, EXCEL_PARITY);
    expect(r.indices.index1).toBeCloseTo(6 / (4 * 253.2), 12);
  });

  it("production mode differs only because of F-01/F-02 (FEL-3: 0.0831 → 0.0091)", () => {
    const r = calculatePhase(inputsFor("FEL-3", "NMF", "NFP", excelScore), DEFAULT_CONFIG);
    expect(r.indices.index1).toBeCloseTo(0.009145, 5);
    expect(r.indices.index3).toBeCloseTo(0.015873, 5);
  });
});

describe("F-02: Index 1 never exceeds 100% in production", () => {
  const full = () => 4;
  it("NFP + NMF FEL-0 with full scores: Excel > 100%, production = 100%", () => {
    const inputs = inputsFor("FEL-0", "NFP", "NMF", full);
    const excel = calculatePhase(inputs, PARITY_CONFIG, EXCEL_PARITY);
    const prod = calculatePhase(inputs, DEFAULT_CONFIG);
    expect(excel.indices.index1!).toBeGreaterThan(2.5);
    expect(prod.indices.index1).toBeCloseTo(1, 12);
  });

  for (const [t1, t2] of [["NMF", "NFP"], ["MPM", "NSI"], ["NSI", "m-PM"]] as const) {
    for (const phase of ["FEL-0", "FEL-1", "FEL-2", "FEL-3"]) {
      it(`${t1}+${t2} ${phase}`, () => {
        const r = calculatePhase(
          inputsFor(phase, t1, t2, full).map((i) => ({ ...i, resolution: "APPLICABLE" as const })),
          DEFAULT_CONFIG,
        );
        if (r.indices.index1 !== null) expect(r.indices.index1).toBeCloseTo(1, 12);
      });
    }
  }
});

describe("NA treatment", () => {
  const base: ScoreInput = {
    deliverableId: 1, chapterNo: 10, dimensionId: 1, code: "X-1", baseWeight: 1,
    type1: { marker: "A", modifier: 1 }, type2: null, score: 4, isNa: false, resolution: null,
  };
  const inputs = [base, { ...base, deliverableId: 2, code: "X-2", score: null, isNa: true }];

  it("EXCLUDE removes NA from numerator and denominator", () => {
    expect(calculatePhase(inputs, DEFAULT_CONFIG).indices.index1).toBe(1);
  });
  it("EXCEL_PARITY keeps NA in the denominator", () => {
    expect(calculatePhase(inputs, PARITY_CONFIG).indices.index1).toBe(0.5);
  });
});

describe("zero denominator and gate guard", () => {
  const row = (id: number, marker: Marker, score: number | null, extra: Partial<ScoreInput> = {}): ScoreInput => ({
    deliverableId: id, chapterNo: 10, dimensionId: 1, code: `BC-${id}`, baseWeight: 1,
    type1: { marker, modifier: marker === "N" ? 0 : 1 }, type2: null, score, isNa: false, resolution: null, ...extra,
  });

  it("all Not Required → indices are null, not 0", () => {
    const r = calculatePhase([row(1, "N", null)], DEFAULT_CONFIG);
    expect(r.indices).toEqual({ index1: null, index2: null, index3: null, index4: 0 });
    expect(r.dimensions[0].scorePct).toBeNull();
    expect(r.dimensions[0].statusPct).toBeNull();
  });

  it("one G below 3 blocks the gate even with high maturity (non-compensatory)", () => {
    const inputs = [row(1, "G", 2), ...Array.from({ length: 20 }, (_, i) => row(i + 2, "A", 4))];
    const r = calculatePhase(inputs, DEFAULT_CONFIG);
    expect(r.indices.index1!).toBeGreaterThan(0.9);
    const reasons = evaluateGate(inputs, r, DEFAULT_CONFIG);
    expect(reasons.map((x) => x.code)).toEqual(["GATE-02"]);
    expect(reasons[0].items).toEqual(["BC-1 (skor 2)"]);
  });

  it("unresolved conditional and low maturity are all reported together", () => {
    const inputs = [row(1, "C", null), row(2, "G", 2), row(3, "A", 1)];
    const r = calculatePhase(inputs, DEFAULT_CONFIG);
    expect(evaluateGate(inputs, r, DEFAULT_CONFIG).map((x) => x.code)).toEqual(["GATE-01", "GATE-02", "GATE-03"]);
  });

  it("passes when Index 4 = 0, all G ≥ 3 and Index 1 ≥ 60%", () => {
    const inputs = [row(1, "G", 3), row(2, "A", 3), row(3, "C", 4, { resolution: "APPLICABLE" })];
    const r = calculatePhase(inputs, DEFAULT_CONFIG);
    expect(evaluateGate(inputs, r, DEFAULT_CONFIG)).toEqual([]);
  });
});
