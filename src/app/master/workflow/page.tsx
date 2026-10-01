import { Card, PageHeader, td, th } from "@/components/ui";
import { ROLE_LABEL, type Role } from "@/lib/auth/roles";
import { requirePermission } from "@/lib/auth/session";
import { db, must } from "@/lib/db/client";
import { getConfig } from "@/lib/db/tracker";
import { pct } from "@/lib/format";

interface Step { step_order: number; name: string; actor_role: Role; sla_days: number; description: string }

/** Workflow Config (FR-7.5) — prototype menampilkan konfigurasi aktif; ubah alur pasca go-live = development. */
export default async function WorkflowPage() {
  await requirePermission("master.read");
  const [steps, config] = await Promise.all([
    db().from("gate_workflow_step").select("*").order("step_order"),
    getConfig(),
  ]);
  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title="Workflow Config" subtitle="Alur phase gate aktif · disimpan sebagai data agar dapat diubah setelah go-live (RFI §5.8.3)" />
      <Card title="Langkah workflow">
        <table className="w-full">
          <thead><tr><th className={th}>#</th><th className={th}>Langkah</th><th className={th}>Pelaku</th><th className={th}>SLA</th><th className={th}>Keterangan</th></tr></thead>
          <tbody>
            {(must(steps, "gate_workflow_step") as Step[]).map((s) => (
              <tr key={s.step_order}><td className={td}>{s.step_order}</td><td className={td}>{s.name}</td><td className={td}>{ROLE_LABEL[s.actor_role] ?? s.actor_role}</td><td className={td}>{s.sla_days ? `${s.sla_days} hari` : "—"}</td><td className={td}>{s.description}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="Guard pengajuan gate (dari Scoring Config aktif)">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Index 4 = 0 — seluruh deliverable Conditional sudah diputuskan</li>
          <li>Index 2 = 100% — seluruh Mandatory Gate Control berskor ≥ {config.passThreshold} {config.gateControlMustComplete ? "(aktif)" : "(nonaktif)"}</li>
          <li>Index 1 ≥ {pct(config.gateMinMaturityPct)} — Overall Maturity</li>
          <li>Segregation of duty: pengaju tidak dapat menyetujui pengajuannya sendiri</li>
        </ul>
      </Card>
      <p className="text-xs text-slate-500">Prototype: tampilan baca-saja. Penambahan tahap Pre-Gate Review / Integrated Stage Gate Review menunggu OI-17.</p>
    </div>
  );
}
