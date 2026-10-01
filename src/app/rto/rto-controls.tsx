"use client";

import { ActionForm } from "@/components/action-form";
import { changeAssessmentStatus, saveRtoResult } from "./actions";

export function RtoResultForm({
  assessmentId,
  requirementId,
  score,
  isNa,
  delivered,
  notes,
}: {
  assessmentId: string;
  requirementId: number;
  score: number | null;
  isNa: boolean;
  delivered: boolean;
  notes: string | null;
}) {
  return (
    <ActionForm action={saveRtoResult} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="assessment_id" value={assessmentId} />
      <input type="hidden" name="requirement_id" value={requirementId} />
      <select name="maturity_score" defaultValue={isNa ? "NA" : score === null ? "" : String(score)} className="rounded border border-slate-300 px-1 py-0.5 text-sm" aria-label="Maturity">
        <option value="">–</option>
        {[0, 1, 2, 3, 4].map((x) => <option key={x} value={x}>{x}</option>)}
        <option value="NA">NA</option>
      </select>
      <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="is_delivered" defaultChecked={delivered} /> Terpenuhi</label>
      <input name="notes" defaultValue={notes ?? ""} placeholder="Catatan diskusi" className="w-48 rounded border border-slate-300 px-2 py-0.5 text-xs" />
      <button className="rounded bg-indigo-600 px-2 py-0.5 text-xs text-white">Simpan</button>
    </ActionForm>
  );
}

export function RtoStatusForm({ assessmentId, target, label }: { assessmentId: string; target: string; label: string }) {
  return (
    <ActionForm action={changeAssessmentStatus} okMessage="Status diperbarui.">
      <input type="hidden" name="assessment_id" value={assessmentId} />
      <input type="hidden" name="status" value={target} />
      <button className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white">{label}</button>
    </ActionForm>
  );
}
