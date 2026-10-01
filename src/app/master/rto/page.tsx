import { Card, DummyBadge, PageHeader, td, th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { getRtoMaster } from "@/lib/db/rto";

export default async function RtoMasterPage() {
  await requirePermission("master.read");
  const { pillars, subElements, requirements } = await getRtoMaster();
  return (
    <div className="space-y-4">
      <PageHeader title="Master RTO" subtitle={<span className="flex items-center gap-2">Pillar → Sub-Element → Requirement · {pillars.length} pilar · {subElements.length} sub-elemen · {requirements.length} requirement <DummyBadge /></span>} />
      {pillars.map((p) => (
        <Card key={p.id} title={`${p.id}. ${p.name}`}>
          <table className="w-full">
            <thead><tr><th className={th}>Sub-elemen</th><th className={th}>Status sumber</th><th className={th}>Requirement</th></tr></thead>
            <tbody>
              {subElements.filter((s) => s.pillar_id === p.id).map((s) => (
                <tr key={s.id}>
                  <td className={`${td} w-80`}>{s.code} {s.name}</td>
                  <td className={td}>{s.verified ? <span className="text-emerald-700">Terverifikasi RTO v0.6</span> : <span className="text-amber-700">Placeholder (OI-02)</span>}</td>
                  <td className={`${td} text-xs`}>{requirements.filter((r) => r.sub_element_id === s.id).map((r) => `${r.code} (bobot ${r.weight})`).join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
      <p className="text-xs text-slate-500">CRUD & impor master RTO dikerjakan saat development setelah berkas RTO Tool penuh diterima.</p>
    </div>
  );
}
