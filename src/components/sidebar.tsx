"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Item {
  href: string;
  label: string;
  icon: string;
  group?: string;
}

export function Sidebar({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const matches = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const activeHref = items.filter((i) => matches(i.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="space-y-0.5 text-sm">
      {items.map((item, i) => {
        const active = item.href === activeHref;
        const header = item.group && item.group !== items[i - 1]?.group ? item.group : null;
        return (
          <div key={item.href}>
            {header ? <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{header}</div> : null}
            <Link
              href={item.href}
              className={`flex items-center gap-2 rounded px-3 py-1.5 ${active ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
