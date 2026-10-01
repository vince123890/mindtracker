import { Card, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { requirePermission } from "@/lib/auth/session";
import { getChapters, getPhases, getProjectTypes, loadDeliverables } from "@/lib/db/tracker";
import { ApplicabilityCell, BaseWeightCell } from "./cell-forms";

export default async function DeliverablesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermission("master.read");
  const sp = await searchParams;
  const phase = sp.phase ?? "FEL-0";
  const [phases, types, chapters, all] = await Promise.all([getPhases(true), getProjectTypes(), getChapters(), loadDeliverables(phase)]);
  const chName = new Map(chapters.map((c) => [c.chapter_no, c.name]));
  const rows = all.filter((d) => !sp.chapter || String(d.chapter_no) === sp.chapter);
  const editable = can(user.role, "master.write");
  const summary = types.map((t) => {
    const c: Record<"G" | "A" | "C" | "N", number> = { G: 0, A: 0, C: 0, N: 0 };
    all.forEach((d) => (c[d.deliverable_applicability.find((a) => a.project_type_code === t.code)!.marker] += 1));
    return { code: t.code, ...c };
  });

  return (
    <div>
      <PageHeader title="Deliverable & Requirement Matrix" subtitle={`Seed dari Dummy Tracker v1.4 · ${all.length} deliverable pada ${phase} · nama deliverable masih disamarkan seperti berkas sumber`} />
      <Card>
        <form className="mb-3 flex flex-wrap gap-2 text-sm">
          <select name="phase" defaultValue={phase} className="rounded border border-slate-300 px-2 py-1">
            {phases.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
          <select name="chapter" defaultValue={sp.chapter ?? ""} className="rounded border border-slate-300 px-2 py-1">
            <option value="">Semua chapter</option>
            {chapters.map((c) => <option key={c.chapter_no} value={c.chapter_no}>{c.chapter_no}. {c.name}</option>)}
          </select>
          <button className="rounded bg-slate-800 px-3 py-1 text-white">Terapkan</button>
        </form>
        <div className="mb-3 flex flex-wrap gap-3 text-xs">
          {summary.map((s) => <span key={s.code} className="rounded bg-slate-100 px-2 py-1"><b>{s.code}</b>: G {s.G} · A {s.A} · C {s.C} · – {s.N}</span>)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Chapter</th><th className={th}>Kode</th><th className={th}>Deliverable</th><th className={th}>Base Weight</th>
                {types.map((t) => <th key={t.code} className={`${th} text-center`} title={t.name}>{t.code}<div className="font-normal normal-case">req · modifier</div></th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className={`${td} text-xs text-slate-500`}>{chName.get(d.chapter_no)}</td>
                  <td className={`${td} font-mono text-xs`}>{d.code}</td>
                  <td className={td}>{d.name}</td>
                  <td className={td}><BaseWeightCell deliverableId={d.id} value={Number(d.base_weight)} editable={editable} /></td>
                  {types.map((t) => {
                    const a = d.deliverable_applicability.find((x) => x.project_type_code === t.code)!;
                    return <td key={t.code} className={`${td} text-center`}><ApplicabilityCell deliverableId={d.id} type={t.code} marker={a.marker} modifier={Number(a.modifier)} editable={editable} /></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">Impor master dari Excel melalui UI dikerjakan saat development; prototype memakai <code>scripts/generate_seed.py</code>.</p>
      </Card>
    </div>
  );
}
