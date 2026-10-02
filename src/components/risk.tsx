import type { ReactNode } from "react";
import type { PrismaRisk } from "@/lib/db/prisma";
import { cellRank, LEVEL_LABEL, riskLevel, type RiskLevel } from "@/lib/risk/matrix";
import { td, th } from "./ui";

const LEVEL_BG: Record<RiskLevel, string> = {
  1: "bg-risk-1",
  2: "bg-risk-2",
  3: "bg-risk-3",
  4: "bg-risk-4",
  5: "bg-risk-5",
};
/** Nomor sel: putih di sel gelap, abu transparan di sel terang (kontras tetap terbaca). */
const LEVEL_NUM: Record<RiskLevel, string> = {
  1: "text-white/90",
  2: "text-slate-600/60",
  3: "text-slate-600/60",
  4: "text-white/90",
  5: "text-white/90",
};

export function LevelBadge({ level }: { level: RiskLevel | null }) {
  if (level === null) return <span className="text-slate-400">—</span>;
  const dark = level === 1 || level === 5;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${LEVEL_BG[level]} ${dark ? "text-white" : "text-slate-900"}`}>
      {LEVEL_LABEL[level]}
    </span>
  );
}

export interface HeatmapMarker {
  label: string;
  likelihood: number;
  impact: number;
  title: string;
}

/** Risk Heatmap 5x5 — sumbu Y Likelihood (5 di atas), sumbu X Impact; penanda hitam = risiko. */
export function RiskHeatmap({ markers }: { markers: HeatmapMarker[] }) {
  const rows = [5, 4, 3, 2, 1];
  const cols = [1, 2, 3, 4, 5];
  return (
    <div className="flex gap-2">
      <div className="flex w-6 items-center justify-center">
        <span className="-rotate-90 whitespace-nowrap text-xs font-semibold text-slate-700">Likelihood</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex">
          <div className="flex w-6 flex-col border-r border-slate-700">
            {rows.map((l) => (
              <div key={l} className="flex h-14 items-center justify-center text-xs text-slate-500 md:h-16">{l}</div>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-5 gap-1 pl-1">
            {rows.flatMap((l) =>
              cols.map((i) => {
                const level = riskLevel(l, i);
                const here = markers.filter((m) => m.likelihood === l && m.impact === i);
                return (
                  <div
                    key={`${l}-${i}`}
                    className={`relative h-14 rounded-md md:h-16 ${LEVEL_BG[level]}`}
                    title={`Likelihood ${l} × Impact ${i} — ${LEVEL_LABEL[level]}${here.length ? `\n${here.map((m) => m.title).join("\n")}` : ""}`}
                  >
                    <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
                      {here.slice(0, 6).map((m) => (
                        <span key={m.label} className="flex h-5 min-w-5 items-center justify-center rounded bg-black px-1 text-[10px] font-semibold text-white">
                          {m.label}
                        </span>
                      ))}
                      {here.length > 6 ? <span className="text-[10px] font-semibold">+{here.length - 6}</span> : null}
                    </div>
                    <span className={`absolute bottom-1 right-1.5 text-xs font-medium ${LEVEL_NUM[level]}`}>{cellRank(l, i)}</span>
                  </div>
                );
              }),
            )}
          </div>
        </div>
        <div className="ml-6 grid grid-cols-5 gap-1 border-t border-slate-700 pl-1 pt-2">
          {cols.map((i) => <div key={i} className="text-center text-xs text-slate-500">{i}</div>)}
        </div>
        <div className="mt-1 text-center text-xs font-semibold text-slate-700">Impact</div>
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
      {([1, 2, 3, 4, 5] as RiskLevel[]).map((l) => (
        <span key={l} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm ${LEVEL_BG[l]}`} />{LEVEL_LABEL[l]}</span>
      ))}
    </div>
  );
}

/** Kurva halus (Catmull-Rom → Bezier) untuk seri garis. */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function niceMax(v: number): number {
  if (v <= 5) return 5;
  const step = v <= 20 ? 5 : v <= 50 ? 10 : 20;
  return Math.ceil(v / step) * step;
}

