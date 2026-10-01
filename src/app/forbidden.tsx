import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <div className="text-5xl">403</div>
      <h1 className="mt-2 text-xl font-semibold">Menu ini tidak tersedia untuk role Anda</h1>
      <p className="mt-2 text-sm text-slate-500">
        Akses ditegakkan di server berdasarkan matriks Menu × Role. Ganti role melalui &quot;Masuk sebagai&quot; di kanan atas.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm text-indigo-600 underline">
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
