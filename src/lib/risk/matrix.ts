// Matriks risiko 5x5 PRISMA (Likelihood x Impact) — satu-satunya sumber nomor sel dan level warna.
// Baris = likelihood 5..1 (atas ke bawah), kolom = impact 1..5 (kiri ke kanan), sama dengan layar Risk Heatmap PRISMA.

export type RiskLevel = 1 | 2 | 3 | 4 | 5;

/** Nomor sel (rank) per [likelihood][impact]. */
const RANK: Record<number, number[]> = {
  5: [7, 12, 17, 22, 25],
  4: [4, 9, 14, 19, 24],
  3: [3, 8, 13, 18, 23],
  2: [2, 6, 11, 16, 21],
  1: [1, 5, 10, 15, 20],
};

/** Level warna per [likelihood][impact]: 1 Rendah … 5 Tinggi. */
const LEVEL: Record<number, RiskLevel[]> = {
  5: [2, 3, 4, 5, 5],
  4: [1, 2, 3, 4, 5],
  3: [1, 2, 3, 4, 5],
  2: [1, 2, 2, 4, 5],
  1: [1, 1, 2, 3, 5],
};

export const LEVEL_LABEL: Record<RiskLevel, string> = {
  1: "Rendah",
  2: "Rendah–Menengah",
  3: "Menengah",
  4: "Menengah–Tinggi",
  5: "Tinggi",
};

export function cellRank(likelihood: number, impact: number): number {
  return RANK[likelihood][impact - 1];
}

export function riskLevel(likelihood: number, impact: number): RiskLevel {
  return LEVEL[likelihood][impact - 1];
}

/** Rating agregat proyek = level tertinggi di antara risiko yang masih terbuka; null bila tidak ada. */
export function aggregateLevel(risks: { likelihood: number; impact: number; status: string }[]): RiskLevel | null {
  const open = risks.filter((r) => r.status === "OPEN");
  if (open.length === 0) return null;
  return Math.max(...open.map((r) => riskLevel(r.likelihood, r.impact))) as RiskLevel;
}
