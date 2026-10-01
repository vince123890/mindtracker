import type { Metadata } from "next";
import { RoleSwitcher } from "@/components/role-switcher";
import { Sidebar } from "@/components/sidebar";
import { currentUser } from "@/lib/auth/session";
import { menuFor, ROLE_LABEL } from "@/lib/auth/roles";
import { DUMMY_USERS } from "@/lib/auth/users";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIND Tracker — Prototype",
  description: "Prototype Project Maturity Tracker MIND ID (tracker v1.4)",
};

function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
      <h1 className="mb-2 text-lg font-semibold">Supabase belum dikonfigurasi</h1>
      <p>Isi environment variable berikut (lokal: <code>.env.local</code>; Vercel: Project Settings → Environment Variables), lalu jalankan ulang/redeploy:</p>
      <pre className="mt-3 rounded bg-white p-3 text-xs">SUPABASE_URL=https://&lt;project-ref&gt;.supabase.co{"\n"}SUPABASE_SERVICE_ROLE_KEY=&lt;service-role-key&gt;</pre>
      <p className="mt-3">Lalu jalankan migration di <code>supabase/migrations</code> dan <code>supabase/seed.sql</code> pada database Supabase. Panduan lengkap: README.</p>
    </div>
  );
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const user = await currentUser();
  const items = menuFor(user.role).map(({ href, label, icon, group }) => ({ href, label, icon, group }));
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="no-print border-b border-amber-300 bg-amber-100 px-4 py-1 text-center text-xs text-amber-900">
          Prototype — tanpa autentikasi, user dummy statis, tanpa integrasi. Gunakan &quot;Masuk sebagai&quot; untuk berganti role.
        </div>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded bg-indigo-600 px-2 py-1 text-sm font-bold text-white">MIND</div>
            <div>
              <div className="font-semibold">MIND Tracker</div>
              <div className="text-xs text-slate-500">Project Maturity Assessment · Tracker v1.4</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-xs">
              <div className="font-medium text-slate-800">{user.name}</div>
              <div className="text-slate-500">
                {ROLE_LABEL[user.role]} · {user.organizationName}
              </div>
            </div>
            <RoleSwitcher
              currentId={user.id}
              users={DUMMY_USERS.map((u) => ({ id: u.id, label: `${u.name} — ${ROLE_LABEL[u.role]}` }))}
            />
          </div>
        </header>
        <div className="flex">
          <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-3 md:block" style={{ minHeight: "calc(100vh - 92px)" }}>
            <Sidebar items={items} />
          </aside>
          <main className="min-w-0 flex-1 p-6">{configured ? children : <SetupNotice />}</main>
        </div>
      </body>
    </html>
  );
}
