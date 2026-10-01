import { ActionForm } from "@/components/action-form";
import { btn, Card, input, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { requirePermission } from "@/lib/auth/session";
import { db, must } from "@/lib/db/client";
import { getConfig } from "@/lib/db/tracker";
import { dateTime } from "@/lib/format";
import { newScoringConfig } from "../actions";

export default async function ScoringConfigPage() {
  const user = await requirePermission("master.read");
  const [config, history] = await Promise.all([
    getConfig(),
    db().from("scoring_config").select("*").order("version", { ascending: false }),
  ]);
  const rows = must(history, "scoring_config") as Record<string, string | number | boolean | null>[];
  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title="Scoring Config" subtitle="Nilai default dari tracker v1.4 · perubahan selalu membuat versi baru (berlaku prospektif)" />
      {can(user.role, "master.write") ? (
        <Card title={`Buat versi ${config.version + 1}`}>
          <ActionForm action={newScoringConfig} className="grid gap-3 md:grid-cols-3" okMessage="Versi baru aktif — seluruh kalkulasi memakai versi ini.">
            <label className="text-sm">Starting Status (skor ≥)<input name="start_threshold" type="number" defaultValue={config.startThreshold} className={input} /></label>
            <label className="text-sm">Completion Status (skor ≥)<input name="pass_threshold" type="number" defaultValue={config.passThreshold} className={input} /></label>
            <label className="text-sm">Ambang Index 1 (%)<input name="gate_min_maturity_pct" type="number" defaultValue={config.gateMinMaturityPct === null ? "" : Math.round(config.gateMinMaturityPct * 100)} className={input} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="gate_control_must_complete" defaultChecked={config.gateControlMustComplete} /> Seluruh Gate Control wajib ≥ pass</label>
            <label className="text-sm">Perlakuan NA (OI-14)
              <select name="na_treatment" defaultValue={config.naTreatment} className={input}>
                <option value="EXCLUDE">EXCLUDE — keluar dari pembagi (default)</option>
                <option value="EXCEL_PARITY">EXCEL_PARITY — tetap di pembagi (perilaku Excel)</option>
              </select>
            </label>
            <div className="self-end"><button className={btn}>Simpan versi baru</button></div>
          </ActionForm>
        </Card>
      ) : null}
      <Card title="Riwayat versi">
        <table className="w-full">
          <thead><tr><th className={th}>Versi</th><th className={th}>Start</th><th className={th}>Pass</th><th className={th}>Ambang Index 1</th><th className={th}>Gate Control wajib</th><th className={th}>NA</th><th className={th}>Dibuat</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.version)}>
                <td className={td}>{String(r.version)}{r.version === config.version ? " (aktif)" : ""}</td>
                <td className={td}>{String(r.start_threshold)}</td>
                <td className={td}>{String(r.pass_threshold)}</td>
                <td className={td}>{r.gate_min_maturity_pct === null ? "—" : `${Math.round(Number(r.gate_min_maturity_pct) * 100)}%`}</td>
                <td className={td}>{r.gate_control_must_complete ? "Ya" : "Tidak"}</td>
                <td className={td}>{String(r.na_treatment)}</td>
                <td className={td}>{dateTime(String(r.created_at))} · {String(r.created_by)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
