import Link from "next/link";
import { LineChart } from "@/components/line-chart";
import { listSnapshots } from "@/lib/db/snapshots";
import { BarChart, btn, btnDanger, btnGhost, Card, GateBadge, input, LinkButton, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { currentUser, requirePermission } from "@/lib/auth/session";
import {
  buildScorecard,
  getConfig,
  getOrganizations,
  getPhaseInstance,
  getProject,
  getProjectTypes,
  listTransitions,
  projectPhaseSummaries,
  type Scorecard,
} from "@/lib/db/tracker";
import { dateTime, GATE_LABEL, pct } from "@/lib/format";
import { changeProjectTypes, deactivateProject, saveSummaryComment } from "../actions";

function counts(sc: Scorecard) {
  const c = { G: 0, A: 0, "?": 0, N: 0 } as Record<string, number>;
  sc.result.rows.forEach((r) => (c[r.accepted] += 1));
  return c;
}

export default async function ProjectDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission("project.read");
  const user = await currentUser();
  const { id } = await params;
  const sp = await searchParams;
  const project = await getProject(id, user);
  const [config, phases, orgs, types] = await Promise.all([getConfig(), projectPhaseSummaries(project), getOrganizations(), getProjectTypes()]);
  const [transitions, snaps] = await Promise.all([listTransitions(phases.map((p) => p.instance.id)), listSnapshots([project])]);
  const curve = snaps.filter((x) => x.label !== "PHASE_CLOSE" && x.ppi.phase_code === project.current_phase);
  const org = orgs.find((o) => o.id === project.organization_id);
  const typeName = new Map(types.map((t) => [t.code, t.name]));
  const canComment = can(user.role, "phase.comment");

  // Pratinjau dampak perubahan tipe (VR-14) — dihitung dengan engine yang sama
  let impact: { before: Scorecard; after: Scorecard; t1: string; t2: string | null } | null = null;
  if (can(user.role, "project.changetype") && sp.t1) {
    const t2 = sp.t2 || null;
    const inst = await getPhaseInstance(project.id, project.current_phase);
    const before = await buildScorecard(project, inst, config);
    const after = await buildScorecard({ ...project, project_type_1: sp.t1, project_type_2: t2 }, inst, config);
    impact = { before, after, t1: sp.t1, t2 };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${project.code} · ${project.name}`}
        subtitle={
          <>
            {org?.name} · {project.location} · Tipe {project.project_type_1} ({typeName.get(project.project_type_1)})
            {project.project_type_2 ? ` + ${project.project_type_2} (${typeName.get(project.project_type_2)})` : ""}
          </>
        }
        actions={
          <>
            <LinkButton href={`/projects/${project.id}/phases/${project.current_phase}`}>Buka Scorecard {project.current_phase}</LinkButton>
            <LinkButton tone="ghost" href={`/reports/project/${project.id}`}>Cetak Ringkasan</LinkButton>
          </>
        }
      />

      <Card title="Index per fase — replika sheet Dashboard tracker v1.4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Fase</th><th className={th}>Gate</th>
                <th className={th}>Index 1 · FDMI</th><th className={th}>Index 2 · FGDI</th><th className={th}>Index 3 · FDCI</th><th className={th}>Index 4 · ?</th>
                <th className={th}>Deliverable G / A / ? / N/R</th><th className={th}>Komentar ringkasan (SUMMARY)</th>
              </tr>
            </thead>
            <tbody>
              {phases.map(({ instance, scorecard }) => {
                const i = scorecard.result.indices;
                const c = counts(scorecard);
                return (
                  <tr key={instance.id}>
                    <td className={td}><Link className="font-medium text-indigo-700 hover:underline" href={`/projects/${project.id}/phases/${instance.phase_code}`}>{instance.phase_code}</Link></td>
                    <td className={td}><GateBadge status={instance.gate_status} /></td>
                    <td className={td}>{pct(i.index1)}</td>
                    <td className={td}>{pct(i.index2)}</td>
                    <td className={td}>{pct(i.index3)}</td>
                    <td className={td}>{i.index4}</td>
                    <td className={`${td} whitespace-nowrap`}>{c.G} / {c.A} / {c["?"]} / {c.N}</td>
                    <td className={`${td} min-w-72`}>
                      {canComment ? (
                        <form action={saveSummaryComment} className="flex gap-2">
                          <input type="hidden" name="project_id" value={project.id} />
                          <input type="hidden" name="phase" value={instance.phase_code} />
                          <input name="summary_comment" defaultValue={instance.summary_comment ?? ""} className={input} placeholder="Provide commentaries on overall progress here" />
                          <button className={btnGhost}>Simpan</button>
                        </form>
                      ) : (
                        <span className="text-slate-600">{instance.summary_comment ?? "—"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Overall Maturity per fase (ambang 60%)">
          <BarChart threshold={config.gateMinMaturityPct} rows={phases.map((p) => ({ label: p.instance.phase_code, value: p.scorecard.result.indices.index1 }))} />
        </Card>
        <Card title={`Progress Curve ${project.current_phase} — Index 1 per bulan`}>
          {curve.length === 0 ? <p className="text-sm text-slate-500">Belum ada snapshot bulanan.</p> : (
            <LineChart labels={curve.map((c) => c.label)} threshold={config.gateMinMaturityPct} series={[
              { name: "FDMI", color: "#4f46e5", values: curve.map((c) => c.indices.index1) },
              { name: "FGDI", color: "#059669", values: curve.map((c) => c.indices.index2) },
            ]} />
          )}
          <p className="mt-1 text-xs text-slate-500">Ungu = FDMI · hijau = FGDI · garis merah = ambang gate.</p>
        </Card>
        <Card title="Identitas proyek">
          <dl className="grid grid-cols-3 gap-y-1 text-sm">
            {[
              ["Project Manager", project.project_manager],
              ["Executive Sponsor", project.executive_sponsor],
              ["Entry Phase", project.entry_phase],
              ["Fase berjalan", project.current_phase],
              ["Key Dependencies", project.key_dependencies],
              ["Depended By", project.depended_by],
              ["Deskripsi", project.description],
            ].map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="col-span-2">{v || "—"}</dd></div>
            ))}
          </dl>
        </Card>
      </div>

      <Card title="Riwayat keputusan gate">
        {transitions.length === 0 ? <p className="text-sm text-slate-500">Belum ada transisi.</p> : (
          <table className="w-full">
            <thead><tr><th className={th}>Waktu</th><th className={th}>Fase</th><th className={th}>Transisi</th><th className={th}>Oleh</th><th className={th}>Index saat keputusan</th><th className={th}>Catatan</th></tr></thead>
            <tbody>
              {transitions.map((t) => (
                <tr key={t.id}>
                  <td className={td}>{dateTime(t.created_at)}</td>
                  <td className={td}>{phases.find((p) => p.instance.id === t.phase_instance_id)?.instance.phase_code}</td>
                  <td className={td}>{GATE_LABEL[t.from_status] ?? t.from_status} → {GATE_LABEL[t.to_status] ?? t.to_status}</td>
                  <td className={td}>{t.actor?.name}</td>
                  <td className={`${td} text-xs`}>{t.indices ? `FDMI ${pct(t.indices.index1)} · FGDI ${pct(t.indices.index2)} · FDCI ${pct(t.indices.index3)} · ? ${t.indices.index4}` : "—"}</td>
                  <td className={td}>{t.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {can(user.role, "project.changetype") ? (
        <Card title="Ubah tipe proyek (PMO Admin) — VR-14">
          <form className="flex flex-wrap items-end gap-2 text-sm">
            <label>Type 1<select name="t1" defaultValue={impact?.t1 ?? project.project_type_1} className={input}>{types.map((t) => <option key={t.code} value={t.code}>{t.code} — {t.name}</option>)}</select></label>
            <label>Type 2<select name="t2" defaultValue={impact ? impact.t2 ?? "" : project.project_type_2 ?? ""} className={input}><option value="">— tidak ada —</option>{types.map((t) => <option key={t.code} value={t.code}>{t.code} — {t.name}</option>)}</select></label>
            <button className={btnGhost}>Hitung dampak</button>
          </form>
          {impact ? (
            <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
              <div className="font-medium">Dampak pada fase {project.current_phase}: {project.project_type_1}{project.project_type_2 ? `+${project.project_type_2}` : ""} → {impact.t1}{impact.t2 ? `+${impact.t2}` : ""}</div>
              <table className="mt-2">
                <tbody>
                  {(["G", "A", "?", "N"] as const).map((k) => (
                    <tr key={k}><td className="pr-4">Deliverable {k === "N" ? "Not Required" : k}</td><td className="pr-4">{counts(impact!.before)[k]}</td><td>→ {counts(impact!.after)[k]}</td></tr>
                  ))}
                  <tr><td className="pr-4">Index 1 (FDMI)</td><td className="pr-4">{pct(impact.before.result.indices.index1)}</td><td>→ {pct(impact.after.result.indices.index1)}</td></tr>
                </tbody>
              </table>
              <p className="mt-2 text-xs">Skor yang sudah diisi tidak dihapus.</p>
              {impact.t2 === impact.t1 ? <p className="mt-2 text-rose-700">Type 2 tidak boleh sama dengan Type 1.</p> : (
                <form action={changeProjectTypes} className="mt-3 flex gap-2">
                  <input type="hidden" name="project_id" value={project.id} />
                  <input type="hidden" name="project_type_1" value={impact.t1} />
                  <input type="hidden" name="project_type_2" value={impact.t2 ?? ""} />
                  <input name="reason" placeholder="Alasan perubahan" className={input} />
                  <button className={btn}>Ya, ubah tipe proyek</button>
                </form>
              )}
            </div>
          ) : null}
          <form action={deactivateProject} className="mt-4">
            <input type="hidden" name="project_id" value={project.id} />
            <button className={btnDanger}>Nonaktifkan proyek</button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
