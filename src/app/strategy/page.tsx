import { Card, DummyBadge, PageHeader, td, th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { db, must } from "@/lib/db/client";

interface Scenario {
  code: string;
  name: string;
  description: string | null;
  source: string;
  variables: Record<string, number>;
  projections: Record<string, number>;
}

const LABEL: Record<string, string> = {
  harga_nikel_usd_t: "Harga nikel (USD/t)",
  kurs: "Kurs (Rp/USD)",
  utilisasi: "Utilisasi",
  pendapatan_t_rp: "Pendapatan (Rp triliun)",
  ebitda_t_rp: "EBITDA (Rp triliun)",
  irr: "IRR",
};

const fmt = (k: string, v: number) => (k === "utilisasi" || k === "irr" ? `${Math.round(v * 100)}%` : v.toLocaleString("id-ID"));

export default async function StrategyPage() {
  await requirePermission("strategy.read");
  const scenarios = must(await db().from("strategy_scenario").select("*").order("code"), "strategy_scenario") as Scenario[];
  const varKeys = [...new Set(scenarios.flatMap((s) => Object.keys(s.variables)))];
  const projKeys = [...new Set(scenarios.flatMap((s) => Object.keys(s.projections)))];
  return (
    <div>
      <PageHeader
        title="Downstream Strategy & Simulation"
        subtitle={<span className="flex items-center gap-2">Menampilkan output aplikasi simulasi eksternal — sistem tidak menjalankan simulasi · <DummyBadge /></span>}
      />
      <Card title="Perbandingan skenario" source="simulation.strategy">
        <table className="w-full">
          <thead><tr><th className={th}>Parameter</th>{scenarios.map((s) => <th key={s.code} className={th}>{s.code} · {s.name}</th>)}</tr></thead>
          <tbody>
            <tr><td className={`${td} font-semibold`} colSpan={scenarios.length + 1}>Variabel</td></tr>
            {varKeys.map((k) => <tr key={k}><td className={td}>{LABEL[k] ?? k}</td>{scenarios.map((s) => <td key={s.code} className={`${td} text-right`}>{s.variables[k] !== undefined ? fmt(k, s.variables[k]) : "—"}</td>)}</tr>)}
            <tr><td className={`${td} font-semibold`} colSpan={scenarios.length + 1}>Proyeksi</td></tr>
            {projKeys.map((k) => <tr key={k}><td className={td}>{LABEL[k] ?? k}</td>{scenarios.map((s) => <td key={s.code} className={`${td} text-right font-medium`}>{s.projections[k] !== undefined ? fmt(k, s.projections[k]) : "—"}</td>)}</tr>)}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-500">Angka hasil simulasi tidak dapat diedit (BR-35). Sumber: {scenarios[0]?.source}.</p>
      </Card>
    </div>
  );
}
