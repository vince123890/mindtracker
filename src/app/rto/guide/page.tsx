import { Card, PageHeader, td, th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { getRtoMaster } from "@/lib/db/rto";

/** Halaman administratif RTO — Introduction, Instruction, Descriptions (worksheet RTO Tool v0.6). */
export default async function RtoGuidePage() {
  await requirePermission("rto.read");
  const { pillars, subElements } = await getRtoMaster();
  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title="Panduan RTO" subtitle="Introduction · Instruction · Element Descriptions — konten statis dari RTO Tool v0.6" />
      <Card title="Instruction">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Penilaian dilakukan pada titik-titik tertentu dalam siklus proyek (worksheet <i>Requirements for OR Assessment</i>, OI-07).</li>
          <li>Dipimpin <b>Operational Readiness Team</b> dengan partisipasi perwakilan PMO MIND ID.</li>
          <li>Tim harus <i>&quot;discuss and understand the intent/spirit behind each requirement and not simply check the box&quot;</i> — catat diskusi pada kolom catatan per requirement.</li>
          <li>Dua metrik dilaporkan terpisah: <b>Maturity</b> (skala 0–4, tertimbang) dan <b>Deliverable Completion</b> (rasio requirement terpenuhi).</li>
        </ul>
      </Card>
      <Card title="Element Descriptions">
        <table className="w-full">
          <thead><tr><th className={th}>Pilar</th><th className={th}>Sub-elemen</th></tr></thead>
          <tbody>
            {pillars.map((p) => (
              <tr key={p.id}>
                <td className={`${td} w-64 font-medium`}>{p.id}. {p.name}<div className="text-xs font-normal text-slate-500">{p.description}</div></td>
                <td className={td}>{subElements.filter((s) => s.pillar_id === p.id).map((s) => `${s.code} ${s.name}`).join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
