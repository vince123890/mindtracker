"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="no-print rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white">
      Cetak / Simpan PDF
    </button>
  );
}
