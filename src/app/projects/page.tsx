import Link from "next/link";
import { Card, Empty, GateBadge, LinkButton, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { isMindId, requirePermission } from "@/lib/auth/session";
import { currentPhaseOverview, getConfig, getOrganizations, getProjectTypes, listProjects } from "@/lib/db/tracker";
import { pct } from "@/lib/format";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("project.read");
  const sp = await searchParams;
  const [config, all, orgs, types] = await Promise.all([getConfig(), listProjects(user), getOrganizations(), getProjectTypes()]);
  const q = (sp.q ?? "").toLowerCase();
  const projects = all.filter(
    (p) =>
      (!q || p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)) &&
      (!sp.org || p.organization_id === sp.org) &&
      (!sp.type || p.project_type_1 === sp.type || p.project_type_2 === sp.type) &&
      (!sp.phase || p.current_phase === sp.phase),
  );
  const overview = await currentPhaseOverview(projects);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const typeName = new Map(types.map((t) => [t.code, t.name]));
  const filtered = projects.filter((p) => !sp.gate || overview.get(p.id)?.instance.gate_status === sp.gate);

  return (
    <div>
      <PageHeader
        title="Daftar Proyek"
        subtitle={`${filtered.length} proyek · fase berjalan dengan Index 1–4`}
        actions={can(user.role, "project.write") ? <LinkButton href="/projects/new">+ Registrasi Proyek</LinkButton> : null}
      />
      <Card>
        <form className="mb-4 flex flex-wrap gap-2 text-sm">
          <input name="q" defaultValue={sp.q} placeholder="Cari kode / nama…" className="rounded border border-slate-300 px-2 py-1" />
          {isMindId(user) ? (
            <select name="org" defaultValue={sp.org ?? ""} className="rounded border border-slate-300 px-2 py-1">
              <option value="">Semua Anggota Holding</option>
              {orgs.filter((o) => o.kind === "MEMBER").map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          ) : null}
          <select name="type" defaultValue={sp.type ?? ""} className="rounded border border-slate-300 px-2 py-1">
            <option value="">Semua tipe</option>
            {types.map((t) => <option key={t.code} value={t.code}>{t.code} — {t.name}</option>)}
          </select>
          <select name="phase" defaultValue={sp.phase ?? ""} className="rounded border border-slate-300 px-2 py-1">
            <option value="">Semua fase</option>
            {["FEL-0", "FEL-1", "FEL-2", "FEL-3"].map((p) => <option key={p}>{p}</option>)}
          </select>
          <select name="gate" defaultValue={sp.gate ?? ""} className="rounded border border-slate-300 px-2 py-1">
            <option value="">Semua status gate</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING_APPROVAL">Menunggu Persetujuan</option>
            <option value="APPROVED">Disetujui</option>
          </select>
          <button className="rounded bg-slate-800 px-3 py-1 text-white">Terapkan</button>
        </form>
        {filtered.length === 0 ? <Empty>Tidak ada proyek yang cocok dengan filter.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={th}>Kode · Nama</th>
                  {isMindId(user) ? <th className={th}>Anggota Holding</th> : null}
                  <th className={th}>Tipe Proyek</th>
                  <th className={th}>Fase</th>
                  <th className={th}>Gate</th>
                  <th className={th} title="FEL Delivery Maturity Index">Index 1</th>
                  <th className={th} title="FEL Gate Control Deliverable Index">Index 2</th>
                  <th className={th} title="Requirement belum diputuskan">Index 4</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const sc = overview.get(p.id)!;
                  const i = sc.result.indices;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className={td}>
                        <Link href={`/projects/${p.id}`} className="font-medium text-indigo-700 hover:underline">{p.code}</Link>
                        <div className="text-xs text-slate-500">{p.name}</div>
                      </td>
                      {isMindId(user) ? <td className={td}>{orgName.get(p.organization_id)}</td> : null}
                      <td className={td}>
                        <span title={typeName.get(p.project_type_1)}>{p.project_type_1}</span>
                        {p.project_type_2 ? <> + <span title={typeName.get(p.project_type_2)}>{p.project_type_2}</span></> : null}
                      </td>
                      <td className={td}>{p.current_phase}</td>
                      <td className={td}><GateBadge status={sc.instance.gate_status} /></td>
                      <td className={`${td} ${config.gateMinMaturityPct !== null && (i.index1 ?? 0) < config.gateMinMaturityPct ? "text-rose-700" : "text-emerald-700"}`}>{pct(i.index1)}</td>
                      <td className={`${td} ${i.index2 !== null && i.index2 < 1 ? "text-rose-700" : ""}`}>{pct(i.index2)}</td>
                      <td className={`${td} ${i.index4 ? "text-amber-700" : ""}`}>{i.index4}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
