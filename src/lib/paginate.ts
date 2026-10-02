// Paginasi sisi server untuk seluruh tabel daftar. Default 10 baris; pilihan 10/20/50/100.
// Parameter URL: `page` & `size`, atau `<prefix>_page` & `<prefix>_size` bila satu halaman punya beberapa tabel.

export const PAGE_SIZES = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

export type SearchParams = Record<string, string | string[] | undefined>;

export interface Page<T> {
  rows: T[];
  page: number;
  size: number;
  total: number;
  /** Prefix parameter URL ("" = page/size). */
  prefix: string;
  /** Nomor urut baris pertama (0-based) — untuk kolom "No". */
  offset: number;
}

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function paramNames(prefix = "") {
  return prefix ? { page: `${prefix}_page`, size: `${prefix}_size` } : { page: "page", size: "size" };
}

export function paginate<T>(rows: T[], sp: SearchParams | undefined, prefix = ""): Page<T> {
  const names = paramNames(prefix);
  const sizeRaw = Number(one(sp?.[names.size]));
  const size = (PAGE_SIZES as readonly number[]).includes(sizeRaw) ? sizeRaw : DEFAULT_PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const pageRaw = Math.floor(Number(one(sp?.[names.page])));
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.min(pageRaw, pages) : 1;
  const offset = (page - 1) * size;
  return { rows: rows.slice(offset, offset + size), page, size, total: rows.length, prefix, offset };
}
