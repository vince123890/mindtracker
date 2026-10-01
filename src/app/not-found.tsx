import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <div className="text-5xl">404</div>
      <h1 className="mt-2 text-xl font-semibold">Data tidak ditemukan</h1>
      <p className="mt-2 text-sm text-slate-500">
        Data tidak ada, atau milik Anggota Holding lain (isolasi data — keberadaannya tidak diungkap).
      </p>
      <Link href="/" className="mt-6 inline-block text-sm text-indigo-600 underline">
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
