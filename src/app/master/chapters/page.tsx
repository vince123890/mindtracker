import type { SearchParams } from "@/lib/paginate";
import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/paginate";
import { btnGhost, Card, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { requirePermission } from "@/lib/auth/session";
import { getChapters, getDimensions } from "@/lib/db/tracker";
import { mapChapter } from "../actions";

export default async function ChaptersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requirePermission("master.read");
  const [chapters, dims] = await Promise.all([getChapters(), getDimensions()]);
  const editable = can(user.role, "master.write");
  const pg = paginate(chapters, await searchParams);
  return (
    <div className="max-w-4xl">
      <PageHeader title="Chapter & Dimensi" subtitle="15 chapter → 4 dimensi tracker v1.4 · 8 chapter belum dipetakan (OI-09) tetap dihitung di Index 1–4" />
      <Card>
        <table className="w-full">
          <thead><tr><th className={th}>No.</th><th className={th}>Prefiks kode</th><th className={th}>Chapter / Function</th><th className={th}>Dimensi</th></tr></thead>
          <tbody>
            {pg.rows.map((c) => (
              <tr key={c.chapter_no}>
                <td className={td}>{c.chapter_no}</td>
                <td className={`${td} font-mono`}>{c.code_prefix}</td>
                <td className={td}>{c.name}</td>
                <td className={td}>
                  {editable ? (
                    <form action={mapChapter} className="flex gap-2">
                      <input type="hidden" name="chapter_no" value={c.chapter_no} />
                      <select name="dimension_id" defaultValue={c.dimension_id ?? ""} className="rounded border border-slate-300 px-2 py-1 text-sm">
                        <option value="">— belum dipetakan —</option>
                        {dims.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <button className={btnGhost}>Simpan</button>
                    </form>
                  ) : (dims.find((d) => d.id === c.dimension_id)?.name ?? <span className="text-amber-700">belum dipetakan</span>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={pg} />
        <p className="mt-3 text-xs text-slate-500">Nama chapter adalah inferensi dari prefiks kode deliverable (berkas dummy menyamarkannya sebagai &quot;Chapter 01–15&quot;).</p>
      </Card>
    </div>
  );
}
