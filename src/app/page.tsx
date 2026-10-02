import type { SearchParams } from "@/lib/paginate";
import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/paginate";
import Link from "next/link";
import { MotionDashboard } from "@/components/motion-dashboard";
import type { DashboardMotionProps } from "@/remotion/DashboardMotion";
import { BarChart, Card, DummyBadge, Empty, GateBadge, PageHeader, ReqBadge, td, th } from "@/components/ui";
import { can, ROLE_LABEL, type Role } from "@/lib/auth/roles";
import { currentUser, isMindId } from "@/lib/auth/session";
import { isOverdue, listActionPlans, listProduction, listRca, RCA_STATUS_LABEL } from "@/lib/db/do";
import { db, must } from "@/lib/db/client";
import { currentPhaseOverview, getConfig, getDimensions, getOrganizations, listProjects, type Scorecard } from "@/lib/db/tracker";
import { dateTime, pct } from "@/lib/format";

// Widget × Role — Analysis/menu_blue_print.md §1.2
const W: Record<string, Role[]> = {
  portfolio: ["PMO_ADMIN", "DIREKTUR_MIND_ID", "DIVISI_MIND_ID", "DIREKTUR_AH", "PMO_AH"],
  indexTable: ["PMO_ADMIN", "DIREKTUR_MIND_ID", "DIVISI_MIND_ID", "DIREKTUR_AH", "PMO_AH", "TIM_PROYEK"],
  maturityChart: ["PMO_ADMIN", "DIREKTUR_MIND_ID", "DIREKTUR_AH", "PMO_AH"],
  index23: ["PMO_ADMIN", "DIVISI_MIND_ID", "PMO_AH"],
  dimension: ["PMO_ADMIN", "DIREKTUR_MIND_ID", "DIVISI_MIND_ID", "DIREKTUR_AH"],
  byHolding: ["PMO_ADMIN", "DIREKTUR_MIND_ID", "DIVISI_MIND_ID"],
  gateQueue: ["PMO_ADMIN", "DIREKTUR_MIND_ID"],
  myTasks: ["PMO_AH", "TIM_PROYEK"],
  feedback: ["DIVISI_MIND_ID", "PMO_AH", "TIM_PROYEK"],
  production: ["PMO_ADMIN", "DIREKTUR_MIND_ID", "DIVISI_DO_MIND_ID", "DIREKTUR_AH", "PIC_OPERASI_AH"],
  rca: ["DIREKTUR_MIND_ID", "DIVISI_DO_MIND_ID", "DIREKTUR_AH", "PIC_OPERASI_AH"],
  gateBlockers: ["PMO_ADMIN", "PMO_AH"],
};

