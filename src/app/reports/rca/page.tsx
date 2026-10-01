import { PrintButton } from "@/components/print-button";
import { td, th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { AP_STATUS_LABEL, isOverdue, listActionPlans, listRca, RCA_STATUS_LABEL } from "@/lib/db/do";
import { date, dateTime, num } from "@/lib/format";

export default async function RcaReport() {
  const user = await requirePermission("do.read");
  const [rcas, aps] = await Promise.all([listRca(user), listActionPlans(user)]);
  return (
    <div className="mx-auto max-w-5xl bg-white p-8 text-sm shadow print:shadow-none">
      <div className="flex items-start justify-between">
        <div><div className="text-xs uppercase text-slate-500">R-03</div><h1 className="text-xl font-semibold">Daftar RCA & Action Plan</h1></div>
        <PrintButton />
      </div>
      <table className="mt-4 w-full">
        <thead><tr><th className={th}>No. RCA</th><th className={th}>AH</th><th className={th}>Plant / Produk</th><th className={th}>Periode</th><th className={th}>Gap</th><th className={th}>Status</th><th className={th}>Action plan</th></tr></thead>
        <tbody>
          {rcas.map((r) => (
            <tr key={r.id}>
              <td className={td}>{r.number}</td>
              <td className={td}>{r.organization_id}</td>
              <td className={td}>{r.plant} / {r.product}</td>
              <td className={td}>{r.period.slice(0, 7)}</td>
              <td className={td}>{num(r.gap, 0)} {r.unit}</td>
              <td className={td}>{RCA_STATUS_LABEL[r.status]}</td>
              <td className={td}>
                {aps.filter((a) => a.rca_id === r.id).map((a) => (
                  <div key={a.id}>• {a.action} — {a.pic} · {date(a.target_date)} · {a.progress}% · {AP_STATUS_LABEL[a.status]}{isOverdue(a) ? " · TERLAMBAT" : ""}</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-8 text-xs text-slate-500">Dicetak oleh {user.name} pada {dateTime(new Date().toISOString())}.</p>
    </div>
  );
}
