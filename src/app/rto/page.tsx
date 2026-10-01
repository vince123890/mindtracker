import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { btn, Card, Empty, input, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { requirePermission } from "@/lib/auth/session";
import { listAssessments, RTO_STATUS_LABEL } from "@/lib/db/rto";
import { listProjects } from "@/lib/db/tracker";
import { date } from "@/lib/format";
import { createAssessment } from "./actions";

export default async function RtoListPage() {
  const user = await requirePermission("rto.read");
  const projects = await listProjects(user);
  const assessments = await listAssessments(projects);
  const proj = new Map(projects.map((p) => [p.id, p]));
  return (
    <div className="space-y-4">
      <PageHeader title="RTO Assessment" subtitle="Engine 2 — Ready to Operate · 6 Operational Readiness Pillars · sesi penilaian bertanggal dipimpin OR Team Lead" />
      <Card title="Daftar assessment">
        {assessments.length === 0 ? <Empty>Belum ada assessment.</Empty> : (
          <table className="w-full">
            <thead><tr><th className={th}>Tanggal</th><th className={th}>Proyek</th><th className={th}>Titik penilaian</th><th className={th}>Dipimpin</th><th className={th}>Status</th></tr></thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id}>
                  <td className={td}><Link className="text-indigo-600 underline" href={`/rto/${a.id}`}>{date(a.assessment_date)}</Link></td>
                  <td className={td}>{proj.get(a.project_id)?.code} · {proj.get(a.project_id)?.name}</td>
                  <td className={td}>{a.assessment_point}</td>
                  <td className={td}>{a.led_by}</td>
                  <td className={td}>{RTO_STATUS_LABEL[a.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {can(user.role, "rto.write") && projects.length ? (
        <Card title="Assessment baru">
          <ActionForm action={createAssessment} className="grid gap-3 md:grid-cols-4">
            <select name="project_id" className={input}>{projects.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</select>
            <input type="date" name="assessment_date" className={input} />
            <input name="assessment_point" placeholder="Titik penilaian (OI-07)" className={input} />
            <input name="led_by" placeholder="OR Team Lead" className={input} />
            <div><button className={btn}>Buat assessment</button></div>
          </ActionForm>
        </Card>
      ) : null}
    </div>
  );
}