function actionable(sc: Scorecard) {
  let empty = 0, gateLow = 0;
  sc.result.rows.forEach((r, i) => {
    const m = sc.meta[i];
    if ((r.accepted === "G" || r.accepted === "A") && m.score === null && !m.isNa) empty++;
    if (r.accepted === "G" && r.completion === 0) gateLow++;
  });
  return { empty, gateLow, pending: sc.result.indices.index4 };
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await currentUser();
  const show = (k: string) => W[k].includes(user.role);
  const tracker = can(user.role, "project.read");

  const [config, projects, dimensions, orgs] = await Promise.all([
    getConfig(),
    tracker ? listProjects(user) : Promise.resolve([]),
    getDimensions(),
    getOrganizations(),
  ]);
  const overview = tracker ? await currentPhaseOverview(projects) : new Map<string, Scorecard>();
  const cards = projects.map((p) => ({ p, sc: overview.get(p.id)! }));
  const sp = await searchParams;
  const pgTask = paginate(cards, sp, "task");
  const pgIdx = paginate(cards, sp, "idx");
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));

  const [production, rcas, actionPlans] = await Promise.all([
    show("production") ? listProduction(user) : Promise.resolve([]),
    show("rca") ? listRca(user) : Promise.resolve([]),
    show("rca") ? listActionPlans(user) : Promise.resolve([]),
  ]);

  const feedback = show("feedback") && cards.length
    ? (must(
        await db()
          .from("revision_log_entry")
          .select("id, body, created_at, is_blocking, phase_instance_id, author:author_id(name), ppi:phase_instance_id(phase_code, project:project_id(id, code))")
          .in("phase_instance_id", cards.map((c) => c.sc.instance.id))
          .order("created_at", { ascending: false })
          .limit(6),
        "feedback",
      ) as unknown as { id: number; body: string; created_at: string; is_blocking: boolean; author: { name: string } | null; ppi: { phase_code: string; project: { id: string; code: string } } }[])
    : [];

  const avgIndex1 = (() => {
    const v = cards.map((c) => c.sc.result.indices.index1).filter((x): x is number => x !== null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  })();

  // Data grafik animasi — sumber yang sama dengan widget di bawah (bukan angka terpisah)
  const isDoRole = user.role === "DIVISI_DO_MIND_ID" || user.role === "PIC_OPERASI_AH";
  const prodKeys = [...new Set(production.map((x) => `${x.organization_id} · ${x.product}`))];
  const prodBars = prodKeys.map((key) => {
    const rows = production.filter((x) => `${x.organization_id} · ${x.product}` === key);
    return { label: key, value: rows.length ? rows.reduce((a, r) => a + r.actual / r.target, 0) / rows.length : null };
  });
  const motion: DashboardMotionProps = isDoRole
    ? {
        title: "Downstream Operations",
        subtitle: `${isMindId(user) ? "Seluruh Anggota Holding" : user.organizationName} · data produksi dummy`,
        kpis: [
          { label: "Rata-rata pencapaian", value: prodBars.length ? prodBars.reduce((a, b) => a + (b.value ?? 0), 0) / prodBars.length : null, format: "pct" },
          { label: "RCA menunggu review", value: rcas.filter((r) => r.status === "MENUNGGU_REVIEW").length, format: "int" },
          { label: "Action plan terlambat", value: actionPlans.filter(isOverdue).length, format: "int" },
          { label: "Menunggu verifikasi", value: actionPlans.filter((a) => a.status === "DONE_PENDING_VERIFY").length, format: "int" },
        ],
        barsTitle: "Realisasi ÷ target produksi (6 bulan)",
        bars: prodBars,
        threshold: 1,
        thresholdLabel: "Target 100%",
        pairsTitle: "",
        pairLabels: ["", ""],
        pairs: [],
        footnote: "",
      }
    : {
        title: isMindId(user) ? "Portofolio MIND ID" : `Proyek ${user.organizationName}`,
        subtitle: "Index fase berjalan · tracker v1.4",
        kpis: [
          { label: "Rata-rata FDMI", value: avgIndex1, format: "pct" },
          { label: "Proyek aktif", value: cards.length, format: "int" },
          { label: "Menunggu persetujuan", value: cards.filter((c) => c.sc.instance.gate_status === "WAITING_APPROVAL").length, format: "int" },
          { label: "Siap ajukan gate", value: cards.filter((c) => c.sc.blocking.length === 0 && c.sc.instance.gate_status === "DRAFT").length, format: "int" },
        ],
        barsTitle: "Overall Maturity (FDMI) per proyek",
        bars: cards.map(({ p, sc }) => ({ label: `${p.code} · ${p.current_phase}`, value: sc.result.indices.index1 })),
        threshold: config.gateMinMaturityPct,
        thresholdLabel: `Ambang gate ${pct(config.gateMinMaturityPct)}`,
        pairsTitle: "Gate Control (FGDI) vs Deliverable Started (FDCI)",
        pairLabels: [`FGDI — G skor ≥ ${config.passThreshold}`, `FDCI — skor ≥ ${config.startThreshold}`],
        pairs: cards.map(({ p, sc }) => ({ label: p.code, a: sc.result.indices.index2, b: sc.result.indices.index3 })),
        footnote: "FGDI wajib 100% untuk naik fase",
      };
  const showMotion = isDoRole ? production.length > 0 : cards.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard — ${ROLE_LABEL[user.role]}`}
        subtitle={isMindId(user) ? "Portofolio seluruh Anggota Holding" : `Data ${user.organizationName}`}
      />

      {showMotion ? <MotionDashboard data={motion} /> : null}

      {show("portfolio") ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Proyek aktif", String(cards.length)],
            ["Menunggu persetujuan gate", String(cards.filter((c) => c.sc.instance.gate_status === "WAITING_APPROVAL").length)],
            ["Rata-rata Index 1 (FDMI)", pct(avgIndex1)],
            ["Proyek siap ajukan gate", String(cards.filter((c) => c.sc.blocking.length === 0 && c.sc.instance.gate_status === "DRAFT").length)],
          ].map(([k, v]) => (
            <Card key={k}>
              <div className="text-xs text-slate-500">{k}</div>
              <div className="text-2xl font-bold">{v}</div>
            </Card>
          ))}
        </div>
      ) : null}

      {show("myTasks") ? (
        <Card title="Tugas saya — fase berjalan">
          {cards.length === 0 ? <Empty>Tidak ada proyek.</Empty> : (
            <><table className="w-full">
              <thead><tr><th className={th}>Proyek</th><th className={th}>Fase</th><th className={th}>Belum diisi</th><th className={th}>Gate Control &lt; 3</th><th className={th}>Belum diputuskan (?)</th><th className={th}></th></tr></thead>
              <tbody>
                {pgTask.rows.map(({ p, sc }) => {
                  const a = actionable(sc);
                  return (
                    <tr key={p.id}>
                      <td className={td}>{p.code} · {p.name}</td>
                      <td className={td}>{p.current_phase} <GateBadge status={sc.instance.gate_status} /></td>
                      <td className={td}>{a.empty}</td>
                      <td className={`${td} ${a.gateLow ? "font-semibold text-rose-700" : ""}`}>{a.gateLow}</td>
                      <td className={`${td} ${a.pending ? "font-semibold text-amber-700" : ""}`}>{a.pending}</td>
                      <td className={td}><Link className="text-indigo-600 underline" href={`/projects/${p.id}/phases/${p.current_phase}?filter=action`}>Buka scorecard</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={pgTask} /></>
          )}
        </Card>
      ) : null}

      {show("indexTable") ? (
        <Card title="Proyek & Index fase berjalan (FDMI · FGDI · FDCI · ?)">
          {cards.length === 0 ? <Empty>Tidak ada proyek.</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={th}>Proyek</th>
                    {isMindId(user) ? <th className={th}>Anggota Holding</th> : null}
                    <th className={th}>Tipe</th><th className={th}>Fase</th><th className={th}>Gate</th>
                    <th className={th}>Index 1</th><th className={th}>Index 2</th><th className={th}>Index 3</th><th className={th}>Index 4</th>
                  </tr>
                </thead>
                <tbody>
                  {pgIdx.rows.map(({ p, sc }) => {
                    const i = sc.result.indices;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className={td}><Link className="font-medium text-indigo-700 hover:underline" href={`/projects/${p.id}`}>{p.code}</Link><div className="text-xs text-slate-500">{p.name}</div></td>
                        {isMindId(user) ? <td className={td}>{orgName.get(p.organization_id)}</td> : null}
                        <td className={td}>{p.project_type_1}{p.project_type_2 ? ` + ${p.project_type_2}` : ""}</td>
                        <td className={td}>{p.current_phase}</td>
                        <td className={td}><GateBadge status={sc.instance.gate_status} /></td>
                        <td className={`${td} ${i.index1 !== null && config.gateMinMaturityPct !== null && i.index1 < config.gateMinMaturityPct ? "text-rose-700" : ""}`}>{pct(i.index1)}</td>
                        <td className={`${td} ${i.index2 !== null && i.index2 < 1 ? "text-rose-700" : ""}`}>{pct(i.index2)}</td>
                        <td className={td}>{pct(i.index3)}</td>
                        <td className={`${td} ${i.index4 > 0 ? "text-amber-700" : ""}`}>{i.index4}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination page={pgIdx} />
            </div>
          )}
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {show("maturityChart") && cards.length ? (
          <Card title="Overall Maturity (Index 1) — fase berjalan">
            <BarChart threshold={config.gateMinMaturityPct} rows={cards.map(({ p, sc }) => ({ label: `${p.code} · ${p.current_phase}`, value: sc.result.indices.index1 }))} />
          </Card>
        ) : null}
        {show("index23") && cards.length ? (
          <Card title="Index 2 (FGDI) & Index 3 (FDCI)">
            <BarChart rows={cards.flatMap(({ p, sc }) => [
              { label: `${p.code} · FGDI`, value: sc.result.indices.index2 },
              { label: `${p.code} · FDCI`, value: sc.result.indices.index3 },
            ])} />
          </Card>
        ) : null}
        {show("dimension") && cards.length ? (
          <Card title="SCORE per dimensi (rata-rata fase berjalan)">
            <BarChart rows={dimensions.map((d) => {
              let num = 0, den = 0;
              cards.forEach(({ sc }) => sc.result.dimensions.filter((x) => x.dimensionId === d.id).forEach((x) => { num += x.scoreNum; den += x.scoreDen; }));
              return { label: d.name, value: den ? num / den : null };
            })} />
          </Card>
        ) : null}
        {show("byHolding") && cards.length ? (
          <Card title="Kematangan per Anggota Holding (khusus MIND ID)">
            <BarChart threshold={config.gateMinMaturityPct} rows={[...new Set(cards.map((c) => c.p.organization_id))].map((org) => {
              const v = cards.filter((c) => c.p.organization_id === org).map((c) => c.sc.result.indices.index1).filter((x): x is number => x !== null);
              return { label: orgName.get(org) ?? org, value: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null, sub: `${cards.filter((c) => c.p.organization_id === org).length} proyek` };
            })} />
          </Card>
        ) : null}
        {show("gateQueue") ? (
          <Card title="Antrean persetujuan gate">
            {cards.filter((c) => c.sc.instance.gate_status === "WAITING_APPROVAL").length === 0 ? <Empty>Tidak ada pengajuan.</Empty> : (
              <ul className="space-y-2 text-sm">
                {cards.filter((c) => c.sc.instance.gate_status === "WAITING_APPROVAL").map(({ p, sc }) => (
                  <li key={p.id} className="flex justify-between">
                    <span>{p.code} — {sc.instance.phase_code} · diajukan {dateTime(sc.instance.submitted_at)}</span>
                    {can(user.role, "gate.approve") ? <Link className="text-indigo-600 underline" href="/gates">Tinjau</Link> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}
        {show("gateBlockers") && cards.length ? (
          <Card title="Penahan gate per proyek">
            <ul className="space-y-2 text-sm">
              {cards.map(({ p, sc }) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span>{p.code} · {p.current_phase}</span>
                  <span className="flex gap-2">
                    {sc.blocking.length === 0 ? <span className="text-emerald-700">✓ siap diajukan</span> : sc.blocking.map((b) => <span key={b.code} className="rounded bg-rose-50 px-2 text-xs text-rose-700">{b.code}</span>)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        {show("feedback") ? (
          <Card title="Feedback terbaru dari MIND ID">
            {feedback.length === 0 ? <Empty>Belum ada feedback.</Empty> : (
              <ul className="space-y-3 text-sm">
                {feedback.map((f) => (
                  <li key={f.id}>
                    <div className="text-xs text-slate-500">{f.author?.name} · {f.ppi.project.code} {f.ppi.phase_code} · {dateTime(f.created_at)} {f.is_blocking ? <ReqBadge value="?" /> : null}</div>
                    <div>{f.body}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}
        {show("production") ? (
          <Card title={<span className="flex items-center gap-2">Kinerja produksi (6 bulan) <DummyBadge /></span>} source="mct.production">
            <BarChart threshold={1} rows={[...new Set(production.map((x) => `${x.organization_id} · ${x.product}`))].map((key) => {
              const rows = production.filter((x) => `${x.organization_id} · ${x.product}` === key);
              const t = rows.reduce((a, r) => a + r.target, 0);
              const a = rows.reduce((s, r) => s + r.actual, 0);
              return { label: key, value: t ? a / t : null, sub: rows[0]?.unit };
            })} />
            <p className="mt-2 text-xs text-slate-500">Batang = realisasi ÷ target. Garis = 100% target.</p>
          </Card>
        ) : null}
        {show("rca") ? (
          <Card title="RCA & Action Plan">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(RCA_STATUS_LABEL).map(([k, label]) => (
                <div key={k} className="rounded bg-slate-50 p-2"><div className="text-xs text-slate-500">RCA {label}</div><div className="text-xl font-semibold">{rcas.filter((r) => r.status === k).length}</div></div>
              ))}
              <div className="rounded bg-rose-50 p-2"><div className="text-xs text-rose-700">Action plan terlambat</div><div className="text-xl font-semibold text-rose-700">{actionPlans.filter(isOverdue).length}</div></div>
              <div className="rounded bg-amber-50 p-2"><div className="text-xs text-amber-700">Menunggu verifikasi</div><div className="text-xl font-semibold text-amber-700">{actionPlans.filter((a) => a.status === "DONE_PENDING_VERIFY").length}</div></div>
            </div>
            <Link href="/do/rca" className="mt-3 inline-block text-sm text-indigo-600 underline">Buka RCA</Link>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
