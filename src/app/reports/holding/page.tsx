import { forbidden } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { BarChart, td, th } from "@/components/ui";
import { currentUser, isMindId, requirePermission } from "@/lib/auth/session";
import { currentPhaseOverview, getConfig, getOrganizations, listProjects } from "@/lib/db/tracker";
import { dateTime, pct } from "@/lib/format";

export default async function HoldingReport() {
  await requirePermission("project.read");
  const user = await currentUser();
  if (!isMindId(user)) forbidden(); // perbandingan lintas AH khusus MIND ID (BR-16)
  const [projects, orgs, config] = await Promise.all([listProjects(user), getOrganizations(), getConfig()]);
  const overview = await currentPhaseOverview(projects);
  const rows = orgs.filter((o) => o.kind === "MEMBER").map((o) => {
    const ps = projects.filter((p) => p.organization_id === o.id);
    const v = ps.map((p) => overview.get(p.id)!.result.indices.index1).filter((x): x is number => x !== null);
    return { org: o, count: ps.length, avg: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null };
  });
  return (
    <div className="mx-auto max-w-4xl bg-white p-8 text-sm shadow print:shadow-none">
      <div className="flex items-start justify-between">
        <div><div className="text-xs uppercase text-slate-500">R-02</div><h1 className="text-xl font-semibold">Perbandingan Kematangan Antar Anggota Holding</h1></div>
        <PrintButton />
      </div>
      <div className="mt-4"><BarChart threshold={config.gateMinMaturityPct} rows={rows.map((r) => ({ label: r.org.name, value: r.avg, sub: `${r.count} proyek` }))} /></div>
      <table className="mt-4 w-full">
        <thead><tr><th className={th}>Anggota Holding</th><th className={th}>Proyek aktif</th><th className={th}>Rata-rata Index 1 (fase berjalan)</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.org.id}><td className={td}>{r.org.name}</td><td className={td}>{r.count}</td><td className={td}>{pct(r.avg)}</td></tr>)}</tbody>
      </table>
      <p className="mt-8 text-xs text-slate-500">Dicetak oleh {user.name} pada {dateTime(new Date().toISOString())}.</p>
    </div>
  );
}
