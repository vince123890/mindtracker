"use client";

import { ActionForm } from "@/components/action-form";
import { createActionPlan, reviewRca, submitRca, updateProgress, verifyActionPlan } from "./actions";

const cls = "rounded border border-slate-300 px-2 py-1 text-sm";

export function ProgressForm({ id, progress }: { id: string; progress: number }) {
  return (
    <ActionForm action={updateProgress} className="flex flex-wrap items-center gap-1" okMessage="Progres tersimpan.">
      <input type="hidden" name="id" value={id} />
      <input type="number" name="progress" min={0} max={100} defaultValue={progress} className={`${cls} w-20`} aria-label="Progres" />
      <input name="note" placeholder="Catatan" className={`${cls} w-40`} />
      <button className="rounded bg-indigo-600 px-2 py-1 text-xs text-white">Update</button>
    </ActionForm>
  );
}

export function VerifyForm({ id }: { id: string }) {
  return (
    <ActionForm action={verifyActionPlan} className="flex flex-wrap items-center gap-1" okMessage="Keputusan tersimpan.">
      <input type="hidden" name="id" value={id} />
      <input name="note" placeholder="Catatan (wajib bila dikembalikan)" className={`${cls} w-52`} />
      <button name="decision" value="verify" className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Verifikasi</button>
      <button name="decision" value="return" className="rounded bg-rose-600 px-2 py-1 text-xs text-white">Kembalikan</button>
    </ActionForm>
  );
}

export function NewActionPlanForm({ rcaId }: { rcaId: string }) {
  return (
    <ActionForm action={createActionPlan} className="grid gap-2 md:grid-cols-4" okMessage="Action plan ditambahkan.">
      <input type="hidden" name="rca_id" value={rcaId} />
      <input name="action" placeholder="Tindakan *" className={`${cls} md:col-span-2`} />
      <input name="pic" placeholder="PIC *" className={cls} />
      <input type="date" name="target_date" className={cls} />
      <div><button className="rounded bg-indigo-600 px-3 py-1 text-sm text-white">Tambah action plan</button></div>
    </ActionForm>
  );
}

export function SubmitRcaForm({ id }: { id: string }) {
  return (
    <ActionForm action={submitRca} okMessage="RCA diajukan untuk review.">
      <input type="hidden" name="id" value={id} />
      <button className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white">Ajukan review</button>
    </ActionForm>
  );
}

export function ReviewRcaForm({ id }: { id: string }) {
  return (
    <ActionForm action={reviewRca} className="space-y-2" okMessage="Review tersimpan.">
      <input type="hidden" name="id" value={id} />
      <textarea name="note" rows={2} placeholder="Catatan review (wajib untuk Minta Perbaikan)" className={`${cls} w-full`} />
      <div className="flex gap-2">
        <button name="decision" value="approve" className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white">Setujui</button>
        <button name="decision" value="fix" className="rounded bg-rose-600 px-3 py-1.5 text-sm text-white">Minta Perbaikan</button>
      </div>
      <p className="text-xs text-slate-500">Tidak ada tolak permanen — RCA diperbaiki sampai memadai.</p>
    </ActionForm>
  );
}
