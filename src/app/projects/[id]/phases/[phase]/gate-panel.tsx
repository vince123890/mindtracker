"use client";

import { ActionForm } from "@/components/action-form";
import { approveGate, requestRevision, submitGate } from "../../../actions";

export function GatePanel({
  projectId,
  phase,
  status,
  canSubmit,
  canApprove,
  blocking,
}: {
  projectId: string;
  phase: string;
  status: string;
  canSubmit: boolean;
  canApprove: boolean;
  blocking: { code: string; message: string; items: string[] }[];
}) {
  const hidden = (
    <>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="phase" value={phase} />
    </>
  );
  const editable = status === "DRAFT" || status === "REVISION_REQUIRED";
  return (
    <div className="space-y-3">
      {editable ? (
        blocking.length === 0 ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">
            ✓ Seluruh syarat gate terpenuhi: Index 4 = 0, seluruh Gate Control ≥ 3, Index 1 ≥ ambang.
          </div>
        ) : (
          <div className="rounded border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
            <div className="font-medium">Penahan gate ({blocking.length})</div>
            <ul className="mt-1 space-y-1">
              {blocking.map((b) => (
                <li key={b.code}>
                  <b>{b.code}</b> — {b.message}
                  {b.items.length ? <div className="text-xs">{b.items.slice(0, 12).join(" · ")}{b.items.length > 12 ? ` · +${b.items.length - 12} lainnya` : ""}</div> : null}
                </li>
              ))}
            </ul>
          </div>
        )
      ) : null}

      {canSubmit && editable ? (
        <ActionForm action={submitGate} okMessage="Gate diajukan — menunggu persetujuan PMO MIND ID.">
          {hidden}
          <button className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Ajukan Gate</button>
        </ActionForm>
      ) : null}

      {canApprove && status === "WAITING_APPROVAL" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <ActionForm action={approveGate} className="space-y-2" okMessage="Gate disetujui — fase berikutnya dibuka.">
            {hidden}
            <input name="note" placeholder="Catatan persetujuan (opsional)" className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
            <button className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">Setujui</button>
          </ActionForm>
          <ActionForm action={requestRevision} className="space-y-2" okMessage="Dikembalikan ke Draft — skor tidak direset.">
            {hidden}
            <input name="note" placeholder="Alasan revisi (wajib)" className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
            <button className="rounded bg-rose-600 px-3 py-1.5 text-sm font-medium text-white">Minta Revisi</button>
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}
