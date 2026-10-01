import Link from "next/link";
import { Card, Empty, PageHeader, td, th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { db, must } from "@/lib/db/client";
import { buildScorecard, getConfig, type PhaseInstance, type Project } from "@/lib/db/tracker";
import { dateTime, pct } from "@/lib/format";
import { GatePanel } from "../projects/[id]/phases/[phase]/gate-panel";

function daysSince(iso: string | null): number {
  return iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : 0;
}

export default async function GatesPage() {
  const user = await requirePermission("gate.approve");
  const config = await getConfig();
  const waiting = must(
    await db()
      .from("project_phase_instance")
      .select("*, project:project_id(*), submitter:submitted_by(name)")
      .eq("gate_status", "WAITING_APPROVAL")
      .order("submitted_at"),
    "gates",
  ) as unknown as (PhaseInstance & { project: Project; submitter: { name: string } | null })[];
  const cards = await Promise.all(waiting.map(async (w) => ({ w, sc: await buildScorecard(w.project, w, config) })));

  return (
    <div className="space-y-4">
      <PageHeader title="Persetujuan Gate" subtitle="Hanya PMO MIND ID · pengaju tidak dapat menyetujui pengajuannya sendiri" />
      {cards.length === 0 ? <Empty>Tidak ada pengajuan gate yang menunggu.</Empty> : null}
      {cards.map(({ w, sc }) => {
        const days = daysSince(w.submitted_at);
        return (
          <Card key={w.id} title={`${w.project.code} · ${w.phase_code}`}>
            <table className="mb-3 w-full">
              <thead><tr><th className={th}>Proyek</th><th className={th}>Diajukan oleh</th><th className={th}>Tanggal</th><th className={th}>Menunggu</th><th className={th}>FDMI</th><th className={th}>FGDI</th><th className={th}>FDCI</th><th className={th}>?</th></tr></thead>
              <tbody>
                <tr>
                  <td className={td}><Link className="text-indigo-600 underline" href={`/projects/${w.project.id}/phases/${w.phase_code}`}>{w.project.name}</Link></td>
                  <td className={td}>{w.submitter?.name ?? "—"}{w.submitted_by === user.id ? " (Anda)" : ""}</td>
                  <td className={td}>{dateTime(w.submitted_at)}</td>
                  <td className={td}>{days} hari</td>
                  <td className={td}>{pct(sc.result.indices.index1)}</td>
                  <td className={td}>{pct(sc.result.indices.index2)}</td>
                  <td className={td}>{pct(sc.result.indices.index3)}</td>
                  <td className={td}>{sc.result.indices.index4}</td>
                </tr>
              </tbody>
            </table>
            <GatePanel projectId={w.project.id} phase={w.phase_code} status={w.gate_status} canSubmit={false} canApprove blocking={sc.blocking} />
            {sc.blocking.length ? <p className="mt-2 text-xs text-amber-700">Catatan: angka saat ini tidak lagi memenuhi syarat gate (master/konfigurasi berubah setelah pengajuan).</p> : null}
          </Card>
        );
      })}
    </div>
  );
}
