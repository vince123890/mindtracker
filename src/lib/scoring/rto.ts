// RTO Tool — dua metrik terpisah (FR-3.2.2, TL §3.10). Agregasi memakai akumulator,
// BUKAN rata-rata persentase (sub-elemen kecil tidak boleh berbobot sama dengan yang besar).

export interface RtoInput {
  requirementId: number;
  subElementCode: string;
  pillarId: number;
  weight: number;
  applicable: boolean; // dari "Applicable Sub-Element per Proyek"
  maturityScore: number | null;
  isDelivered: boolean;
  isNa: boolean;
}

export interface RtoAcc {
  maturityNum: number;
  maturityDen: number;
  delivered: number;
  total: number;
}

export interface RtoMetrics extends RtoAcc {
  maturity: number | null;
  completion: number | null;
}

const empty = (): RtoAcc => ({ maturityNum: 0, maturityDen: 0, delivered: 0, total: 0 });

function add(acc: RtoAcc, r: RtoInput, maxScore: number): void {
  if (!r.applicable || r.isNa) return;
  acc.maturityNum += r.weight * (r.maturityScore ?? 0);
  acc.maturityDen += maxScore * r.weight;
  acc.total += 1;
  if (r.isDelivered) acc.delivered += 1;
}

function finish(a: RtoAcc): RtoMetrics {
  return {
    ...a,
    maturity: a.maturityDen === 0 ? null : a.maturityNum / a.maturityDen,
    completion: a.total === 0 ? null : a.delivered / a.total,
  };
}

export function calculateRto(inputs: RtoInput[], maxScore = 4) {
  const bySub = new Map<string, RtoAcc>();
  const byPillar = new Map<number, RtoAcc>();
  const overall = empty();
  for (const r of inputs) {
    const s = bySub.get(r.subElementCode) ?? empty();
    const p = byPillar.get(r.pillarId) ?? empty();
    add(s, r, maxScore);
    add(p, r, maxScore);
    add(overall, r, maxScore);
    bySub.set(r.subElementCode, s);
    byPillar.set(r.pillarId, p);
  }
  return {
    subElements: new Map([...bySub].map(([k, v]) => [k, finish(v)])),
    pillars: new Map([...byPillar].map(([k, v]) => [k, finish(v)])),
    overall: finish(overall),
  };
}
