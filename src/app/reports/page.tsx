import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { isMindId, requirePermission } from "@/lib/auth/session";
import { listProjects } from "@/lib/db/tracker";

export default async function ReportsPage() {
  const user = await requirePermission("report.read");
  const projects = can(user.role, "project.read") ? await listProjects(user) : [];
  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader title="Laporan" subtitle="Laporan berkolom tetap · prototype memakai halaman cetak (Print → Simpan sebagai PDF)" />
      {can(user.role, "project.read") ? (
        <Card title="R-01 · Ringkasan Progres Proyek">
          <ul className="list-disc pl-5 text-sm">
            {projects.map((p) => <li key={p.id}><Link className="text-indigo-600 underline" href={`/reports/project/${p.id}`}>{p.code} — {p.name}</Link></li>)}
          </ul>
        </Card>
      ) : null}
      {isMindId(user) && can(user.role, "project.read") ? (
        <Card title="R-02 · Perbandingan Antar Anggota Holding">
          <Link className="text-sm text-indigo-600 underline" href="/reports/holding">Buka laporan</Link>
        </Card>
      ) : null}
      {can(user.role, "project.read") ? (
        <Card title="R-04 · Progress Curve / Historical">
          <Link className="text-sm text-indigo-600 underline" href="/snapshots">Buka laporan (gunakan Print untuk PDF)</Link>
        </Card>
      ) : null}
      {can(user.role, "do.read") ? (
        <Card title="R-03 · Daftar RCA & Action Plan">
          <Link className="text-sm text-indigo-600 underline" href="/reports/rca">Buka laporan</Link>
        </Card>
      ) : null}
    </div>
  );
}
