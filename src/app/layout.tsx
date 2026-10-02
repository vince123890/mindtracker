import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppHeader, Breadcrumb } from "@/components/app-nav";
import { currentUser } from "@/lib/auth/session";
import { MENU_GROUPS, menuFor, ROLE_LABEL } from "@/lib/auth/roles";
import { DUMMY_USERS } from "@/lib/auth/users";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MIND Tracker — Prototype",
  description: "Prototype Project Maturity Tracker MIND ID (tracker v1.4)",
};

function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
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
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-surface font-sans text-slate-900 antialiased">
        <div className="no-print bg-amber-100 px-4 py-1 text-center text-xs text-amber-900">
          Prototype — tanpa autentikasi, user dummy statis, tanpa integrasi. Ganti role lewat menu user di kanan atas.
        </div>
        <AppHeader
          items={items}
          groups={MENU_GROUPS}
          user={{ id: user.id, name: user.name, roleLabel: ROLE_LABEL[user.role], organizationName: user.organizationName }}
          users={DUMMY_USERS.map((u) => ({ id: u.id, label: `${u.name} — ${ROLE_LABEL[u.role]}` }))}
        />
        <main className="mx-auto min-w-0 max-w-[1600px] px-4 py-6 lg:px-8">
          <Breadcrumb items={items} groups={MENU_GROUPS} />
          {configured ? children : <SetupNotice />}
        </main>
      </body>
    </html>
  );
}
