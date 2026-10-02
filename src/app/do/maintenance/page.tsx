import { Card, DummyBadge, PageHeader, td, th } from "@/components/ui";
import { isMindId, requirePermission } from "@/lib/auth/session";
import { db, must } from "@/lib/db/client";
import { num } from "@/lib/format";

interface Row { id: number; organization_id: string; plant: string; equipment: string; period: string; availability: number; mttr_hours: number; mtbf_hours: number; open_work_orders: number }

/** Maintenance Performance — sumber data MCT atau CMMS/EAM belum diputuskan (OI-18). */
export default async function MaintenancePage() {
  const user = await requirePermission("do.read");
  let q = db().from("do_maintenance").select("*").order("period", { ascending: false });
  if (!isMindId(user)) q = q.eq("organization_id", user.organizationId);
  const rows = must(await q, "do_maintenance") as Row[];
  const equipment = [...new Set(rows.map((r) => `${r.organization_id}|${r.plant}|${r.equipment}`))];
  return (
    <div>
      <PageHeader title="Maintenance Performance" subtitle={<span className="flex items-center gap-2">Availability · MTTR · MTBF · work order · <DummyBadge /></span>} />
      <Card source="mct.maintenance">
        <table className="w-full">
          <thead><tr><th className={th}>AH · Plant</th><th className={th}>Equipment</th><th className={th}>Availability (6 bln)</th><th className={th}>Availability terakhir</th><th className={th}>MTTR (jam)</th><th className={th}>MTBF (jam)</th><th className={th}>WO terbuka</th></tr></thead>
          <tbody>
            {equipment.map((k) => {
              const hist = rows.filter((r) => `${r.organization_id}|${r.plant}|${r.equipment}` === k).sort((a, b) => a.period.localeCompare(b.period));
              const last = hist[hist.length - 1];
              const av = Number(last.availability);
              return (
                <tr key={k}>
                  <td className={td}>{last.organization_id} · {last.plant}</td>
                  <td className={td}>{last.equipment}</td>
                  <td className={td}>
                    <div className="flex h-8 items-end gap-0.5">
                      {hist.map((h) => <div key={h.id} title={`${h.period.slice(0, 7)}: ${h.availability}%`} className={`w-3 rounded-t ${Number(h.availability) < 90 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ height: `${Math.max(8, (Number(h.availability) - 80) * 5)}%` }} />)}
                    </div>
                  </td>
                  <td className={`${td} ${av < 90 ? "text-amber-700" : "text-emerald-700"}`}>{num(av, 1)}%</td>
                  <td className={td}>{num(Number(last.mttr_hours), 1)}</td>
                  <td className={td}>{num(Number(last.mtbf_hours), 0)}</td>
                  <td className={td}>{last.open_work_orders}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">Batang kuning = availability &lt; 90%.</p>
      </Card>
    </div>
  );
}
