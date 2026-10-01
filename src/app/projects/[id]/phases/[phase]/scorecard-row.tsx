"use client";

import { ActionForm } from "@/components/action-form";
import { addFeedback, decideConditional, saveScore } from "../../../actions";

export interface RowView {
  deliverableId: number;
  code: string;
  name: string;
  referenceDocument: string | null;
  chapterName: string;
  marker1: string;
  marker2: string | null;
  accepted: string;
  overall: string;
  baseWeight: number;
  effectiveWeight: number;
  score: number | null;
  isNa: boolean;
  starting: string;
  completion: string;
  weightedScore: string;
  resolution: string | null;
  justification: string | null;
  notes: string | null;
  actionPlan: string | null;
  responsiblePerson: string | null;
  dueDate: string | null;
  updatedAt: string | null;
  feedback: { id: number; author: string; body: string; at: string; blocking: boolean }[];
}

export interface RowPermissions {
  score: boolean;
  conditional: boolean;
  feedback: boolean;
  editableStatus: boolean;
}

const TONE: Record<string, string> = {
  G: "bg-indigo-600 text-white",
  A: "bg-sky-100 text-sky-800",
  "?": "bg-amber-400 text-amber-950",
  N: "bg-slate-100 text-slate-400",
  C: "bg-amber-100 text-amber-800",
};

// Kriteria skor resmi — Instruction & Note tracker v1.4 (teks Score Guide per deliverable masih disamarkan)
const GUIDE = [
  "0 — Not available",
  "1 — Contains significant gaps",
  "2 — Incomplete and insufficient for current Gate",
  "3 — Sufficient for current Gate",
  "4 — More than sufficient for current Gate",
  "NA — Not applicable",
];

function Badge({ v }: { v: string | null }) {
  if (!v) return <span className="text-slate-300">–</span>;
  return <span className={`inline-block min-w-7 rounded px-1.5 py-0.5 text-center text-xs font-semibold ${TONE[v] ?? ""}`}>{v === "N" ? "N/R" : v}</span>;
}

const inputCls = "w-full rounded border border-slate-300 px-2 py-1 text-sm";

