import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/paginate";
import type { SearchParams } from "@/lib/paginate";
import { Card, Empty, GateBadge, PageHeader, td, th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { getConfig, listProjects, projectPhaseSummaries } from "@/lib/db/tracker";
import { pct } from "@/lib/format";

/** Engine 1 — PM Tracker: Scorecard Grid per fase + Riwayat Fase + Export Scorecard. */
export default async function TrackerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requirePermission("project.read");
  const [config, projects] = await Promise.all([getConfig(), listProjects(user)]);
  const pg = paginate(projects, await searchParams);
  const all = await Promise.all(pg.rows.map(async (p) => ({ p, phases: await projectPhaseSummaries(p, config) })));
  return (
    <div>
      <PageHeader title="Scorecard Proyek" subtitle="Engine 1 — PM Tracker · seluruh fase tetap terbaca utuh (riwayat fase) · export scorecard per fase" />
      {projects.length === 0 ? <Empty>Tidak ada proyek.</Empty> : null}
      <div className="space-y-4">
        {all.map(({ p, phases }) => (
          <Card key={p.id} title={<span className="normal-case">{p.code} · {p.name} · {p.project_type_1}{p.project_type_2 ? ` + ${p.project_type_2}` : ""}</span>}>
            <table className="w-full">
              <thead><tr><th className={th}>Fase</th><th className={th}>Gate</th><th className={th}>FDMI</th><th className={th}>FGDI</th><th className={th}>FDCI</th><th className={th}>?</th><th className={th}>Aksi</th></tr></thead>
              <tbody>
                {phases.map(({ instance, scorecard }) => (
                  <tr key={instance.id}>
                    <td className={td}>{instance.phase_code}{instance.phase_code === p.current_phase ? <span className="ml-2 text-xs text-indigo-600">berjalan</span> : null}</td>
                    <td className={td}><GateBadge status={instance.gate_status} /></td>
                    <td className={td}>{pct(scorecard.result.indices.index1)}</td>
                    <td className={td}>{pct(scorecard.result.indices.index2)}</td>
                    <td className={td}>{pct(scorecard.result.indices.index3)}</td>
                    <td className={td}>{scorecard.result.indices.index4}</td>
                    <td className={`${td} space-x-3`}>
                      <Link className="text-indigo-600 underline" href={`/projects/${p.id}/phases/${instance.phase_code}`}>Buka scorecard</Link>
                      <a className="text-indigo-600 underline" href={`/projects/${p.id}/phases/${instance.phase_code}/export`}>Export CSV</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
      <Pagination page={pg} />
    </div>
  );
}
