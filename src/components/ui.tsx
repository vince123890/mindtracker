import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import { GATE_LABEL, pct } from "@/lib/format";
import type { PhaseIndices, ScoringConfig } from "@/lib/scoring/types";

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Tautan tombol kembali (panah kiri) di samping judul. */
  back?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {back ? (
          <Link href={back} className="no-print mt-1 rounded-lg p-1 text-slate-600 hover:bg-white hover:text-brand-navy" aria-label="Kembali">
            <Icon name="ArrowLeft" className="h-6 w-6" />
          </Link>
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{title}</h1>
          {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
        </div>
      </div>
      {actions ? <div className="no-print flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, children, className = "", actions }: { title?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={`rounded-card border border-line bg-card p-5 shadow-sm md:p-6 ${className}`}>
      {title || actions ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Tab bar halaman (pola "Projects Detail" PRISMA): latar biru muda, tab aktif putih. */
export function Tabs({ items }: { items: { href: string; label: string; icon?: string; active: boolean }[] }) {
  return (
    <nav className="no-print mb-6 flex gap-2 overflow-x-auto rounded-card border border-tab-line bg-tab p-2" aria-label="Tab">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors ${t.active ? "bg-white font-semibold text-brand-navy shadow-sm" : "bg-slate-200/60 text-slate-700 hover:bg-white/80"}`}
        >
          {t.icon ? <Icon name={t.icon} className="h-4 w-4" /> : null}
          {t.label}
        </Link>
      ))}
    </nav>
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
                className={`h-5 rounded ${threshold != null && r.value < threshold ? "bg-brand-orange" : "bg-brand-blue"}`}
                style={{ width: `${Math.min(100, Math.max(0, r.value * 100))}%` }}
              />
            ) : null}
            {threshold != null ? (
              <div className="absolute top-0 h-5 border-l-2 border-dashed border-brand-red" style={{ left: `${threshold * 100}%` }} />
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
  return <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{children}</div>;
}

export function LinkButton({ href, children, tone = "primary" }: { href: string; children: ReactNode; tone?: "primary" | "ghost" }) {
  return (
    <Link href={href} className={tone === "primary" ? btn : btnGhost}>
      {children}
    </Link>
  );
}

export const btn = "inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-dark disabled:opacity-50";
export const btnGhost = "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
export const btnDanger = "inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white hover:bg-brand-red-dark";
export const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-navy focus:ring-2 focus:ring-indigo-100 focus:outline-none";
/** Header tabel navy (pola tabel "Detail Risk"). */
export const th = "bg-brand-navy px-3 py-3 text-left text-sm font-semibold text-white first:rounded-tl-lg last:rounded-tr-lg";
export const td = "border-b border-line px-3 py-3 align-top text-sm";
