import Link from "next/link";
import { Card, Empty, PageHeader, td, th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { db, must } from "@/lib/db/client";
import { listProjects, listTransitions } from "@/lib/db/tracker";
import { dateTime, GATE_LABEL, pct } from "@/lib/format";

/** Riwayat Transisi Gate — dicatat bersama Index saat keputusan diambil. */
export default async function GateHistoryPage() {
  const user = await requirePermission("project.read");
  const projects = await listProjects(user);
  const instances = projects.length
    ? (must(
        await db().from("project_phase_instance").select("id, phase_code, project_id").in("project_id", projects.map((p) => p.id)),
        "ppi",
      ) as { id: string; phase_code: string; project_id: string }[])
    : [];
  const inst = new Map(instances.map((i) => [i.id, i]));
  const proj = new Map(projects.map((p) => [p.id, p]));
  const transitions = await listTransitions(instances.map((i) => i.id));
  return (
    <div>
      <PageHeader title="Riwayat Transisi Gate" subtitle="Seluruh keputusan phase gate · append-only" />
      <Card>
        {transitions.length === 0 ? <Empty>Belum ada transisi.</Empty> : (
          <table className="w-full">
            <thead><tr><th className={th}>Waktu</th><th className={th}>Proyek · Fase</th><th className={th}>Transisi</th><th className={th}>Oleh</th><th className={th}>Index saat keputusan</th><th className={th}>Catatan</th></tr></thead>
            <tbody>
              {transitions.map((t) => {
                const i = inst.get(t.phase_instance_id)!;
                const p = proj.get(i.project_id)!;
                return (
                  <tr key={t.id}>
                    <td className={`${td} whitespace-nowrap`}>{dateTime(t.created_at)}</td>
                    <td className={td}><Link className="text-indigo-600 underline" href={`/projects/${p.id}/phases/${i.phase_code}`}>{p.code} · {i.phase_code}</Link></td>
                    <td className={td}>{GATE_LABEL[t.from_status] ?? t.from_status} → {GATE_LABEL[t.to_status] ?? t.to_status}</td>
                    <td className={td}>{t.actor?.name}</td>
                    <td className={`${td} text-xs`}>{t.indices ? `FDMI ${pct(t.indices.index1)} · FGDI ${pct(t.indices.index2)} · FDCI ${pct(t.indices.index3)} · ? ${t.indices.index4}` : "—"}</td>
                    <td className={td}>{t.note ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
