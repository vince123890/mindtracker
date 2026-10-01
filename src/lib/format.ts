/** Persen dibulatkan; pembagi nol (null) ditampilkan "—", bukan 0% (AM-3). */
export function pct(v: number | null | undefined): string {
  return v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`;
}

export function num(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function dateTime(v: string | null | undefined): string {
  if (!v) return "—";
  return new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
}

export function date(v: string | null | undefined): string {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });
}

export const GATE_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  WAITING_APPROVAL: "Menunggu Persetujuan",
  APPROVED: "Disetujui",
  REVISION_REQUIRED: "Perlu Revisi",
};

export const REQUIREMENT_LABEL: Record<string, string> = {
  G: "G — Mandatory Gate Control",
  A: "A — Applicable",
  C: "C — Conditional",
  N: "Not Required",
  "?": "? — Belum diputuskan",
};
