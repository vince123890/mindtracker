import Link from "next/link";
import { Card, Empty, PageHeader, td, th } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { db, must } from "@/lib/db/client";
import { listProjects } from "@/lib/db/tracker";
import { dateTime } from "@/lib/format";

interface Row {
  id: number;
  body: string;
  is_blocking: boolean;
  created_at: string;
  author: { name: string; role: string } | null;
  deliverable: { code: string; name: string } | null;
  ppi: { phase_code: string; project_id: string };
}

/** Revision Log Terpusat (FR-4.2) — append-only; feedback dalam fase vs revisi gate dibedakan. */
export default async function RevisionLogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("project.read");
  const sp = await searchParams;
  const projects = await listProjects(user);
  const byId = new Map(projects.map((p) => [p.id, p]));
  const instances = projects.length
    ? (must(await db().from("project_phase_instance").select("id").in("project_id", projects.map((p) => p.id)), "ppi") as { id: string }[])
    : [];
  let rows: Row[] = instances.length
    ? (must(
        await db()
          .from("revision_log_entry")
          .select("id, body, is_blocking, created_at, author:author_id(name, role), deliverable:deliverable_id(code, name), ppi:phase_instance_id(phase_code, project_id)")
          .in("phase_instance_id", instances.map((i) => i.id))
          .order("created_at", { ascending: false }),
        "revision_log",
      ) as unknown as Row[])
    : [];
  if (sp.type === "blocking") rows = rows.filter((r) => r.is_blocking);
  if (sp.type === "feedback") rows = rows.filter((r) => !r.is_blocking);

  return (
    <div>
      <PageHeader title="Revision Log Terpusat" subtitle="Catatan PMO / Divisi MIND ID · append-only · feedback tidak mengubah status gate" />
      <Card>
        <form className="mb-3 flex gap-2 text-sm">
          <select name="type" defaultValue={sp.type ?? ""} className="rounded border border-slate-300 px-2 py-1">
            <option value="">Semua</option>
            <option value="feedback">Feedback dalam fase</option>
            <option value="blocking">Revisi gate</option>
          </select>
          <button className="rounded bg-slate-800 px-3 py-1 text-white">Terapkan</button>
        </form>
        {rows.length === 0 ? <Empty>Belum ada catatan.</Empty> : (
          <table className="w-full">
            <thead><tr><th className={th}>Waktu</th><th className={th}>Jenis</th><th className={th}>Proyek · Fase</th><th className={th}>Deliverable</th><th className={th}>Penulis</th><th className={th}>Catatan</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const p = byId.get(r.ppi.project_id);
                return (
                  <tr key={r.id}>
                    <td className={`${td} whitespace-nowrap`}>{dateTime(r.created_at)}</td>
                    <td className={td}>{r.is_blocking ? <span className="text-rose-700">⛔ Revisi gate</span> : "💬 Feedback"}</td>
                    <td className={td}>{p ? <Link className="text-indigo-600 underline" href={`/projects/${p.id}/phases/${r.ppi.phase_code}`}>{p.code} · {r.ppi.phase_code}</Link> : "—"}</td>
                    <td className={td}>{r.deliverable ? `${r.deliverable.code}` : "— (umum)"}</td>
                    <td className={td}>{r.author?.name}</td>
                    <td className={td}>{r.body}</td>
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
