import type { DashboardMotionProps } from "./DashboardMotion";

/** Contoh props untuk render verifikasi via CLI — angka sama dengan hasil supabase/seed.sql. */
export const SAMPLE_PROPS: DashboardMotionProps = {
  title: "Portofolio MIND ID",
  subtitle: "Index fase berjalan · tracker v1.4",
  kpis: [
    { label: "Rata-rata FDMI (Index 1)", value: 0.5806, format: "pct" },
    { label: "Proyek aktif", value: 4, format: "int" },
    { label: "Menunggu persetujuan gate", value: 1, format: "int" },
    { label: "Siap ajukan gate", value: 0, format: "int" },
  ],
  barsTitle: "Overall Maturity (FDMI) per proyek",
  bars: [
    { label: "PRJ-ANTAM-001 · FEL-1", value: 0.5791 },
    { label: "PRJ-ANTAM-002 · FEL-1", value: 0.8212 },
    { label: "PRJ-PTBA-001 · FEL-2", value: 0.5813 },
    { label: "PRJ-TIMAH-001 · FEL-1", value: 0.1393 },
  ],
  threshold: 0.6,
  thresholdLabel: "Ambang gate 60%",
  pairsTitle: "Gate Control (FGDI) vs Deliverable Started (FDCI)",
  pairLabels: ["FGDI — G skor ≥ 3", "FDCI — skor ≥ 1"],
  pairs: [
    { label: "PRJ-ANTAM-001", a: 0.5577, b: 0.8158 },
    { label: "PRJ-ANTAM-002", a: 1, b: 1 },
    { label: "PRJ-PTBA-001", a: 0.6324, b: 0.8284 },
    { label: "PRJ-TIMAH-001", a: 0.0588, b: 0.35 },
  ],
  footnote: "FGDI wajib 100% untuk naik fase",
};
