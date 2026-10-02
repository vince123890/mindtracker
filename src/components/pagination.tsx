"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PAGE_SIZES, paramNames, type Page } from "@/lib/paginate";
import { Icon } from "./icons";

/** Kontrol paginasi tabel: info baris, pilihan jumlah baris (10/20/50/100), navigasi halaman. */
export function Pagination({ page: p }: { page: Pick<Page<unknown>, "page" | "size" | "total" | "prefix"> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const names = paramNames(p.prefix);
  const pages = Math.max(1, Math.ceil(p.total / p.size));

  const go = (changes: Record<string, number>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) next.set(k, String(v));
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  if (p.total === 0) return null;
  const from = (p.page - 1) * p.size + 1;
  const to = Math.min(p.total, p.page * p.size);

  // Nomor halaman ringkas: 1 … (p-1) p (p+1) … last
  const nums = [...new Set([1, p.page - 1, p.page, p.page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const btn = "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm";

  return (
    <div className="no-print mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <span>Tampilkan</span>
        <select
          aria-label="Jumlah baris per halaman"
          value={p.size}
          onChange={(e) => go({ [names.size]: Number(e.target.value), [names.page]: 1 })}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1"
        >
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span>baris · {from}–{to} dari {p.total}</span>
      </div>
      {pages > 1 ? (
        <nav className="flex items-center gap-1" aria-label="Halaman">
          <button type="button" disabled={p.page === 1} onClick={() => go({ [names.page]: p.page - 1 })} className={`${btn} border-slate-300 bg-white disabled:opacity-40`} aria-label="Sebelumnya">
            <Icon name="ArrowLeft" className="h-4 w-4" />
          </button>
          {nums.map((n, i) => (
            <span key={n} className="flex items-center gap-1">
              {i > 0 && n - nums[i - 1] > 1 ? <span className="px-1">…</span> : null}
              <button
                type="button"
                onClick={() => go({ [names.page]: n })}
                aria-current={n === p.page ? "page" : undefined}
                className={`${btn} ${n === p.page ? "border-brand-navy bg-brand-navy font-semibold text-white" : "border-slate-300 bg-white hover:bg-slate-50"}`}
              >
                {n}
              </button>
            </span>
          ))}
          <button type="button" disabled={p.page === pages} onClick={() => go({ [names.page]: p.page + 1 })} className={`${btn} border-slate-300 bg-white disabled:opacity-40`} aria-label="Berikutnya">
            <Icon name="ArrowLeft" className="h-4 w-4 rotate-180" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
