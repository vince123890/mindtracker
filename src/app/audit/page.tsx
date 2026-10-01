import { Card, PageHeader, td, th } from "@/components/ui";
import { isMindId, requirePermission } from "@/lib/auth/session";
import { db, must } from "@/lib/db/client";
import { listProjects } from "@/lib/db/tracker";
import { dateTime } from "@/lib/format";

interface Entry {
  id: number;
  actor_id: string;
  actor_role: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes: unknown;
  reason: string | null;
  created_at: string;
}

export default async function AuditPage() {
  const user = await requirePermission("audit.read");
  let entries = must(await db().from("audit_log_entry").select("*").order("created_at", { ascending: false }).limit(300), "audit") as Entry[];
  if (!isMindId(user)) {
    // PMO AH: hanya entri milik proyek organisasinya
    const projects = await listProjects(user);
    const instances = must(
      await db().from("project_phase_instance").select("id").in("project_id", projects.map((p) => p.id)),
      "ppi",
    ) as { id: string }[];
    const keys = new Set([...projects.map((p) => p.id), ...instances.map((i) => i.id)]);
    entries = entries.filter((e) => keys.has(e.entity_id) || keys.has(e.entity_id.split("/")[0]));
  }
  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Append-only — tidak dapat diubah atau dihapus (ditegakkan trigger basis data)" />
      <Card>
        <table className="w-full">
          <thead><tr><th className={th}>Waktu</th><th className={th}>User · Role</th><th className={th}>Entitas</th><th className={th}>Aksi</th><th className={th}>Perubahan</th><th className={th}>Alasan</th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className={`${td} whitespace-nowrap`}>{dateTime(e.created_at)}</td>
                <td className={td}>{e.actor_id}<div className="text-xs text-slate-500">{e.actor_role}</div></td>
                <td className={`${td} text-xs`}>{e.entity_type}<div className="font-mono text-slate-500">{e.entity_id}</div></td>
                <td className={td}>{e.action}</td>
                <td className={`${td} max-w-md`}><code className="break-all text-xs">{e.changes ? JSON.stringify(e.changes) : "—"}</code></td>
                <td className={td}>{e.reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 ? <p className="text-sm text-slate-500">Belum ada aktivitas.</p> : null}
      </Card>
    </div>
  );
}
