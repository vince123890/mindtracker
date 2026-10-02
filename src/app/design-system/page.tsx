import { HeatmapLegend, LevelBadge, RiskDetailTable, RiskHeatmap, RiskHistoryChart, TopRiskList } from "@/components/risk";
import { Icon } from "@/components/icons";
import { Pagination } from "@/components/pagination";
import { btn, btnDanger, btnGhost, Card, DummyBadge, GateBadge, input, PageHeader, ReqBadge, SourceNote, Tabs, td, th } from "@/components/ui";
import type { PrismaRisk } from "@/lib/db/prisma";
import type { RiskLevel } from "@/lib/risk/matrix";

/** Referensi design system — diturunkan dari layar "Projects Detail / Risk" PRISMA. Tidak membaca database. */

const COLORS: { group: string; items: { token: string; hex: string; use: string }[] }[] = [
  {
    group: "Brand",
    items: [
      { token: "brand-navy", hex: "#1C2D5A", use: "Header aplikasi, tombol utama, header tabel" },
      { token: "brand-navy-dark", hex: "#142247", use: "Hover tombol utama" },
      { token: "brand-red", hex: "#D4243B", use: "Menu aktif, aksi destruktif, status Open" },
      { token: "brand-blue", hex: "#0B2F8C", use: "Seri utama grafik (batang)" },
      { token: "brand-orange", hex: "#D9730D", use: "Seri kedua grafik (garis)" },
    ],
  },
  {
    group: "Permukaan",
    items: [
      { token: "surface", hex: "#F4F5F7", use: "Latar halaman" },
      { token: "card", hex: "#FFFFFF", use: "Kartu" },
      { token: "line", hex: "#E3E6EB", use: "Border kartu & pemisah baris" },
      { token: "tab", hex: "#E4F2FC", use: "Latar tab bar" },
      { token: "tab-line", hex: "#9CCDF2", use: "Border tab bar" },
    ],
  },
  {
    group: "Level risiko (heatmap)",
    items: [
      { token: "risk-1", hex: "#3A9E10", use: "Rendah" },
      { token: "risk-2", hex: "#B8E986", use: "Rendah–Menengah" },
      { token: "risk-3", hex: "#FFE83A", use: "Menengah" },
      { token: "risk-4", hex: "#FFA83F", use: "Menengah–Tinggi" },
      { token: "risk-5", hex: "#D2141F", use: "Tinggi" },
    ],
  },
];

const SAMPLE: PrismaRisk[] = [
  { project_code: "PRJ-CONTOH", risk_id: "RSK-001", top_rank: 1, taxonomy: "Engineering", title: "Keterlambatan fabrikasi long-lead item", description: "Keterlambatan fabrikasi long-lead item (Smelter Furnace Shell).", cause: "Kapasitas workshop fabrikator penuh akibat lonjakan permintaan global.", impact_desc: "Jadwal critical path berpotensi mundur 3-4 bulan.", likelihood: 4, impact: 5, status: "OPEN", mitigation: "Slot fabrikasi alternatif.", mitigation_progress: 40, owner: "Lead Engineer", last_review: "2026-09-14" },
  { project_code: "PRJ-CONTOH", risk_id: "RSK-002", top_rank: 2, taxonomy: "Financial", title: "Volatilitas kurs", description: "Volatilitas kurs Rupiah terhadap USD (>5% dari asumsi FID).", cause: "Ketidakpastian ekonomi global.", impact_desc: "Pembengkakan CAPEX melebihi anggaran FID.", likelihood: 3, impact: 3, status: "OPEN", mitigation: "Lindung nilai valas.", mitigation_progress: 35, owner: "Treasury", last_review: "2026-09-14" },
  { project_code: "PRJ-CONTOH", risk_id: "RSK-003", top_rank: 3, taxonomy: "Compliance", title: "Review IPPKH tertunda", description: "Proses review IPPKH lebih lama dari yang dijadwalkan.", cause: "Perubahan pejabat di internal kementerian.", impact_desc: "Land clearing tertunda.", likelihood: 2, impact: 3, status: "MITIGATED", mitigation: "Konsultan perizinan.", mitigation_progress: 100, owner: "Perizinan", last_review: "2026-09-12" },
];

