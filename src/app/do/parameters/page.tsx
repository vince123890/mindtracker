import { Card, DummyBadge, PageHeader, td, th } from "@/components/ui";
import { isMindId, requirePermission } from "@/lib/auth/session";
import { db, must } from "@/lib/db/client";
import { num } from "@/lib/format";

interface Row { id: number; organization_id: string; plant: string; parameter: string; unit: string; period: string; target: number; actual: number; higher_is_better: boolean }

/** Key Parameter Operasi — indikator final ditetapkan bersama fungsi DO (OI-18). */
export default async function KeyParameterPage() {
  const user = await requirePermission("do.read");
  let q = db().from("do_key_parameter").select("*").order("period", { ascending: false });
  if (!isMindId(user)) q = q.eq("organization_id", user.organizationId);
  const rows = (must(await q, "do_key_parameter") as Row[]).map((r) => ({ ...r, target: Number(r.target), actual: Number(r.actual) }));
  const latest = new Map<string, Row>();
  rows.forEach((r) => { const k = `${r.organization_id}|${r.plant}|${r.parameter}`; if (!latest.has(k)) latest.set(k, r); });
  return (
    <div>
      <PageHeader title="Key Parameter Operasi" subtitle={<span className="flex items-center gap-2">Parameter vs target, deviasi · <DummyBadge /></span>} />
      <Card title="Periode terakhir" source="mct.parameter">
        <table className="w-full">
          <thead><tr><th className={th}>AH</th><th className={th}>Plant</th><th className={th}>Parameter</th><th className={th}>Periode</th><th className={th}>Target</th><th className={th}>Aktual</th><th className={th}>Deviasi</th><th className={th}>Status</th></tr></thead>
          <tbody>
            {[...latest.values()].map((r) => {
              const dev = (r.actual - r.target) / r.target;
              const ok = r.higher_is_better ? r.actual >= r.target : r.actual <= r.target;
              return (
                <tr key={r.id}>
                  <td className={td}>{r.organization_id}</td>
                  <td className={td}>{r.plant}</td>
                  <td className={td}>{r.parameter}<div className="text-xs text-slate-500">{r.higher_is_better ? "semakin tinggi semakin baik" : "semakin rendah semakin baik"}</div></td>
                  <td className={td}>{r.period.slice(0, 7)}</td>
                  <td className={`${td} text-right`}>{num(r.target)} {r.unit}</td>
                  <td className={`${td} text-right`}>{num(r.actual)} {r.unit}</td>
                  <td className={`${td} text-right`}>{(dev * 100).toFixed(1)}%</td>
                  <td className={`${td} ${ok ? "text-emerald-700" : "text-rose-700"}`}>{ok ? "Sesuai target" : "Di luar target"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">Master parameter dan ambangnya akan dikelola di Master Indikator DO saat development (indikator belum ditetapkan KAK).</p>
      </Card>
    </div>
  );
}