export function ScorecardRow({
  row,
  projectId,
  phase,
  perm,
}: {
  row: RowView;
  projectId: string;
  phase: string;
  perm: RowPermissions;
}) {
  const scorable = row.accepted === "G" || row.accepted === "A";
  const canScore = perm.score && perm.editableStatus && scorable;
  const gateLow = row.accepted === "G" && row.completion === "0";
  const hidden = (
    <>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="phase" value={phase} />
      <input type="hidden" name="deliverable_id" value={row.deliverableId} />
    </>
  );
  const scoreValue = row.isNa ? "NA" : row.score === null ? "" : String(row.score);

  return (
    <tbody className={`border-b border-slate-100 ${!scorable && row.accepted !== "?" ? "text-slate-400" : ""}`}>
      <tr className={gateLow ? "bg-rose-50" : row.accepted === "?" ? "bg-amber-50" : ""}>
        <td className="px-2 py-1.5 text-xs text-slate-500">{row.chapterName}</td>
        <td className="px-2 py-1.5 font-mono text-xs">{row.code}</td>
        <td className="px-2 py-1.5 text-sm">{row.name}</td>
        <td className="px-2 py-1.5 text-center"><Badge v={row.marker1} /> {row.marker2 ? <Badge v={row.marker2} /> : null}</td>
        <td className="px-2 py-1.5 text-center"><Badge v={row.accepted} /></td>
        <td className="px-2 py-1.5 text-right text-xs">{row.baseWeight.toFixed(2)}</td>
        <td className="bg-slate-50 px-2 py-1.5 text-right text-xs" title="Base × MAX(modifier)">🔒 {scorable ? row.effectiveWeight.toFixed(3) : "—"}</td>
        <td className="px-2 py-1.5">
          {canScore ? (
            <ActionForm action={saveScore} className="flex items-center gap-1">
              {hidden}
              <input type="hidden" name="notes" value={row.notes ?? ""} />
              <input type="hidden" name="action_plan" value={row.actionPlan ?? ""} />
              <input type="hidden" name="responsible_person" value={row.responsiblePerson ?? ""} />
              <input type="hidden" name="due_date" value={row.dueDate ?? ""} />
              <select name="score" defaultValue={scoreValue} className="rounded border border-slate-300 px-1 py-0.5 text-sm" aria-label={`Skor ${row.code}`}>
                <option value="">–</option>
                {[0, 1, 2, 3, 4].map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="NA">NA</option>
              </select>
              <button className="rounded bg-indigo-600 px-1.5 py-0.5 text-xs text-white">Simpan</button>
            </ActionForm>
          ) : (
            <span className="text-sm">{scorable ? scoreValue || "–" : "▨"}</span>
          )}
        </td>
        <td className="bg-slate-50 px-2 py-1.5 text-center text-xs">🔒 {row.starting}</td>
        <td className={`bg-slate-50 px-2 py-1.5 text-center text-xs ${gateLow ? "font-bold text-rose-700" : ""}`}>🔒 {row.completion}{gateLow ? " ⛔" : ""}</td>
        <td className="bg-slate-50 px-2 py-1.5 text-right text-xs">🔒 {row.weightedScore}</td>
        <td className="relative px-2 py-1.5">
          <details className="text-xs">
            <summary className="cursor-pointer text-indigo-600">
              {row.accepted === "?" ? "Putuskan" : "Detail"}
              {row.feedback.length ? ` · 💬${row.feedback.length}` : ""}
            </summary>
            <div className="absolute right-0 z-10 mt-1 w-[28rem] space-y-3 rounded border border-slate-200 bg-white p-3 text-left text-slate-800 shadow-lg">
              <div className="text-xs text-slate-500">Reference Document: {row.referenceDocument ?? "—"} · Update terakhir: {row.updatedAt ? new Date(row.updatedAt).toLocaleString("id-ID") : "—"}</div>

              <div>
                <div className="font-semibold">Panduan skor</div>
                <ul className="text-xs text-slate-600">{GUIDE.map((g) => <li key={g}>{g}</li>)}</ul>
              </div>

              {row.overall === "C" ? (
                <div className="rounded border border-amber-300 bg-amber-50 p-2">
                  <div className="font-semibold">Keputusan Conditional (tracker v1.4 langkah 4)</div>
                  {row.resolution ? (
                    <div className="text-xs">Diputuskan: <b>{row.resolution}</b> — {row.justification}</div>
                  ) : (
                    <div className="text-xs">Belum diputuskan — menahan gate (Index 4).</div>
                  )}
                  {perm.conditional && perm.editableStatus ? (
                    <ActionForm action={decideConditional} className="mt-2 space-y-1" okMessage="Keputusan tersimpan.">
                      {hidden}
                      <select name="resolution" defaultValue={row.resolution ?? "APPLICABLE"} className={inputCls}>
                        <option value="GATE">G — Mandatory Gate Control</option>
                        <option value="APPLICABLE">A — Applicable</option>
                        <option value="NOT_REQUIRED">Not Required</option>
                      </select>
                      <textarea name="justification" defaultValue={row.justification ?? ""} placeholder="Justifikasi keputusan tim (wajib)" className={inputCls} rows={2} />
                      <button className="rounded bg-amber-600 px-2 py-1 text-xs text-white">Simpan keputusan</button>
                    </ActionForm>
                  ) : null}
                </div>
              ) : null}

              {canScore ? (
                <ActionForm action={saveScore} className="space-y-1" okMessage="Tersimpan.">
                  {hidden}
                  <div className="font-semibold">Detail penilaian</div>
                  <label className="block">Skor
                    <select name="score" defaultValue={scoreValue} className={inputCls}>
                      <option value="">–</option>
                      {[0, 1, 2, 3, 4].map((s) => <option key={s} value={s}>{s}</option>)}
                      <option value="NA">NA</option>
                    </select>
                  </label>
                  <label className="block">Notes / Justification<textarea name="notes" defaultValue={row.notes ?? ""} rows={2} className={inputCls} /></label>
                  <label className="block">Action<textarea name="action_plan" defaultValue={row.actionPlan ?? ""} rows={2} className={inputCls} /></label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">Responsible<input name="responsible_person" defaultValue={row.responsiblePerson ?? ""} className={inputCls} /></label>
                    <label className="block">Due Date<input type="date" name="due_date" defaultValue={row.dueDate ?? ""} className={inputCls} /></label>
                  </div>
                  <button className="rounded bg-indigo-600 px-2 py-1 text-xs text-white">Simpan detail</button>
                </ActionForm>
              ) : (
                <div className="text-xs text-slate-600">
                  <div>Notes: {row.notes ?? "—"}</div>
                  <div>Action: {row.actionPlan ?? "—"}</div>
                  <div>Responsible: {row.responsiblePerson ?? "—"} · Due: {row.dueDate ?? "—"}</div>
                </div>
              )}

              <div>
                <div className="font-semibold">Feedback MIND ID</div>
                {row.feedback.length === 0 ? <div className="text-xs text-slate-500">Belum ada.</div> : (
                  <ul className="space-y-1 text-xs">
                    {row.feedback.map((f) => (
                      <li key={f.id} className={f.blocking ? "text-rose-700" : ""}>
                        <b>{f.author}</b> · {new Date(f.at).toLocaleDateString("id-ID")}: {f.body}
                      </li>
                    ))}
                  </ul>
                )}
                {perm.feedback ? (
                  <ActionForm action={addFeedback} className="mt-1 space-y-1" okMessage="Feedback terkirim (tidak mengubah status gate).">
                    {hidden}
                    <textarea name="body" rows={2} placeholder="Feedback untuk deliverable ini" className={inputCls} />
                    <button className="rounded bg-slate-700 px-2 py-1 text-xs text-white">Kirim feedback</button>
                  </ActionForm>
                ) : null}
              </div>
            </div>
          </details>
        </td>
      </tr>
    </tbody>
  );
}