const HISTORY = [
  { period: "2026-04-01", open: 22, mitigated: 2 },
  { period: "2026-05-01", open: 20, mitigated: 3 },
  { period: "2026-06-01", open: 18, mitigated: 6 },
  { period: "2026-07-01", open: 17, mitigated: 10 },
  { period: "2026-08-01", open: 15, mitigated: 14 },
  { period: "2026-09-01", open: 13, mitigated: 16 },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card title={title}>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Design System"
        subtitle="Referensi visual MIND Tracker — diturunkan dari layar Projects Detail / Risk (PRISMA). Dokumen: docs/DESIGN-SYSTEM-MIND-Tracker.md"
      />

      <Section title="Warna">
        {COLORS.map((g) => (
          <div key={g.group}>
            <div className="mb-2 text-sm font-semibold text-slate-700">{g.group}</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {g.items.map((c) => (
                <div key={c.token} className="overflow-hidden rounded-lg border border-line">
                  <div className="h-14" style={{ background: c.hex }} />
                  <div className="p-2 text-xs">
                    <div className="font-mono font-semibold">{c.token}</div>
                    <div className="font-mono text-slate-500">{c.hex}</div>
                    <div className="text-slate-600">{c.use}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Tipografi">
        <div className="space-y-2">
          <div className="text-3xl font-semibold">Judul halaman — 30/600</div>
          <div className="text-lg font-semibold">Judul kartu — 18/600</div>
          <div className="text-[15px]">Teks isi daftar — 15/400, line-height lega</div>
          <div className="text-sm">Teks tabel & form — 14/400</div>
          <div className="text-xs text-slate-500">Keterangan, label sumbu — 12/400 abu</div>
          <p className="text-xs text-slate-500">Font: Inter (next/font), cadangan system-ui.</p>
        </div>
      </Section>

      <Section title="Navigasi">
        <p className="text-sm text-slate-600">
          Header navy: logo · menu modul (pill, aktif merah) · notifikasi · avatar user. Sub menu modul tampil sebagai bar putih bergaris bawah merah.
          Di layar &lt; 1280px menu modul pindah ke drawer (ikon hamburger).
        </p>
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-brand-navy p-3">
          <span className="flex items-center gap-2 rounded-lg bg-brand-red px-3 py-2 text-sm font-medium text-white"><Icon name="LayoutDashboard" className="h-4 w-4" />Dashboard</span>
          <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90"><Icon name="ClipboardList" className="h-4 w-4" />PM Tracker</span>
          <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90"><Icon name="FileText" className="h-4 w-4" />Laporan</span>
        </div>
        <div className="text-sm font-semibold text-slate-700">Tab bar halaman</div>
        <Tabs items={[
          { href: "/design-system", label: "Highlight Project", icon: "Trophy", active: false },
          { href: "/design-system", label: "Risk", icon: "TriangleAlert", active: true },
          { href: "/design-system", label: "Phase Gate", icon: "ShieldCheck", active: false },
          { href: "/design-system", label: "Activity", icon: "Activity", active: false },
        ]} />
      </Section>

      <Section title="Tombol, input, badge">
        <div className="flex flex-wrap items-center gap-3">
          <button className={btn}>Utama</button>
          <button className={btnGhost}>Sekunder</button>
          <button className={btnDanger}>Destruktif</button>
          <input className={`${input} max-w-xs`} placeholder="Input teks" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GateBadge status="DRAFT" /><GateBadge status="WAITING_APPROVAL" /><GateBadge status="APPROVED" /><GateBadge status="REVISION_REQUIRED" />
          <ReqBadge value="G" /><ReqBadge value="A" /><ReqBadge value="?" /><ReqBadge value="N" />
          {([1, 2, 3, 4, 5] as RiskLevel[]).map((l) => <LevelBadge key={l} level={l} />)}
          <DummyBadge />
        </div>
      </Section>

      <Section title="Catatan sumber data integrasi">
        <p className="text-sm text-slate-600">
          Setiap blok yang datanya berasal dari sistem lain wajib memberi catatan kecil di bawah isinya: sistem, dataset, dan field yang dipakai.
          Teks diambil dari satu daftar (<code>src/lib/sources.ts</code>); kartu cukup memberi <code>source=&quot;…&quot;</code>.
          Kartu KPI memakai versi ringkas (field lengkap di tooltip). Angka yang dihitung MIND Tracker dari data sumber diawali &quot;Dihitung dari&quot;.
        </p>
        <SourceNote source="prisma.matrix" />
        <SourceNote source="prisma.aggregate" />
        <SourceNote compact source="mindgate.document" />
      </Section>

      <Section title="Tabel">
        <table className="w-full">
          <thead><tr><th className={th}>Risk ID</th><th className={th}>Taksonomi</th><th className={th}>Deskripsi</th></tr></thead>
          <tbody>
            <tr><td className={td}>RSK-001</td><td className={td}>Engineering</td><td className={td}>Header navy, sudut atas membulat, baris dipisah garis tipis.</td></tr>
            <tr><td className={td}>RSK-002</td><td className={td}>Financial</td><td className={td}>Padding sel 12px, teks 14px.</td></tr>
          </tbody>
        </table>
        <Pagination page={{ page: 2, size: 10, total: 57, prefix: "demo" }} />
        <p className="text-xs text-slate-500">
          Paginasi wajib di setiap tabel daftar: default 10 baris, pilihan 10/20/50/100, dikerjakan di server lewat parameter URL
          (<code>page</code>/<code>size</code>, atau <code>&lt;prefix&gt;_page</code> bila satu halaman punya beberapa tabel).
        </p>
      </Section>

      <div className="text-lg font-semibold text-slate-900">Pola: Risk PRISMA (data contoh)</div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card title="Risk Heatmap" source="prisma.matrix">
            <RiskHeatmap markers={SAMPLE.filter((r) => r.status === "OPEN").map((r) => ({ label: String(r.top_rank), likelihood: r.likelihood, impact: r.impact, title: r.title }))} />
            <HeatmapLegend />
          </Card>
          <Card title="History" source="prisma.history"><RiskHistoryChart rows={HISTORY} /></Card>
        </div>
        <Card title="Top Risk" className="lg:col-span-5" source="prisma.top"><TopRiskList risks={SAMPLE} /></Card>
      </div>
      <Card title="Detail Risk" source="prisma.detail"><RiskDetailTable risks={SAMPLE} /></Card>
    </div>
  );
}
