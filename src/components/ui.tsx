import Link from "next/link";
import type { ReactNode } from "react";
import { GATE_LABEL, pct } from "@/lib/format";
import type { PhaseIndices, ScoringConfig } from "@/lib/scoring/types";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {title ? <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2> : null}
      {children}
    </section>
  );
}

const GATE_TONE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  WAITING_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REVISION_REQUIRED: "bg-rose-100 text-rose-800",
};

export function GateBadge({ status }: { status: string }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${GATE_TONE[status] ?? ""}`}>{GATE_LABEL[status] ?? status}</span>;
}

const REQ_TONE: Record<string, string> = {
  G: "bg-indigo-600 text-white",
  A: "bg-sky-100 text-sky-800",
  "?": "bg-amber-400 text-amber-950",
  N: "bg-slate-100 text-slate-400",
  C: "bg-amber-100 text-amber-800",
};

export function ReqBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-300">–</span>;
  const label = value === "N" ? "N/R" : value;
  return <span className={`inline-block min-w-7 rounded px-1.5 py-0.5 text-center text-xs font-semibold ${REQ_TONE[value] ?? ""}`}>{label}</span>;
}

export function DummyBadge() {
  return (
    <span className="rounded border border-dashed border-amber-500 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
      🧪 Data dummy — integrasi dikerjakan saat development
    </span>
  );
}

/** Empat Index fase (FDMI, FGDI, FDCI, undefined) dengan penanda ambang gate. */
export function IndexCards({ indices, config }: { indices: PhaseIndices; config: ScoringConfig }) {
  const gateMin = config.gateMinMaturityPct;
  const items = [
    {
      label: "Index 1 · FDMI",
      hint: "Overall Maturity",
      value: pct(indices.index1),
      ok: gateMin === null || (indices.index1 !== null && indices.index1 >= gateMin),
      rule: gateMin === null ? "tanpa ambang" : `ambang ≥ ${Math.round(gateMin * 100)}%`,
    },
    {
      label: "Index 2 · FGDI",
      hint: "Gate Control skor ≥ 3",
      value: pct(indices.index2),
      ok: !config.gateControlMustComplete || indices.index2 === null || indices.index2 >= 1,
      rule: "wajib 100%",
    },
    { label: "Index 3 · FDCI", hint: "Deliverable mulai (skor ≥ 1)", value: pct(indices.index3), ok: true, rule: "indikator" },
    {
      label: "Index 4",
      hint: "Requirement belum diputuskan (?)",
      value: String(indices.index4),
      ok: indices.index4 === 0,
      rule: "wajib 0",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className={`rounded-lg border p-3 ${i.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
          <div className="text-xs font-semibold text-slate-600">{i.label}</div>
          <div className="text-2xl font-bold text-slate-900">{i.value}</div>
          <div className="text-xs text-slate-500">{i.hint}</div>
          <div className={`mt-1 text-xs ${i.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {i.ok ? "✓" : "✗"} {i.rule}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BarChart({
  rows,
  threshold,
}: {
  rows: { label: string; value: number | null; sub?: string }[];
  threshold?: number | null;
}) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 text-sm">
          <div className="w-44 shrink-0 truncate text-slate-600" title={r.label}>
            {r.label}
          </div>
          <div className="relative h-5 flex-1 rounded bg-slate-100">
            {r.value !== null ? (
              <div
                className={`h-5 rounded ${threshold != null && r.value < threshold ? "bg-amber-400" : "bg-indigo-500"}`}
                style={{ width: `${Math.min(100, Math.max(0, r.value * 100))}%` }}
              />
            ) : null}
            {threshold != null ? (
              <div className="absolute top-0 h-5 border-l-2 border-dashed border-rose-500" style={{ left: `${threshold * 100}%` }} />
            ) : null}
          </div>
          <div className="w-14 text-right font-medium text-slate-800">{pct(r.value)}</div>
          {r.sub ? <div className="w-24 text-xs text-slate-400">{r.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{children}</div>;
}

export function LinkButton({ href, children, tone = "primary" }: { href: string; children: ReactNode; tone?: "primary" | "ghost" }) {
  const cls =
    tone === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700"
      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50";
  return (
    <Link href={href} className={`rounded px-3 py-1.5 text-sm font-medium ${cls}`}>
      {children}
    </Link>
  );
}

export const btn = "rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50";
export const btnGhost = "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50";
export const btnDanger = "rounded bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700";
export const input = "w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none";
export const th = "border-b border-slate-200 bg-slate-50 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
export const td = "border-b border-slate-100 px-2 py-2 align-top text-sm";
