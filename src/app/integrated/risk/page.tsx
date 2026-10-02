import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/paginate";
import Link from "next/link";
import { HeatmapLegend, LevelBadge, PrismaSetupNotice, RiskDetailTable, RiskHeatmap, RiskHistoryChart, TopRiskList } from "@/components/risk";
import { btnGhost, Card, SourceNote, DummyBadge, Empty, input, PageHeader, td, th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { listRiskHistory, listRisks, prismaAvailable, sumHistory, type PrismaRisk } from "@/lib/db/prisma";
import { listProjects } from "@/lib/db/tracker";
import { aggregateLevel, riskLevel } from "@/lib/risk/matrix";

const severity = (r: PrismaRisk) => riskLevel(r.likelihood, r.impact) * 100 + r.likelihood * r.impact;

/**
 * Risk PRISMA — portofolio (Analysis: Integrasi PRISMA — Project indicator, Risk Matrix, Mitigation Status,
 * Risk Aggregate dan Rating). Data dummy; integrasi read-only dikerjakan saat development.
 */
export default async function PrismaRiskPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("integrated.read");
  const sp = await searchParams;
  if (!(await prismaAvailable())) {
    return (
      <div className="space-y-6">
        <PageHeader title="Risk PRISMA — Portofolio" />
        <PrismaSetupNotice />
      </div>
    );
  }
  const [all, history, projects] = await Promise.all([listRisks(user), listRiskHistory(user), listProjects(user)]);
  const projectByCode = new Map(projects.map((p) => [p.code, p]));
  const codes = [...new Set(all.map((r) => r.project_code))];
  const taxonomies = [...new Set(all.map((r) => r.taxonomy))].sort();

  const risks = all.filter(
    (r) => (!sp.project || r.project_code === sp.project) && (!sp.taxonomy || r.taxonomy === sp.taxonomy) && (!sp.status || r.status === sp.status),
  );
  const open = risks.filter((r) => r.status === "OPEN");
  const high = open.filter((r) => riskLevel(r.likelihood, r.impact) === 5);
  const mitigatedPct = risks.length ? Math.round(((risks.length - open.length) / risks.length) * 100) : null;

  // Heatmap portofolio: satu penanda per sel berisi jumlah risiko open
  const cells = new Map<string, PrismaRisk[]>();
  for (const r of open) cells.set(`${r.likelihood}-${r.impact}`, [...(cells.get(`${r.likelihood}-${r.impact}`) ?? []), r]);
  const markers = [...cells.values()].map((rs) => ({
    label: String(rs.length),
    likelihood: rs[0].likelihood,
    impact: rs[0].impact,
    title: rs.map((r) => `${r.project_code} ${r.risk_id} — ${r.title}`).join("\n"),
  }));
  const pgRisk = paginate([...risks].sort((a, b) => severity(b) - severity(a)), sp, "risk");
  const pgAgg = paginate(codes, sp, "agg");
  const top = [...open].sort((a, b) => severity(b) - severity(a)).slice(0, 10);
  const histRows = sumHistory(history.filter((h) => !sp.project || h.project_code === sp.project));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk PRISMA — Portofolio"
        subtitle={<span className="flex flex-wrap items-center gap-2">Risk matrix, status mitigasi, dan rating agregat per proyek <DummyBadge /></span>}
      />

      <form className="no-print flex flex-wrap items-end gap-3 rounded-card border border-line bg-white p-4 text-sm">
        <label className="w-56">Proyek
          <select name="project" defaultValue={sp.project ?? ""} className={input}>
            <option value="">Semua proyek</option>
            {codes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="w-48">Taksonomi
          <select name="taxonomy" defaultValue={sp.taxonomy ?? ""} className={input}>
            <option value="">Semua</option>
            {taxonomies.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="w-40">Status
          <select name="status" defaultValue={sp.status ?? ""} className={input}>
            <option value="">Semua</option>
            <option value="OPEN">Open</option>
            <option value="MITIGATED">Mitigated</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
        <button className={btnGhost}>Terapkan</button>
      </form>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Proyek dipantau", value: String(sp.project ? 1 : codes.length), tone: "text-slate-900" },
          { label: "Risiko open", value: String(open.length), tone: "text-brand-navy" },
          { label: "Open level Tinggi", value: String(high.length), tone: "text-brand-red" },
          { label: "Sudah dimitigasi", value: mitigatedPct === null ? "—" : `${mitigatedPct}%`, tone: "text-emerald-700" },
        ].map((k) => (
          <div key={k.label} className="rounded-card border border-line bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{k.label}</div>
            <div className={`mt-1 text-3xl font-bold ${k.tone}`}>{k.value}</div>
          </div>
        ))}
      </div>
      <SourceNote source="prisma.aggregate" className="-mt-3" />

      {risks.length === 0 ? <Empty>Tidak ada risiko untuk filter ini.</Empty> : (
        <>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <Card title="Risk Heatmap" source="prisma.matrix">
                <RiskHeatmap markers={markers} />
                <HeatmapLegend />
                <p className="mt-2 text-xs text-slate-500">Penanda hitam = jumlah risiko open pada sel tersebut (arahkan kursor untuk daftar risiko).</p>
              </Card>
              <Card title="History" source="prisma.history">
                <RiskHistoryChart rows={histRows} />
              </Card>
            </div>
            <Card title="Top Risk" className="lg:col-span-5" source="prisma.top">
              {top.length ? <TopRiskList risks={top} showProject /> : <Empty>Tidak ada risiko open.</Empty>}
            </Card>
          </div>

          {!sp.project ? (
            <Card title="Risk Aggregate & Rating per Proyek" source="prisma.aggregate">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr><th className={th}>Proyek</th><th className={th}>Rating</th><th className={th}>Open</th><th className={th}>Mitigated</th><th className={th}>Progres mitigasi rata-rata</th><th className={th}>Top risk</th></tr>
                  </thead>
                  <tbody>
                    {pgAgg.rows.map((code) => {
                      const rs = all.filter((r) => r.project_code === code);
                      const o = rs.filter((r) => r.status === "OPEN");
                      const avg = o.length ? Math.round(o.reduce((a, r) => a + r.mitigation_progress, 0) / o.length) : null;
                      const t1 = rs.find((r) => r.top_rank === 1);
                      const p = projectByCode.get(code);
                      return (
                        <tr key={code}>
                          <td className={td}>
                            {p ? <Link className="font-medium text-brand-navy hover:underline" href={`/projects/${p.id}?tab=risk`}>{code}</Link> : <span className="font-medium">{code}</span>}
                            <div className="text-xs text-slate-500">{p?.name ?? "di luar tracker (fase EPC)"}</div>
                          </td>
                          <td className={td}><LevelBadge level={aggregateLevel(rs)} /></td>
                          <td className={td}>{o.length}</td>
                          <td className={td}>{rs.length - o.length}</td>
                          <td className={td}>
                            {avg === null ? "—" : (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-32 rounded bg-slate-100"><div className="h-2 rounded bg-brand-blue" style={{ width: `${avg}%` }} /></div>
                                <span>{avg}%</span>
                              </div>
                            )}
                          </td>
                          <td className={td}>{t1?.title ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination page={pgAgg} />
              </div>
            </Card>
          ) : null}

          <Card title="Detail Risk" source="prisma.detail">
            <RiskDetailTable risks={pgRisk.rows} showProject={!sp.project} />
            <Pagination page={pgRisk} />
          </Card>
        </>
      )}
    </div>
  );
}
