import { PrintButton } from "@/components/print-button";
import { td, th } from "@/components/ui";
import { currentUser, requirePermission } from "@/lib/auth/session";
import { getOrganizations, getProject, projectPhaseSummaries } from "@/lib/db/tracker";
import { dateTime, GATE_LABEL, pct } from "@/lib/format";

export default async function ProjectReport({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("report.read");
  await requirePermission("project.read");
  const user = await currentUser();
  const { id } = await params;
  const project = await getProject(id, user);
  const [phases, orgs] = await Promise.all([projectPhaseSummaries(project), getOrganizations()]);
  const current = phases.find((p) => p.instance.phase_code === project.current_phase)?.scorecard;
  const dimName = new Map(current?.dimensions.map((d) => [d.id, d.name]));
  return (
    <div className="mx-auto max-w-4xl bg-white p-8 text-sm shadow print:shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase text-slate-500">R-01 · Ringkasan Progres Proyek</div>
          <h1 className="text-xl font-semibold">{project.code} — {project.name}</h1>
          <div className="text-slate-600">{orgs.find((o) => o.id === project.organization_id)?.name} · {project.location} · Tipe {project.project_type_1}{project.project_type_2 ? ` + ${project.project_type_2}` : ""}</div>
        </div>
        <PrintButton />
      </div>

      <h2 className="mt-6 font-semibold">Index per fase</h2>
      <table className="mt-2 w-full">
        <thead><tr><th className={th}>Fase</th><th className={th}>Gate</th><th className={th}>FDMI</th><th className={th}>FGDI</th><th className={th}>FDCI</th><th className={th}>?</th><th className={th}>Komentar</th></tr></thead>
        <tbody>
          {phases.map(({ instance, scorecard }) => (
            <tr key={instance.id}>
              <td className={td}>{instance.phase_code}</td>
              <td className={td}>{GATE_LABEL[instance.gate_status]}</td>
              <td className={td}>{pct(scorecard.result.indices.index1)}</td>
              <td className={td}>{pct(scorecard.result.indices.index2)}</td>
              <td className={td}>{pct(scorecard.result.indices.index3)}</td>
              <td className={td}>{scorecard.result.indices.index4}</td>
              <td className={td}>{instance.summary_comment ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {current ? (
        <>
          <h2 className="mt-6 font-semibold">SCORE / STATUS per dimensi — {project.current_phase}</h2>
          <table className="mt-2 w-full">
            <thead><tr><th className={th}>Dimensi</th><th className={th}>SCORE</th><th className={th}>STATUS</th></tr></thead>
            <tbody>{current.result.dimensions.map((d) => <tr key={d.dimensionId}><td className={td}>{dimName.get(d.dimensionId)}</td><td className={td}>{pct(d.scorePct)}</td><td className={td}>{pct(d.statusPct)}</td></tr>)}</tbody>
          </table>
          <h2 className="mt-6 font-semibold">Penahan gate — {project.current_phase}</h2>
          {current.blocking.length === 0 ? <p className="mt-1">Tidak ada — siap diajukan.</p> : (
            <ul className="mt-1 list-disc pl-5">{current.blocking.map((b) => <li key={b.code}>{b.code} — {b.message}{b.items.length ? `: ${b.items.slice(0, 15).join(", ")}${b.items.length > 15 ? " …" : ""}` : ""}</li>)}</ul>
          )}
        </>
      ) : null}
      <p className="mt-8 text-xs text-slate-500">Dicetak oleh {user.name} pada {dateTime(new Date().toISOString())} · Rumus tracker v1.4 (scoring config v{current?.config.version}).</p>
    </div>
  );
}
