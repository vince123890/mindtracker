import type { SearchParams } from "@/lib/paginate";
import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/paginate";
import { ActionForm } from "@/components/action-form";
import { LineChart } from "@/components/line-chart";
import { btn, Card, Empty, input, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { requirePermission } from "@/lib/auth/session";
import { listSnapshots } from "@/lib/db/snapshots";
import { getConfig, listProjects } from "@/lib/db/tracker";
import { dateTime, pct } from "@/lib/format";
import { buildSnapshots } from "./actions";

const COLORS = ["#4f46e5", "#059669", "#d97706", "#db2777", "#0891b2"];

export default async function SnapshotsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requirePermission("project.read");
  const [config, projects] = await Promise.all([getConfig(), listProjects(user)]);
  const snaps = await listSnapshots(projects);
  const proj = new Map(projects.map((p) => [p.id, p]));
  const monthly = snaps.filter((s) => s.label !== "PHASE_CLOSE");
  const labels = [...new Set(monthly.map((s) => s.label))].sort();
  const keys = [...new Set(monthly.map((s) => `${s.ppi.project_id}|${s.ppi.phase_code}`))];
  const series = keys.map((k, i) => {
    const [pid, phase] = k.split("|");
    return {
      name: `${proj.get(pid)?.code} · ${phase}`,
      color: COLORS[i % COLORS.length],
      values: labels.map((l) => monthly.find((s) => s.label === l && `${s.ppi.project_id}|${s.ppi.phase_code}` === k)?.indices.index1 ?? null),
    };
  });

  const snapsDesc = [...snaps].reverse();
  const pg = paginate(snapsDesc, await searchParams);
  return (
    <div className="space-y-4">
      <PageHeader title="Snapshot & Progress Curve" subtitle="Snapshot bulanan bersifat immutable · kurva Index 1 (FDMI) sepanjang fase — mendeteksi progres yang menumpuk di akhir fase" />
      {can(user.role, "snapshot.build") ? (
        <Card title="Snapshot Builder (manual — job terjadwal dikerjakan saat development)">
          <ActionForm action={buildSnapshots} className="flex flex-wrap items-end gap-2" okMessage="Snapshot diproses.">
            <label className="text-sm">Periode<input name="label" defaultValue={new Date().toISOString().slice(0, 7)} className={input} /></label>
            <button className={btn}>Bentuk snapshot fase berjalan</button>
          </ActionForm>
        </Card>
      ) : null}
      <Card title="Progress Curve — Index 1 per periode">
        {series.length === 0 ? <Empty>Belum ada snapshot bulanan.</Empty> : (
          <>
            <LineChart labels={labels} series={series} threshold={config.gateMinMaturityPct} />
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {series.map((s) => <span key={s.name} className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded" style={{ background: s.color }} />{s.name}</span>)}
              <span className="text-rose-600">- - - ambang gate {pct(config.gateMinMaturityPct)}</span>
            </div>
          </>
        )}
      </Card>
      <Card title="Daftar snapshot">
        <table className="w-full">
          <thead><tr><th className={th}>Periode</th><th className={th}>Proyek · Fase</th><th className={th}>FDMI</th><th className={th}>FGDI</th><th className={th}>FDCI</th><th className={th}>?</th><th className={th}>Config</th><th className={th}>Dibentuk</th></tr></thead>
          <tbody>
            {pg.rows.map((s) => (
              <tr key={s.id}>
                <td className={td}>{s.label === "PHASE_CLOSE" ? "Penutup fase" : s.label}</td>
                <td className={td}>{proj.get(s.ppi.project_id)?.code} · {s.ppi.phase_code}</td>
                <td className={td}>{pct(s.indices.index1)}</td>
                <td className={td}>{pct(s.indices.index2)}</td>
                <td className={td}>{pct(s.indices.index3)}</td>
                <td className={td}>{s.indices.index4}</td>
                <td className={td}>v{s.config_version}</td>
                <td className={td}>{dateTime(s.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={pg} />
      </Card>
    </div>
  );
}
