import { btnGhost, Card, input, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { requirePermission } from "@/lib/auth/session";
import { getProjectTypes } from "@/lib/db/tracker";
import { updateProjectType } from "../actions";

export default async function ProjectTypesPage() {
  const user = await requirePermission("master.read");
  const types = await getProjectTypes();
  const editable = can(user.role, "master.write");
  return (
    <div className="max-w-5xl">
      <PageHeader title="Tipe Proyek" subtitle="Kode peka huruf besar/kecil — m-PM (v1.4) berbeda dari MPM · kode tidak dapat diubah atau dihapus" />
      <Card>
        <table className="w-full">
          <thead><tr><th className={th}>Kode</th><th className={th}>Header modifier</th><th className={th}>Nama</th><th className={th}>Kriteria (OI-15)</th><th className={th}></th></tr></thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.code}>
                <td className={`${td} font-mono font-semibold`}>{t.code}</td>
                <td className={`${td} font-mono text-xs`}>{t.modifier_header}</td>
                {editable ? (
                  <td className={td} colSpan={3}>
                    <form action={updateProjectType} className="flex gap-2">
                      <input type="hidden" name="code" value={t.code} />
                      <input name="name" defaultValue={t.name} className={input} />
                      <input name="criteria" defaultValue={t.criteria ?? ""} placeholder="Kriteria pemilihan tipe" className={input} />
                      <button className={btnGhost}>Simpan</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className={td}>{t.name}</td>
                    <td className={td}>{t.criteria ?? "—"}</td>
                    <td className={td}></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
