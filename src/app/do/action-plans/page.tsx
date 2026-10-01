import Link from "next/link";
import { Card, Empty, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { isMindId, requirePermission } from "@/lib/auth/session";
import { AP_STATUS_LABEL, isOverdue, listActionPlans } from "@/lib/db/do";
import { date } from "@/lib/format";
import { ProgressForm, VerifyForm } from "../action-plan-controls";

export default async function ActionPlansPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("do.read");
  const sp = await searchParams;
  const all = await listActionPlans(user);
  const aps = all.filter((a) => (!sp.status || a.status === sp.status) && (sp.overdue !== "1" || isOverdue(a)));
  return (
    <div>
      <PageHeader title="Action Plan Monitoring" subtitle="Tindak lanjut RCA · progres oleh PIC, verifikasi oleh Divisi DO MIND ID" />
      <Card>
        <form className="mb-3 flex flex-wrap gap-2 text-sm">
          <select name="status" defaultValue={sp.status ?? ""} className="rounded border border-slate-300 px-2 py-1">
            <option value="">Semua status</option>
            {Object.entries(AP_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <label className="flex items-center gap-1"><input type="checkbox" name="overdue" value="1" defaultChecked={sp.overdue === "1"} /> hanya terlambat</label>
          <button className="rounded bg-slate-800 px-3 py-1 text-white">Terapkan</button>
        </form>
        {aps.length === 0 ? <Empty>Tidak ada action plan.</Empty> : (
          <table className="w-full">
            <thead><tr><th className={th}>Tindakan</th><th className={th}>RCA</th>{isMindId(user) ? <th className={th}>AH</th> : null}<th className={th}>PIC</th><th className={th}>Target</th><th className={th}>Progres</th><th className={th}>Status</th><th className={th}>Aksi</th></tr></thead>
            <tbody>
              {aps.map((a) => (
                <tr key={a.id}>
                  <td className={td}>{a.action}</td>
                  <td className={td}><Link className="text-indigo-600 underline" href={`/do/rca/${a.rca_id}`}>{a.rca.number}</Link></td>
                  {isMindId(user) ? <td className={td}>{a.rca.organization_id}</td> : null}
                  <td className={td}>{a.pic}</td>
                  <td className={`${td} ${isOverdue(a) ? "text-rose-700" : ""}`}>{date(a.target_date)}</td>
                  <td className={td}>
                    <div className="h-2 w-24 rounded bg-slate-100"><div className="h-2 rounded bg-indigo-500" style={{ width: `${a.progress}%` }} /></div>
                    <span className="text-xs">{a.progress}%</span>
                  </td>
                  <td className={td}>{AP_STATUS_LABEL[a.status]}{isOverdue(a) ? <span className="ml-1 text-xs text-rose-700">terlambat</span> : null}</td>
                  <td className={td}>
                    {can(user.role, "do.actionplan.write") && (a.status === "OPEN" || a.status === "IN_PROGRESS") ? <ProgressForm id={a.id} progress={a.progress} /> : null}
                    {can(user.role, "do.actionplan.verify") && a.status === "DONE_PENDING_VERIFY" ? <VerifyForm id={a.id} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
