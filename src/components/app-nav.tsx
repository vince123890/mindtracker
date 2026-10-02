"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { switchUser } from "@/app/actions";
import { Icon } from "./icons";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  group: string;
}

export interface NavGroup {
  id: string;
  label: string;
  module: string;
  icon: string;
}

interface UserInfo {
  id: string;
  name: string;
  roleLabel: string;
  organizationName: string;
}

/** Item aktif = href terpanjang yang cocok dengan pathname (mis. /gates/history mengalahkan /gates). */
function useActive(items: NavItem[]) {
  const pathname = usePathname();
  const matches = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const active = items.filter((i) => matches(i.href)).sort((a, b) => b.href.length - a.href.length)[0];
  return active;
}

function initials(name: string) {
  return name.replace(/\(.*\)/, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function AppHeader({
  items,
  groups,
  user,
  users,
}: {
  items: NavItem[];
  groups: NavGroup[];
  user: UserInfo;
  users: { id: string; label: string }[];
}) {
  const [drawer, setDrawer] = useState(false);
  const active = useActive(items);
  const visibleGroups = groups.filter((g) => items.some((i) => i.group === g.id));
  const firstOf = (g: string) => items.find((i) => i.group === g)!.href;
  const subItems = active ? items.filter((i) => i.group === active.group) : [];

  return (
    <header className="no-print sticky top-0 z-30">
      <div className="bg-brand-navy text-white">
        <div className="flex h-16 items-center gap-6 px-4 lg:px-8">
          <Link href="/" className="shrink-0 text-xl font-bold tracking-tight">
            MIND Tracker
          </Link>
          <nav className="hidden flex-1 items-center gap-0.5 xl:flex" aria-label="Modul">
            {visibleGroups.map((g) => {
              const on = active?.group === g.id;
              return (
                <Link
                  key={g.id}
                  href={firstOf(g.id)}
                  title={g.module}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${on ? "bg-brand-red text-white" : "text-white/90 hover:bg-white/10"}`}
                >
                  <Icon name={g.icon} className="hidden h-4 w-4 2xl:block" />
                  {g.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <button type="button" onClick={() => setDrawer(true)} className="rounded p-1 hover:bg-white/10 xl:hidden" aria-label="Buka menu">
              <Icon name="Menu" className="h-6 w-6" />
            </button>
            <span className="relative hidden sm:block" title="Notifikasi — dikerjakan saat development (email/SMTP)">
              <Icon name="Bell" className="h-5 w-5 opacity-80" />
            </span>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">{initials(user.name)}</span>
                <span className="hidden text-left leading-tight md:block">
                  <span className="block text-sm font-semibold">{user.name}</span>
                  <span className="block text-xs text-white/70">{user.roleLabel}</span>
                </span>
                <Icon name="ChevronDown" className="h-4 w-4 opacity-80" />
              </summary>
              <div className="absolute right-0 mt-3 w-80 rounded-xl border border-line bg-white p-4 text-slate-800 shadow-xl">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-slate-500">{user.roleLabel} · {user.organizationName}</div>
                <form action={switchUser} className="mt-3">
                  <label htmlFor="userId" className="mb-1 block text-xs font-medium text-slate-500">Masuk sebagai (user dummy)</label>
                  <select
                    id="userId"
                    name="userId"
                    defaultValue={user.id}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                  >
                    {users.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                </form>
              </div>
            </details>
          </div>
        </div>
      </div>

      {subItems.length > 1 ? (
        <div className="border-b border-line bg-white">
          <nav className="flex gap-1 overflow-x-auto px-4 lg:px-8" aria-label="Sub menu">
            {subItems.map((i) => {
              const on = i.href === active?.href;
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm ${on ? "border-brand-red font-semibold text-brand-navy" : "border-transparent text-slate-600 hover:text-brand-navy"}`}
                >
                  <Icon name={i.icon} className="h-4 w-4" />
                  {i.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}

      {drawer ? (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Tutup menu" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold text-brand-navy">MIND Tracker</span>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Tutup menu"><Icon name="X" /></button>
            </div>
            {visibleGroups.map((g) => (
              <div key={g.id} className="mb-3">
                <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{g.label}</div>
                {items.filter((i) => i.group === g.id).map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={() => setDrawer(false)}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${i.href === active?.href ? "bg-brand-red text-white" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    <Icon name={i.icon} className="h-4 w-4" />
                    {i.label}
                  </Link>
                ))}
              </div>
            ))}
          </aside>
        </div>
      ) : null}
    </header>
  );
}

/** Breadcrumb dari menu aktif + sisa segmen path (detail). */
export function Breadcrumb({ items, groups }: { items: NavItem[]; groups: NavGroup[] }) {
  const active = useActive(items);
  const pathname = usePathname();
  if (!active || pathname === "/") return null;
  const group = groups.find((g) => g.id === active.group);
  const trail: { label: string; href?: string }[] = [{ label: "Dashboard", href: "/" }];
  if (group && group.id !== "dashboard") trail.push({ label: group.label });
  trail.push({ label: active.label, href: pathname === active.href ? undefined : active.href });
  if (pathname !== active.href) trail.push({ label: "Detail" });
  return (
    <ol className="no-print mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
      {trail.map((t, i) => (
        <li key={`${t.label}-${i}`} className="flex items-center gap-2">
          {i > 0 ? <span>/</span> : null}
          {t.href ? <Link href={t.href} className="hover:text-brand-navy">{t.label}</Link> : <span className="text-slate-800">{t.label}</span>}
        </li>
      ))}
    </ol>
  );
}
