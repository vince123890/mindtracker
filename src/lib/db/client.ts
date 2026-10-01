import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Client Supabase dengan service role — HANYA di server.
 * Prototype tanpa Supabase Auth: RLS aktif tanpa policy sehingga anon key tidak berguna,
 * dan seluruh aturan akses ditegakkan di server Next.js (lib/auth/session.ts).
 */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local (lihat README).");
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Lempar galat yang terbaca bila query Supabase gagal. */
export function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}
