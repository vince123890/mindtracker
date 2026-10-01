import { ActionForm } from "@/components/action-form";
import { btn, Card, input, PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { getOrganizations, getPhases, getProjectTypes } from "@/lib/db/tracker";
import { createProject } from "../actions";

export default async function NewProjectPage() {
  const user = await requirePermission("project.write");
  const [types, phases, orgs] = await Promise.all([getProjectTypes(), getPhases(true), getOrganizations()]);
  const field = (label: string, el: React.ReactNode, hint?: string) => (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {el}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
  return (
    <div className="max-w-3xl">
      <PageHeader title="Registrasi Proyek" subtitle="FR-1.1 · Project Type 1 & 2 menentukan requirement dan bobot seluruh deliverable" />
      <Card>
        <ActionForm action={createProject} className="grid gap-4 md:grid-cols-2">
          {field("Kode Proyek *", <input name="code" required className={input} placeholder="PRJ-ANTAM-003" />)}
          {field("Nama Proyek *", <input name="name" required className={input} />)}
          {field(
            "Anggota Holding *",
            user.role === "PMO_ADMIN" ? (
              <select name="organization_id" className={input}>
                {orgs.filter((o) => o.kind === "MEMBER").map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            ) : (
              <input className={`${input} bg-slate-100`} value={user.organizationName} readOnly />
            ),
            user.role === "PMO_ADMIN" ? undefined : "Terkunci pada organisasi Anda (isolasi data)",
          )}
          {field("Lokasi *", <input name="location" required className={input} />)}
          {field(
            "Project Type 1 *",
            <select name="project_type_1" required className={input}>
              {types.map((t) => <option key={t.code} value={t.code}>{t.code} — {t.name}</option>)}
            </select>,
          )}
          {field(
            "Project Type 2",
            <select name="project_type_2" className={input} defaultValue="">
              <option value="">— tidak ada —</option>
              {types.map((t) => <option key={t.code} value={t.code}>{t.code} — {t.name}</option>)}
            </select>,
            "Isi bila proyek gabungan dua tipe. Requirement terkuat & modifier terbesar yang berlaku.",
          )}
          {field(
            "Entry Phase *",
            <select name="entry_phase" className={input}>
              {phases.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>,
            "Tidak selalu FEL-0. Tidak dapat diubah setelah registrasi.",
          )}
          {field("Project Manager", <input name="project_manager" className={input} />)}
          {field("Executive Sponsor", <input name="executive_sponsor" className={input} />)}
          {field("Key Dependencies", <input name="key_dependencies" className={input} />)}
          {field("Depended By", <input name="depended_by" className={input} />)}
          <div className="md:col-span-2">{field("Deskripsi", <textarea name="description" rows={3} className={input} />)}</div>
          <div className="md:col-span-2">
            <button className={btn}>Simpan Proyek</button>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
