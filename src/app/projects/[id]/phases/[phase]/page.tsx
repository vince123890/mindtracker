import Link from "next/link";
import { Card, GateBadge, IndexCards, PageHeader, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { currentUser, requirePermission } from "@/lib/auth/session";
import { buildScorecard, getPhaseInstance, getProject, listRevisionLog } from "@/lib/db/tracker";
import { dateTime, pct } from "@/lib/format";
import { GatePanel } from "./gate-panel";
import { ScorecardRow, type RowView } from "./scorecard-row";

const fmtStatus = (v: 0 | 1 | "NA" | null) => (v === null ? "–" : String(v));

export default async function ScorecardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; phase: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission("project.read");
  const user = await currentUser();
  const { id, phase } = await params;
  const sp = await searchParams;
  const project = await getProject(id, user);
  const instance = await getPhaseInstance(project.id, decodeURIComponent(phase));
  const [sc, feedback] = await Promise.all([buildScorecard(project, instance), listRevisionLog(instance.id)]);

  const editableStatus = instance.gate_status === "DRAFT" || instance.gate_status === "REVISION_REQUIRED";
  const perm = {
    score: can(user.role, "score.write"),
    conditional: can(user.role, "conditional.resolve"),
    feedback: can(user.role, "feedback.write"),
    editableStatus,
  };

  const rows: RowView[] = sc.meta.map((m, i) => {
    const r = sc.result.rows[i];
    return {
      deliverableId: m.deliverableId,
      code: m.code,
      name: m.name,
      referenceDocument: m.referenceDocument,
      chapterName: m.chapterName,
      marker1: m.marker1,
      marker2: m.marker2,
      overall: r.overall,
      accepted: r.accepted,
      baseWeight: m.baseWeight,
      effectiveWeight: r.effectiveWeight,
      score: m.score,
      isNa: m.isNa,
      starting: fmtStatus(r.starting),
      completion: fmtStatus(r.completion),
      weightedScore: r.accepted === "G" || r.accepted === "A" ? (r.weightedScore === "NA" ? "NA" : r.weightedScore.toFixed(2)) : "—",
      resolution: m.resolution,
      justification: m.justification,
      notes: m.notes,
      actionPlan: m.actionPlan,
      responsiblePerson: m.responsiblePerson,
      dueDate: m.dueDate,
      updatedAt: m.updatedAt,
      feedback: feedback
        .filter((f) => f.deliverable_id === m.deliverableId)
        .map((f) => ({ id: f.id, author: f.author?.name ?? f.author_id, body: f.body, at: f.created_at, blocking: f.is_blocking })),
    };
  });

  const filtered = rows.filter((r) => {
    if (sp.chapter && String(sc.meta.find((m) => m.deliverableId === r.deliverableId)?.chapterNo) !== sp.chapter) return false;
    if (sp.req && r.accepted !== sp.req) return false;
    if (sp.filter === "action") {
      const empty = (r.accepted === "G" || r.accepted === "A") && r.score === null && !r.isNa;
      return empty || r.accepted === "?" || (r.accepted === "G" && r.completion === "0");
    }
    return true;
  });
  const dimName = new Map(sc.dimensions.map((d) => [d.id, d.name]));
  const generalFeedback = feedback.filter((f) => f.deliverable_id === null || f.is_blocking);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Scorecard ${instance.phase_code}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Link className="text-indigo-600 hover:underline" href={`/projects/${project.id}`}>{project.code} · {project.name}</Link>
            <span>· {project.project_type_1}{project.project_type_2 ? ` + ${project.project_type_2}` : ""}</span>
            <GateBadge status={instance.gate_status} />
            {instance.submitted_at ? <span className="text-xs">diajukan {dateTime(instance.submitted_at)}</span> : null}
          </span>
        }
      />

      <IndexCards indices={sc.result.indices} config={sc.config} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Phase Gate" className="lg:col-span-2">
          <GatePanel
            projectId={project.id}
            phase={instance.phase_code}
            status={instance.gate_status}
            canSubmit={can(user.role, "gate.submit")}
            canApprove={can(user.role, "gate.approve")}
            blocking={sc.blocking}
          />
        </Card>
        <Card title="SCORE / STATUS per dimensi">
          <table className="w-full text-sm">
            <tbody>
              {sc.result.dimensions.map((d) => (
                <tr key={d.dimensionId}><td className="py-1 pr-2">{dimName.get(d.dimensionId)}</td><td className="py-1 text-right">{pct(d.scorePct)}</td><td className="py-1 text-right text-slate-500">{pct(d.statusPct)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">SCORE berbasis bobot · STATUS berbasis jumlah deliverable skor ≥ 3. Chapter tanpa dimensi (OI-09) tetap masuk Index 1–4.</p>
        </Card>
      </div>

      {generalFeedback.length ? (
        <Card title="Revision log fase">
          <ul className="space-y-1 text-sm">
            {generalFeedback.map((f) => (
              <li key={f.id} className={f.is_blocking ? "text-rose-700" : ""}>
                {f.is_blocking ? "⛔ Revisi gate" : "💬 Feedback"} · <b>{f.author?.name}</b> · {dateTime(f.created_at)}: {f.body}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <form className="mb-3 flex flex-wrap gap-2 text-sm">
          <select name="chapter" defaultValue={sp.chapter ?? ""} className="rounded border border-slate-300 px-2 py-1">
            <option value="">Semua chapter</option>
            {sc.chapters.map((c) => <option key={c.chapter_no} value={c.chapter_no}>{c.chapter_no}. {c.name}</option>)}
          </select>
          <select name="req" defaultValue={sp.req ?? ""} className="rounded border border-slate-300 px-2 py-1">
            <option value="">Semua requirement</option>
            <option value="G">G — Gate Control</option>
            <option value="A">A — Applicable</option>
            <option value="?">? — Belum diputuskan</option>
            <option value="N">Not Required</option>
          </select>
          <label className="flex items-center gap-1"><input type="checkbox" name="filter" value="action" defaultChecked={sp.filter === "action"} /> hanya perlu tindakan</label>
          <button className="rounded bg-slate-800 px-3 py-1 text-white">Terapkan</button>
          <span className="ml-auto self-center text-xs text-slate-500">{filtered.length} dari {rows.length} deliverable · 🔒 = dihitung server</span>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr>
                <th className={th}>Chapter</th><th className={th}>Kode</th><th className={th}>Deliverable</th>
                <th className={th} title="Requirement Type 1 / Type 2">Req T1/T2</th><th className={th}>Accepted</th>
                <th className={th}>Base W.</th><th className={th}>Eff. W.</th><th className={th}>Skor</th>
                <th className={th} title="Starting Status (skor ≥ 1)">Start</th><th className={th} title="Completion Status (skor ≥ 3)">Compl.</th>
                <th className={th}>Weighted</th><th className={th}></th>
              </tr>
            </thead>
            {filtered.map((r) => (
              <ScorecardRow key={r.deliverableId} row={r} projectId={project.id} phase={instance.phase_code} perm={perm} />
            ))}
          </table>
        </div>
      </Card>
    </div>
  );
}
