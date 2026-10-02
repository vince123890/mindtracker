// Daftar sumber data integrasi — satu tempat untuk teks catatan "Sumber: …" di seluruh aplikasi.
// Mengikuti Analysis/[Timeline & Effort] sheet "20% Dashboard & Integrasi" (MCT, MIND Project, PRISMA, MIND Gate).
// Di prototype seluruhnya masih data dummy; saat development diganti tarikan read-only dari sistem sumber.

export interface DataSource {
  /** Sistem asal. */
  system: string;
  /** Dataset / menu di sistem asal. */
  dataset: string;
  /** Field yang diambil dan dipakai di blok ini. */
  fields: string;
  /** true = angka dihitung MIND Tracker dari data sumber (bukan ditampilkan apa adanya). */
  derived?: boolean;
}

export const SOURCES = {
  "prisma.matrix": {
    system: "PRISMA",
    dataset: "Risk Register",
    fields: "Likelihood (1–5) dan Impact (1–5) per risiko berstatus Open; nomor sel & warna level mengikuti matriks 5×5 PRISMA",
  },
  "prisma.history": {
    system: "PRISMA",
    dataset: "Riwayat Risk Register (bulanan)",
    fields: "jumlah risiko Open dan Mitigated per periode",
  },
  "prisma.top": {
    system: "PRISMA",
    dataset: "Risk Register — Top Risk",
    fields: "urutan Top Risk, deskripsi risiko, Likelihood × Impact",
  },
  "prisma.detail": {
    system: "PRISMA",
    dataset: "Risk Register",
    fields: "Risk ID, taksonomi, deskripsi, penyebab, dampak, Likelihood × Impact, status, rencana & progres mitigasi, PIC",
  },
  "prisma.aggregate": {
    system: "PRISMA",
    dataset: "Risk Register",
    fields: "rating = level tertinggi risiko Open; jumlah Open/Mitigated; rata-rata progres mitigasi",
    derived: true,
  },
  "mindproject.progress": {
    system: "MIND Project (P3MO)",
    dataset: "Data Project",
    fields: "fase/stage proyek, progres fisik (%), status jadwal, target COD",
  },
  "mindgate.document": {
    system: "MIND Gate",
    dataset: "Project FS",
    fields: "status evaluasi RKAP, kelengkapan dokumen FS (%), status FID",
  },
  "mct.production": {
    system: "MCT",
    dataset: "Data Produksi (bulanan)",
    fields: "target RKAP dan realisasi produksi per Anggota Holding, plant, produk & satuan",
  },
  "mct.production.derived": {
    system: "MCT",
    dataset: "Data Produksi (bulanan)",
    fields: "pencapaian = realisasi ÷ target RKAP, dirata-rata per Anggota Holding",
    derived: true,
  },
  "mct.parameter": {
    system: "MCT",
    dataset: "Parameter Operasi",
    fields: "target dan aktual parameter kunci per plant & periode",
  },
  "mct.maintenance": {
    system: "MCT / CMMS",
    dataset: "Maintenance Performance",
    fields: "availability, MTTR, MTBF, work order terbuka per peralatan & periode",
  },
  "simulation.strategy": {
    system: "Aplikasi Simulasi Eksternal",
    dataset: "Downstream Strategy — skenario",
    fields: "variabel asumsi dan proyeksi (pendapatan, EBITDA, IRR) per skenario",
  },
} satisfies Record<string, DataSource>;

export type SourceKey = keyof typeof SOURCES;
