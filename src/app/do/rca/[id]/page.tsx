import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/paginate";
import type { SearchParams } from "@/lib/paginate";
import { Card, PageHeader, btnDanger, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { isMindId, requirePermission } from "@/lib/auth/session";
import { AP_STATUS_LABEL, getRca, isOverdue, listActionPlans, listRcaReviewLog, RCA_CATEGORIES, RCA_STATUS_LABEL, ROOT_CAUSE_6M } from "@/lib/db/do";
import { getOrganizations } from "@/lib/db/tracker";
import { date, dateTime, num } from "@/lib/format";
import { deleteActionPlan, deleteRca } from "../../actions";
import { NewActionPlanForm, ProgressForm, ReviewRcaForm, SubmitRcaForm, VerifyForm } from "../../action-plan-controls";
import { RcaForm } from "../rca-form";

export default async function RcaDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const user = await requirePermission("do.read");
  const { id } = await params;
  const rca = await getRca(id, user);
  const [aps, log, orgs] = await Promise.all([listActionPlans(user, rca.id), listRcaReviewLog(rca.id), getOrganizations()]);
  const editable = rca.status === "DRAFT" || rca.status === "PERLU_PERBAIKAN";
  const canWrite = can(user.role, "do.rca.write") && (rca.created_by === user.id || isMindId(user));
  const canApWrite = can(user.role, "do.actionplan.write");

  const pg = paginate(aps, await searchParams);
  return (
    <div className="space-y-5">
      <PageHeader title={rca.number} subtitle={`${rca.organization_id} · ${rca.plant} · ${rca.product} · ${rca.period.slice(0, 7)} · Status: ${RCA_STATUS_LABEL[rca.status]}`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Ringkasan" className="lg:col-span-2">
          {editable && canWrite ? (
            <RcaForm
              orgs={orgs.filter((o) => o.kind === "MEMBER")}
              orgLocked={!isMindId(user)}
              categories={RCA_CATEGORIES}
              rootCauses={ROOT_CAUSE_6M}
              values={{ ...rca, period: rca.period.slice(0, 7), gap: rca.gap === null ? "" : String(rca.gap), analysis: rca.analysis ?? "" }}
            />
          ) : (
            <dl className="grid grid-cols-3 gap-y-2 text-sm">
              {[
                ["Gap", `${num(rca.gap, 0)} ${rca.unit}`],
                ["Kategori penyebab", rca.category],
                ["Akar masalah (6M)", rca.root_cause_category],
                ["Uraian masalah", rca.problem],
                ["Akar masalah", rca.root_cause],
                ["Analisis", rca.analysis ?? "—"],
              ].map(([k, v]) => <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="col-span-2">{v}</dd></div>)}
            </dl>
          )}
        </Card>
        <Card title="Alur review">
          <div className="space-y-3">
            {editable && canWrite ? <SubmitRcaForm id={rca.id} /> : null}
            {rca.status === "MENUNGGU_REVIEW" && can(user.role, "do.rca.approve") ? <ReviewRcaForm id={rca.id} /> : null}
            {rca.status === "DRAFT" && rca.created_by === user.id ? (
              <form action={deleteRca}><input type="hidden" name="id" value={rca.id} /><button className={btnDanger}>Hapus draft</button></form>
            ) : null}
            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Log review</div>
              <ul className="space-y-1 text-sm">
                {log.map((l) => (
                  <li key={l.id}>{dateTime(l.created_at)} · <b>{l.actor?.name}</b>: {RCA_STATUS_LABEL[l.from_status as keyof typeof RCA_STATUS_LABEL] ?? l.from_status} → {RCA_STATUS_LABEL[l.to_status as keyof typeof RCA_STATUS_LABEL] ?? l.to_status}{l.note ? ` — ${l.note}` : ""}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Action plan">
        <table className="mb-4 w-full">
          <thead><tr><th className={th}>Tindakan</th><th className={th}>PIC</th><th className={th}>Target</th><th className={th}>Progres</th><th className={th}>Status</th><th className={th}>Aksi</th></tr></thead>
          <tbody>
            {pg.rows.map((a) => (
              <tr key={a.id}>
                <td className={td}>{a.action}</td>
                <td className={td}>{a.pic}</td>
                <td className={`${td} ${isOverdue(a) ? "text-rose-700" : ""}`}>{date(a.target_date)}{isOverdue(a) ? " · terlambat" : ""}</td>
                <td className={td}>{a.progress}%</td>
                <td className={td}>{AP_STATUS_LABEL[a.status]}</td>
                <td className={td}>
                  {canApWrite && a.status !== "VERIFIED" && a.status !== "DONE_PENDING_VERIFY" ? <ProgressForm id={a.id} progress={a.progress} /> : null}
                  {can(user.role, "do.actionplan.verify") && a.status === "DONE_PENDING_VERIFY" ? <VerifyForm id={a.id} /> : null}
                  {canApWrite && a.progress === 0 ? (
                    <form action={deleteActionPlan} className="mt-1"><input type="hidden" name="id" value={a.id} /><button className="text-xs text-rose-600 underline">Hapus</button></form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={pg} />
        {canApWrite ? <NewActionPlanForm rcaId={rca.id} /> : null}
      </Card>
    </div>
  );
}
