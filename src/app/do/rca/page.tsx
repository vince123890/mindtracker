import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/paginate";
import Link from "next/link";
import { Card, Empty, LinkButton, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { isMindId, requirePermission } from "@/lib/auth/session";
import { isOverdue, listActionPlans, listRca, RCA_STATUS_LABEL } from "@/lib/db/do";
import { date, num } from "@/lib/format";

const TONE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  MENUNGGU_REVIEW: "bg-amber-100 text-amber-800",
  DISETUJUI: "bg-emerald-100 text-emerald-800",
  PERLU_PERBAIKAN: "bg-rose-100 text-rose-800",
};

export default async function RcaListPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("do.read");
  const sp = await searchParams;
  const [all, aps] = await Promise.all([listRca(user), listActionPlans(user)]);
  const rcas = all.filter((r) => (!sp.status || r.status === sp.status) && (!sp.q || r.number.toLowerCase().includes(sp.q.toLowerCase()) || r.plant.toLowerCase().includes(sp.q.toLowerCase())));
  const pg = paginate(rcas, sp);
  return (
    <div>
      <PageHeader
        title="Root Cause Analysis"
        subtitle="Gap RKAP vs realisasi · review oleh Divisi DO MIND ID"
        actions={can(user.role, "do.rca.write") ? <LinkButton href="/do/rca/new">+ RCA Baru</LinkButton> : null}
      />
      <Card>
        <form className="mb-3 flex flex-wrap gap-2 text-sm">
          <input name="q" defaultValue={sp.q} placeholder="Cari nomor / plant…" className="rounded border border-slate-300 px-2 py-1" />
          <select name="status" defaultValue={sp.status ?? ""} className="rounded border border-slate-300 px-2 py-1">
            <option value="">Semua status</option>
            {Object.entries(RCA_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="rounded-lg border border-slate-300 bg-white px-3 py-1">Terapkan</button>
        </form>
        {rcas.length === 0 ? <Empty>Belum ada RCA.</Empty> : (
          <><table className="w-full">
            <thead><tr><th className={th}>No. RCA</th>{isMindId(user) ? <th className={th}>AH</th> : null}<th className={th}>Plant / Produk</th><th className={th}>Periode</th><th className={th}>Gap</th><th className={th}>Kategori</th><th className={th}>Status</th><th className={th}>Action plan</th><th className={th}>Dibuat</th></tr></thead>
            <tbody>
              {pg.rows.map((r) => {
                const mine = aps.filter((a) => a.rca_id === r.id);
                const done = mine.filter((a) => a.status === "VERIFIED").length;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className={td}><Link className="font-medium text-indigo-700 hover:underline" href={`/do/rca/${r.id}`}>{r.number}</Link></td>
                    {isMindId(user) ? <td className={td}>{r.organization_id}</td> : null}
                    <td className={td}>{r.plant}<div className="text-xs text-slate-500">{r.product}</div></td>
                    <td className={td}>{r.period.slice(0, 7)}</td>
                    <td className={`${td} text-rose-700`}>{num(r.gap, 0)} {r.unit}</td>
                    <td className={td}>{r.category}</td>
                    <td className={td}><span className={`rounded px-2 py-0.5 text-xs ${TONE[r.status]}`}>{RCA_STATUS_LABEL[r.status]}</span></td>
                    <td className={td}>{done}/{mine.length} terverifikasi{mine.some(isOverdue) ? <span className="ml-1 text-xs text-rose-700">· terlambat</span> : null}</td>
                    <td className={td}>{date(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={pg} /></>
        )}
      </Card>
    </div>
  );
}
