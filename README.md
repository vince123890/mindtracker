# MIND Tracker — Prototype (Next.js + Supabase)

Prototype/POC **MIND Tracker** (Project Maturity Assessment · tracker v1.4) beserta pekerjaan
tambahan Dashboard DO. Menu dan sub menu mengikuti `Analysis/menu_blue_print.md` dan modul pada
`Analysis/[Timeline & Effort] MindID - Mind Tracker.xlsx`.

> **Batasan prototype**
> - **Tanpa autentikasi** — 9 user dummy statis; ganti role lewat *Masuk sebagai* di header.
>   Seluruh aturan akses tetap ditegakkan **di server** (menu tidak berhak → 403, data AH lain → 404).
> - **Tanpa integrasi** — data MIND Project, PRISMA, MIND Gate, MCT, dan aplikasi simulasi diganti
>   seed dummy (badge 🧪). Integrasi dikerjakan saat development.
> - Rumus mengikuti `docs/SPEK-RUMUS-Tracker-v1.4.md`, termasuk perbaikan cacat Excel F-01/F-02/F-03.

## Stack

| Lapis | Pilihan |
|---|---|
| Aplikasi | Next.js 16 (App Router, Server Components, Server Actions) + TypeScript + Tailwind CSS 4 |
| Basis data | Supabase (PostgreSQL) — diakses **hanya dari server** dengan service role; RLS aktif tanpa policy |
| Scoring engine | `src/lib/scoring` — fungsi murni, diuji paritas terhadap nilai cache `Dummy Tracker v1.4.xlsx` |
| Grafik animasi | Remotion (`@remotion/player`) di Dashboard — data dari server sesuai role |

## Struktur

```
src/app/                 halaman & server actions (per menu)
src/lib/scoring/         engine tracker v1.4 + RTO + uji (vitest)
src/lib/auth/            user dummy, role, permission, menu × role
src/lib/db/              query Supabase (server-only)
src/remotion/            komposisi grafik animasi dashboard
supabase/migrations/     skema basis data
supabase/seed.sql        data hasil generator (564 deliverable dari Excel v1.4 + data demo)
scripts/generate_seed.py generator seed & fixture uji dari ../docs/Dummy Tracker v1.4.xlsx
```

## Menjalankan secara lokal

1. **Buat proyek Supabase** (supabase.com) — catat *Project URL* dan *service_role key*
   (Project Settings → API).
2. **Buat skema & data**: buka *SQL Editor* Supabase, jalankan berurutan:
   1. `supabase/migrations/20261001000000_init.sql`
   2. `supabase/migrations/20261001000100_rto_and_dummy_sources.sql`
   3. `supabase/seed.sql`
   4. `supabase/migrations/20261002000000_prisma_risk.sql` (risk register PRISMA dummy, sudah berisi datanya;
      database yang sudah di-seed cukup menjalankan file ini saja)

   Alternatif dengan Supabase CLI: `supabase link --project-ref <ref>` lalu `supabase db push`
   dan jalankan `seed.sql`.
3. **Environment**: salin `.env.example` menjadi `.env.local`, isi kedua nilai.
4. ```bash
   npm install
   npm run dev        # http://localhost:3000
   ```

Perintah lain: `npm test` (32 uji scoring engine + RTO), `npm run typecheck`, `npm run lint`,
`npm run motion:studio` (pratinjau komposisi animasi).

## Deploy ke Vercel

1. Push repositori ini ke GitHub/GitLab/Bitbucket.
2. Vercel → **Add New Project** → import repositori. Framework terdeteksi otomatis (Next.js).
   Bila folder `apps/` berada di dalam repositori yang lebih besar, set **Root Directory = `apps`**.
3. **Environment Variables** (Production & Preview):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

   Jangan memberi prefiks `NEXT_PUBLIC_` — kunci service role tidak boleh sampai ke browser.
4. Deploy. Bila env belum diisi, aplikasi menampilkan panduan setup alih-alih galat.

> ⚠️ **Prototype ini tanpa login.** Siapa pun yang memiliki URL dapat berganti role dan mengubah
> data demo. Untuk demo, aktifkan **Vercel Deployment Protection** (Password Protection / Vercel
> Authentication) di Project Settings → Deployment Protection. Untuk mengembalikan data demo,
> kosongkan tabel lalu jalankan ulang `seed.sql`.

## Memperbarui master dari berkas tracker

```bash
npm run seed:generate   # membaca ../docs/Dummy Tracker v1.4.xlsx
```

Generator menormalkan inkonsistensi data Excel (F-06 modifier vs requirement, F-07 kode
ber-NBSP/titik) dan menulis ulang `supabase/seed.sql` serta fixture uji paritas.

## User dummy

| User | Role | Organisasi |
|---|---|---|
| Rina | PMO Admin | MIND ID |
| Budi | Direktur MIND ID | MIND ID |
| Sari | Divisi MIND ID | MIND ID |
| Andi | Divisi DO MIND ID | MIND ID |
| Dewi | Direktur Anggota Holding | Antam |
| Eko | PMO Anggota Holding | Antam |
| Fajar | Tim Proyek | Antam |
| Gita | PIC Operasi AH | Antam |
| Hadi | PMO Anggota Holding | Timah (uji isolasi data) |

## Design system

Tampilan mengikuti layar referensi *Projects Detail / Risk* (PRISMA): header navy, menu modul aktif merah,
tab bar biru muda, kartu putih, header tabel navy. Token warna ada di `src/app/globals.css` (`@theme`);
halaman hidup di `/design-system`. Skala `indigo` Tailwind dipetakan ulang ke navy brand.
