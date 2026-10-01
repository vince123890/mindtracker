import { describe, expect, it } from "vitest";
import { calculateRto, type RtoInput } from "./rto";

const r = (id: number, sub: string, score: number | null, delivered: boolean, extra: Partial<RtoInput> = {}): RtoInput => ({
  requirementId: id, subElementCode: sub, pillarId: Number(sub.split(".")[0]), weight: 1,
  applicable: true, maturityScore: score, isDelivered: delivered, isNa: false, ...extra,
});

describe("RTO — Maturity dan Deliverable Completion terpisah", () => {
  it("dua metrik dapat berbeda jauh untuk data yang sama", () => {
    const res = calculateRto([r(1, "1.1", 2, true), r(2, "1.1", 2, true)]);
    expect(res.overall.maturity).toBe(0.5);
    expect(res.overall.completion).toBe(1);
  });

  it("agregasi pilar memakai akumulator, bukan rata-rata persen sub-elemen", () => {
    const inputs = [r(1, "1.1", 4, true), ...Array.from({ length: 9 }, (_, i) => r(i + 2, "1.2", 0, false))];
    const res = calculateRto(inputs);
    expect(res.pillars.get(1)!.maturity).toBeCloseTo(0.1, 10); // bukan (100% + 0%) / 2 = 50%
    expect(res.pillars.get(1)!.completion).toBeCloseTo(0.1, 10);
  });

  it("sub-elemen tidak berlaku dan NA dikeluarkan; pembagi nol → null", () => {
    const res = calculateRto([r(1, "5.3", 4, true, { applicable: false }), r(2, "5.3", null, false, { isNa: true })]);
    expect(res.subElements.get("5.3")!.maturity).toBeNull();
    expect(res.subElements.get("5.3")!.completion).toBeNull();
  });
});
