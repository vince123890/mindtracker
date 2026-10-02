import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/paginate";
import Link from "next/link";
import { Card, DummyBadge, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { isMindId, requirePermission } from "@/lib/auth/session";
import { listProduction } from "@/lib/db/do";
import { num, pct } from "@/lib/format";

export default async function ProductionPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("do.read");
  const sp = await searchParams;
  const all = await listProduction(user);
  const rows = all.filter((r) => (!sp.org || r.organization_id === sp.org) && (!sp.product || r.product === sp.product));
  const orgs = [...new Set(all.map((r) => r.organization_id))];
  const products = [...new Set(all.map((r) => r.product))];

  const pg = paginate(rows, sp);
  return (
    <div>
      <PageHeader title="Production Performance" subtitle={<span className="flex items-center gap-2">Target RKAP vs realisasi per Anggota Holding · <DummyBadge /></span>} />
      <Card source="mct.production">
        <form className="mb-3 flex flex-wrap gap-2 text-sm">
          {isMindId(user) ? (
            <select name="org" defaultValue={sp.org ?? ""} className="rounded border border-slate-300 px-2 py-1">
              <option value="">Semua AH</option>
              {orgs.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : null}
          <select name="product" defaultValue={sp.product ?? ""} className="rounded border border-slate-300 px-2 py-1">
            <option value="">Semua produk</option>
            {products.map((p) => <option key={p}>{p}</option>)}
          </select>
          <button className="rounded bg-slate-800 px-3 py-1 text-white">Terapkan</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className={th}>Periode</th><th className={th}>AH</th><th className={th}>Plant</th><th className={th}>Produk</th><th className={th}>Target</th><th className={th}>Realisasi</th><th className={th}>Gap</th><th className={th}>%</th><th className={th}></th></tr></thead>
            <tbody>
              {pg.rows.map((r) => {
                const gap = r.actual - r.target;
                return (
                  <tr key={r.id}>
                    <td className={td}>{r.period.slice(0, 7)}</td>
                    <td className={td}>{r.organization_id}</td>
                    <td className={td}>{r.plant}</td>
                    <td className={td}>{r.product}</td>
                    <td className={`${td} text-right`}>{num(r.target, 0)} {r.unit}</td>
                    <td className={`${td} text-right`}>{num(r.actual, 0)} {r.unit}</td>
                    <td className={`${td} text-right ${gap < 0 ? "text-rose-700" : "text-emerald-700"}`}>{num(gap, 0)}</td>
                    <td className={`${td} text-right`}>{pct(r.target ? r.actual / r.target : null)}</td>
                    <td className={td}>
                      {gap < 0 && can(user.role, "do.rca.write") ? (
                        <Link className="text-xs text-indigo-600 underline" href={`/do/rca/new?org=${r.organization_id}&plant=${encodeURIComponent(r.plant)}&product=${encodeURIComponent(r.product)}&unit=${encodeURIComponent(r.unit)}&period=${r.period.slice(0, 7)}&gap=${gap.toFixed(2)}`}>Buat RCA</Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={pg} />
        </div>
        <p className="mt-3 text-xs text-slate-500">Satuan berbeda tidak pernah dijumlahkan. Data produksi milik MCT — tidak ada form input di aplikasi ini.</p>
      </Card>
    </div>
  );
}