const MONTH = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** History: batang navy = risiko Open, garis oranye = risiko Mitigated per periode. */
export function RiskHistoryChart({ rows }: { rows: { period: string; open: number; mitigated: number }[] }) {
  const W = 640;
  const H = 300;
  const pad = { l: 40, r: 16, t: 16, b: 36 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...rows.flatMap((r) => [r.open, r.mitigated])));
  const slot = iw / Math.max(1, rows.length);
  const bw = Math.min(46, slot * 0.4);
  const x = (i: number) => pad.l + slot * i + slot / 2;
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => Math.round(t * max));
  const line = rows.map((r, i) => [x(i), y(r.mitigated)] as [number, number]);
  const label = (p: string) => {
    const d = new Date(`${p}T00:00:00`);
    return `${MONTH[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  };
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Riwayat risiko open dan mitigated">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e3e6eb" />
            <text x={pad.l - 8} y={y(t) + 4} fontSize="11" textAnchor="end" fill="#64748b">{t}</text>
          </g>
        ))}
        {rows.map((r, i) => (
          <g key={r.period}>
            <rect x={x(i) - bw / 2} y={y(r.open)} width={bw} height={pad.t + ih - y(r.open)} rx="6" fill="var(--color-brand-blue)">
              <title>{`${label(r.period)} — Open ${r.open}`}</title>
            </rect>
            <text x={x(i)} y={H - 12} fontSize="11" textAnchor="middle" fill="#64748b">{label(r.period)}</text>
          </g>
        ))}
        <path d={smoothPath(line)} fill="none" stroke="var(--color-brand-orange)" strokeWidth="2" />
        {line.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="var(--color-brand-orange)">
            <title>{`${label(rows[i].period)} — Mitigated ${rows[i].mitigated}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-2 flex justify-center gap-6 text-sm text-slate-700">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-brand-blue" />Open</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-brand-orange" />Mitigated</span>
      </div>
    </div>
  );
}

export function TopRiskList({ risks, showProject = false }: { risks: PrismaRisk[]; showProject?: boolean }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="bg-slate-50">
          <th className="w-14 px-3 py-3 text-left text-sm font-semibold text-slate-900">No</th>
          <th className="px-3 py-3 text-left text-sm font-semibold text-slate-900">Risk</th>
        </tr>
      </thead>
      <tbody>
        {risks.map((r, i) => (
          <tr key={`${r.project_code}-${r.risk_id}`} className="border-b border-line">
            <td className="px-3 py-3 align-top text-sm">{showProject ? i + 1 : r.top_rank}.</td>
            <td className="px-3 py-3 text-[15px] leading-relaxed text-slate-800">
              {r.description}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {showProject ? <span className="font-medium text-brand-navy">{r.project_code}</span> : null}
                <LevelBadge level={riskLevel(r.likelihood, r.impact)} />
                <span>L{r.likelihood} × I{r.impact}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const STATUS: Record<string, string> = { OPEN: "Open", MITIGATED: "Mitigated", CLOSED: "Closed" };

export function RiskDetailTable({ risks, showProject = false, extra }: { risks: PrismaRisk[]; showProject?: boolean; extra?: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      {extra}
      <table className="w-full min-w-[960px]">
        <thead>
          <tr>
            {showProject ? <th className={th}>Proyek</th> : null}
            <th className={th}>Risk ID</th>
            <th className={th}>Taksonomi Risiko</th>
            <th className={th}>Deskripsi Risiko</th>
            <th className={th}>Penyebab Risiko</th>
            <th className={th}>Dampak Risiko</th>
            <th className={th}>Level</th>
            <th className={th}>Mitigasi</th>
          </tr>
        </thead>
        <tbody>
          {risks.map((r) => (
            <tr key={`${r.project_code}-${r.risk_id}`}>
              {showProject ? <td className={`${td} whitespace-nowrap font-medium`}>{r.project_code}</td> : null}
              <td className={`${td} whitespace-nowrap`}>{r.risk_id}</td>
              <td className={td}>{r.taxonomy}</td>
              <td className={`${td} min-w-56`}>{r.description}</td>
              <td className={`${td} min-w-56`}>{r.cause}</td>
              <td className={`${td} min-w-56`}>{r.impact_desc}</td>
              <td className={`${td} whitespace-nowrap`}>
                <LevelBadge level={riskLevel(r.likelihood, r.impact)} />
                <div className="mt-1 text-xs text-slate-500">L{r.likelihood} × I{r.impact} · sel {cellRank(r.likelihood, r.impact)}</div>
              </td>
              <td className={`${td} min-w-48`}>
                <div className={`text-xs font-semibold ${r.status === "OPEN" ? "text-brand-red" : "text-emerald-700"}`}>{STATUS[r.status]}</div>
                <div className="text-xs text-slate-600">{r.mitigation ?? "—"}</div>
                <div className="mt-1 h-1.5 w-full rounded bg-slate-100"><div className="h-1.5 rounded bg-brand-blue" style={{ width: `${r.mitigation_progress}%` }} /></div>
                <div className="mt-0.5 text-xs text-slate-500">{r.mitigation_progress}% · {r.owner}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PrismaSetupNotice() {
  return (
    <div className="rounded-card border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
      <div className="mb-1 text-base font-semibold">Tabel risk register PRISMA belum dibuat</div>
      Jalankan <code className="rounded bg-white px-1">supabase/migrations/20261002000000_prisma_risk.sql</code> di Supabase SQL Editor
      (file sudah berisi data dummy), lalu muat ulang halaman ini.
    </div>
  );
}
