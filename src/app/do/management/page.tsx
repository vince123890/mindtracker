import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/paginate";
import type { SearchParams } from "@/lib/paginate";
import { BarChart, Card, DummyBadge, PageHeader, td, th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { isOverdue, listActionPlans, listProduction, listRca } from "@/lib/db/do";
import { getOrganizations } from "@/lib/db/tracker";
import { pct } from "@/lib/format";

/** Management Dashboard (Grup) — perbandingan & peringkat antar AH, khusus peran MIND ID. */
export default async function ManagementPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requirePermission("do.management.read");
  const [production, rcas, aps, orgs] = await Promise.all([listProduction(user), listRca(user), listActionPlans(user), getOrganizations()]);
  const rows = orgs.filter((o) => o.kind === "MEMBER").map((o) => {
    const p = production.filter((r) => r.organization_id === o.id);
    // satuan berbeda tidak dijumlahkan — pakai rata-rata rasio realisasi/target per baris
    const ratio = p.length ? p.reduce((a, r) => a + r.actual / r.target, 0) / p.length : null;
    return {
      org: o,
      ratio,
      rcaOpen: rcas.filter((r) => r.organization_id === o.id && r.status !== "DISETUJUI").length,
      apLate: aps.filter((a) => a.rca.organization_id === o.id && isOverdue(a)).length,
    };
  }).sort((a, b) => (b.ratio ?? -1) - (a.ratio ?? -1));
  const pg = paginate(rows, await searchParams);
  return (
    <div className="space-y-4">
      <PageHeader title="Management Dashboard (Grup)" subtitle={<span className="flex items-center gap-2">Peringkat pencapaian produksi antar Anggota Holding · <DummyBadge /></span>} />
      <Card title="Pencapaian produksi (rata-rata realisasi ÷ target, 6 bulan)" source="mct.production.derived">
        <BarChart threshold={1} rows={rows.map((r) => ({ label: r.org.name, value: r.ratio }))} />
      </Card>
      <Card title="Peringkat" source="mct.production.derived">
        <table className="w-full">
          <thead><tr><th className={th}>#</th><th className={th}>Anggota Holding</th><th className={th}>Pencapaian</th><th className={th}>RCA belum disetujui</th><th className={th}>Action plan terlambat</th></tr></thead>
          <tbody>{pg.rows.map((r, i) => <tr key={r.org.id}><td className={td}>{pg.offset + i + 1}</td><td className={td}>{r.org.name}</td><td className={td}>{pct(r.ratio)}</td><td className={td}>{r.rcaOpen}</td><td className={td}>{r.apLate}</td></tr>)}</tbody>
        </table>
        <Pagination page={pg} />
      </Card>
    </div>
  );
}
