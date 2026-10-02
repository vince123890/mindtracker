import Link from "next/link";
import { LevelBadge } from "@/components/risk";
import { Card, DummyBadge, PageHeader, SourceNote, td, th } from "@/components/ui";
import { listRisks } from "@/lib/db/prisma";
import { aggregateLevel, riskLevel } from "@/lib/risk/matrix";
import { can } from "@/lib/auth/roles";
import { currentUser, isMindId, requirePermission } from "@/lib/auth/session";
import { db, must } from "@/lib/db/client";
import { isOverdue, listActionPlans, listProduction, listRca } from "@/lib/db/do";
import { currentPhaseOverview, listProjects } from "@/lib/db/tracker";
import { pct } from "@/lib/format";

interface Ext { project_code: string; [k: string]: string | number | null }

const SCHEDULE: Record<string, string> = { ON_TRACK: "text-emerald-700", AT_RISK: "text-amber-700", DELAYED: "text-rose-700" };
const STAGES = ["FEL-0", "FEL-1", "FEL-2", "FEL-3", "EPC", "DO"];

/** Integrated Dashboard (Landing) — ringkasan lintas fungsi BD / PMO / DO (PT-01 §1). */
export default async function IntegratedPage() {
  await requirePermission("integrated.read");
  const user = await currentUser();
  const trackerVisible = can(user.role, "project.read") || can(user.role, "crossholding.read");
  const projects = trackerVisible ? await listProjects(user) : [];
  const overview = await currentPhaseOverview(projects);
  const [progress, docs, risks] = await Promise.all([
    db().from("ext_project_progress").select("*"),
    db().from("ext_project_document").select("*"),
    listRisks(user),
  ]);
  const allowedCodes = new Set(projects.map((p) => p.code));
  const visible = (rows: Ext[]) => rows.filter((r) => isMindId(user) || allowedCodes.has(r.project_code));
  const prog = visible(must(progress, "ext_project_progress") as Ext[]);
  const doc = new Map(visible(must(docs, "ext_project_document") as Ext[]).map((r) => [r.project_code, r]));
  const showDo = can(user.role, "do.read");
  const [production, rcas, aps] = showDo ? await Promise.all([listProduction(user), listRca(user), listActionPlans(user)]) : [[], [], []];

  const codes = [...new Set([...projects.map((p) => p.code), ...prog.map((p) => p.project_code)])];
  const stageOf = (code: string) => projects.find((p) => p.code === code)?.current_phase ?? (prog.find((p) => p.project_code === code)?.stage as string) ?? "—";
  const target = production.reduce((a, r) => a + r.target / r.target, 0);
  const achieved = production.reduce((a, r) => a + r.actual / r.target, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Integrated Dashboard"
        subtitle={<span className="flex flex-wrap items-center gap-2">Monitoring lintas fungsi Business Development · PMO · Downstream Operations <DummyBadge /></span>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><div className="text-xs text-slate-500">PMO — proyek dipantau tracker</div><div className="text-2xl font-bold">{projects.length}</div><div className="mt-1 text-[11px] text-slate-500">Sumber: MIND Tracker (internal)</div></Card>
        <Card><div className="text-xs text-slate-500">BD — FS lengkap (MIND Gate)</div><div className="text-2xl font-bold">{[...doc.values()].filter((d) => Number(d.fs_completeness) >= 100).length} / {doc.size}</div><SourceNote compact source="mindgate.document" className="mt-1" /></Card>
        <Card><div className="text-xs text-slate-500">Risiko open level Tinggi (PRISMA)</div><div className="text-2xl font-bold text-brand-red">{risks.filter((r) => r.status === "OPEN" && riskLevel(r.likelihood, r.impact) === 5).length}</div><Link className="text-xs text-brand-navy underline" href="/integrated/risk">Lihat Risk PRISMA</Link><SourceNote compact source="prisma.aggregate" className="mt-1" /></Card>
        <Card><div className="text-xs text-slate-500">DO — pencapaian produksi rata-rata</div><div className="text-2xl font-bold">{showDo && target ? pct(achieved / target) : "—"}</div>{showDo ? <div className="text-xs text-rose-700">{aps.filter(isOverdue).length} action plan terlambat · {rcas.filter((r) => r.status === "MENUNGGU_REVIEW").length} RCA menunggu review</div> : null}<SourceNote compact source="mct.production.derived" className="mt-1" /></Card>
      </div>

      <Card title="Peta proyek FEL-0 → EPC → DO" source={["mindproject.progress", "prisma.aggregate", "mindgate.document"]}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Proyek</th>
                {STAGES.map((s) => <th key={s} className={`${th} text-center`}>{s}</th>)}
                <th className={th}>Kematangan (FDMI)</th><th className={th}>Progres fisik</th><th className={th}>Jadwal</th><th className={th}>Risiko</th><th className={th}>Dokumen / FID</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => {
                const p = projects.find((x) => x.code === code);
                const sc = p ? overview.get(p.id) : undefined;
                const pr = prog.find((x) => x.project_code === code);
                const rs = risks.filter((x) => x.project_code === code);
                const openRs = rs.filter((x) => x.status === "OPEN");
                const d = doc.get(code);
                const stage = stageOf(code);
                const idx = STAGES.indexOf(stage);
                return (
                  <tr key={code}>
                    <td className={td}>{p ? <Link className="font-medium text-indigo-700 hover:underline" href={`/projects/${p.id}`}>{code}</Link> : code}<div className="text-xs text-slate-500">{p?.name ?? "di luar tracker (fase EPC — MIND Project)"}</div></td>
                    {STAGES.map((s, i) => (
                      <td key={s} className={`${td} text-center`}>
                        <span className={`inline-block h-3 w-3 rounded-full ${i < idx ? "bg-indigo-300" : i === idx ? "bg-indigo-600 ring-4 ring-indigo-100" : "bg-slate-200"}`} />
                      </td>
                    ))}
                    <td className={td}>{sc ? pct(sc.result.indices.index1) : "—"}</td>
                    <td className={td}>{pr ? `${pr.physical_progress}%` : "—"}</td>
                    <td className={`${td} ${SCHEDULE[String(pr?.schedule_status)] ?? ""}`}>{pr?.schedule_status ?? "—"}</td>
                    <td className={td}>{rs.length ? <><LevelBadge level={aggregateLevel(rs)} /> <span className="text-xs">{openRs.length} open</span></> : "—"}<div className="text-xs text-slate-500">{rs.find((x) => x.top_rank === 1)?.title}</div></td>
                    <td className={td}>{d ? `FS ${d.fs_completeness}% · ${d.fid_status}` : "—"}<div className="text-xs text-slate-500">{d?.rkap_status}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">Kolom: Kematangan ← MIND Tracker (internal) · Progres fisik & Jadwal ← MIND Project · Risiko ← PRISMA · Dokumen / FID ← MIND Gate. Ketiga sumber eksternal masih data dummy; integrasi read-only dikerjakan saat development.</p>
      </Card>

      {showDo ? (
        <Card title="Drill-down">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link className="text-indigo-600 underline" href="/do/production">Production Performance</Link>
            <Link className="text-indigo-600 underline" href="/do/rca">Root Cause Analysis</Link>
            <Link className="text-indigo-600 underline" href="/do/action-plans">Action Plan</Link>
            {trackerVisible ? <Link className="text-indigo-600 underline" href="/tracker">Scorecard proyek</Link> : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
