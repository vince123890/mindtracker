import { Card, PageHeader, td, th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { db, must } from "@/lib/db/client";
import { getPhases } from "@/lib/db/tracker";

export default async function PhasesPage() {
  await requirePermission("master.read");
  const phases = await getPhases(false);
  const counts = must(await db().from("deliverable").select("phase_code").eq("is_active", true), "deliverable") as { phase_code: string }[];
  return (
    <div className="max-w-3xl">
      <PageHeader title="Master Phase" subtitle="Urutan fase & fase awal fleksibel · tracker v1.4 memuat FEL-0 s.d. FEL-3 (KAK: FEL-3 s.d. EPC milik MIND Project)" />
      <Card>
        <table className="w-full">
          <thead><tr><th className={th}>Urutan</th><th className={th}>Kode</th><th className={th}>Nama</th><th className={th}>Deliverable</th><th className={th}>Status</th></tr></thead>
          <tbody>
            {phases.map((p) => (
              <tr key={p.code} className={p.is_active ? "" : "text-slate-400"}>
                <td className={td}>{p.seq}</td>
                <td className={`${td} font-mono`}>{p.code}</td>
                <td className={td}>{p.name}</td>
                <td className={td}>{counts.filter((c) => c.phase_code === p.code).length}</td>
                <td className={td}>{p.is_active ? "Aktif" : "Nonaktif — di luar cakupan tracker (OI-12)"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">Fase nonaktif tetap disimpan sebagai master agar dapat diaktifkan tanpa perubahan kode.</p>
      </Card>
    </div>
  );
}
