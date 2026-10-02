import "server-only";
import type { DummyUser } from "@/lib/auth/users";
import { isMindId } from "@/lib/auth/session";
import { db, must } from "./client";
import { listProjects } from "./tracker";

// DUMMY pengganti integrasi PRISMA (I-2). Saat development diganti tarikan read-only dari API PRISMA.

export interface PrismaRisk {
  project_code: string;
  risk_id: string;
  top_rank: number | null;
  taxonomy: string;
  title: string;
  description: string;
  cause: string;
  impact_desc: string;
  likelihood: number;
  impact: number;
  status: "OPEN" | "MITIGATED" | "CLOSED";
  mitigation: string | null;
  mitigation_progress: number;
  owner: string | null;
  last_review: string;
}

export interface PrismaHistory {
  project_code: string;
  period: string;
  open_count: number;
  mitigated_count: number;
}

/** Tabel belum dibuat (migration 20261002000000_prisma_risk.sql belum dijalankan). */
function isMissingTable(error: { code?: string; message: string } | null): boolean {
  return !!error && (error.code === "PGRST205" || error.code === "42P01" || /could not find the table|does not exist/i.test(error.message));
}

/** false bila tabel PRISMA belum ada — halaman menampilkan petunjuk alih-alih error 500. */
export async function prismaAvailable(): Promise<boolean> {
  // Query biasa (bukan HEAD): pada HEAD, PostgREST tidak mengirim body sehingga galat "tabel tidak ada" tidak terbaca.
  const { error } = await db().from("ext_prisma_risk").select("risk_id").limit(1);
  if (isMissingTable(error)) return false;
  if (error) throw new Error(`ext_prisma_risk: ${error.message}`);
  return true;
}

/** Kode proyek yang boleh dilihat user: MIND ID seluruhnya, AH hanya proyek organisasinya. */
async function visibleCodes(user: DummyUser): Promise<Set<string> | null> {
  if (isMindId(user)) return null;
  return new Set((await listProjects(user)).map((p) => p.code));
}

export async function listRisks(user: DummyUser, projectCode?: string): Promise<PrismaRisk[]> {
  let q = db().from("ext_prisma_risk").select("*").order("project_code").order("risk_id");
  if (projectCode) q = q.eq("project_code", projectCode);
  const res = await q;
  if (isMissingTable(res.error)) return [];
  const rows = must(res, "ext_prisma_risk") as PrismaRisk[];
  const allowed = await visibleCodes(user);
  return allowed ? rows.filter((r) => allowed.has(r.project_code)) : rows;
}

export async function listRiskHistory(user: DummyUser, projectCode?: string): Promise<PrismaHistory[]> {
  let q = db().from("ext_prisma_risk_history").select("*").order("period");
  if (projectCode) q = q.eq("project_code", projectCode);
  const res = await q;
  if (isMissingTable(res.error)) return [];
  const rows = must(res, "ext_prisma_risk_history") as PrismaHistory[];
  const allowed = await visibleCodes(user);
  return allowed ? rows.filter((r) => allowed.has(r.project_code)) : rows;
}

/** Jumlahkan riwayat beberapa proyek per periode (untuk tampilan portofolio). */
export function sumHistory(rows: PrismaHistory[]): { period: string; open: number; mitigated: number }[] {
  const by = new Map<string, { period: string; open: number; mitigated: number }>();
  for (const r of rows) {
    const cur = by.get(r.period) ?? { period: r.period, open: 0, mitigated: 0 };
    cur.open += r.open_count;
    cur.mitigated += r.mitigated_count;
    by.set(r.period, cur);
  }
  return [...by.values()].sort((a, b) => a.period.localeCompare(b.period));
}
