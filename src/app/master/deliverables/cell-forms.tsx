"use client";

import { ActionForm } from "@/components/action-form";
import { updateApplicability, updateBaseWeight } from "../actions";

const TONE: Record<string, string> = { G: "bg-indigo-600 text-white", A: "bg-sky-100 text-sky-800", C: "bg-amber-100 text-amber-800", N: "text-slate-300" };

export function ApplicabilityCell({
  deliverableId,
  type,
  marker,
  modifier,
  editable,
}: {
  deliverableId: number;
  type: string;
  marker: string;
  modifier: number;
  editable: boolean;
}) {
  const view = (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${TONE[marker]}`}>
      {marker === "N" ? "–" : `${marker} ${modifier.toFixed(2)}`}
    </span>
  );
  if (!editable) return view;
  return (
    <details>
      <summary className="cursor-pointer list-none">{view}</summary>
      <ActionForm action={updateApplicability} className="mt-1 flex w-44 flex-col gap-1 rounded border border-slate-200 bg-white p-2 shadow">
        <input type="hidden" name="deliverable_id" value={deliverableId} />
        <input type="hidden" name="project_type_code" value={type} />
        <select name="marker" defaultValue={marker} className="rounded border border-slate-300 px-1 py-0.5 text-xs">
          <option value="G">G — Gate Control</option>
          <option value="A">A — Applicable</option>
          <option value="C">C — Conditional</option>
          <option value="N">(kosong) — Not Required</option>
        </select>
        <input name="modifier" defaultValue={modifier} className="rounded border border-slate-300 px-1 py-0.5 text-xs" aria-label="Modifier" />
        <button className="rounded bg-indigo-600 px-2 py-0.5 text-xs text-white">Simpan</button>
      </ActionForm>
    </details>
  );
}

export function BaseWeightCell({ deliverableId, value, editable }: { deliverableId: number; value: number; editable: boolean }) {
  if (!editable) return <span>{value.toFixed(2)}</span>;
  return (
    <ActionForm action={updateBaseWeight} className="flex gap-1">
      <input type="hidden" name="deliverable_id" value={deliverableId} />
      <input name="base_weight" defaultValue={value} className="w-14 rounded border border-slate-300 px-1 py-0.5 text-xs" aria-label="Base weight" />
      <button className="text-xs text-indigo-600">✓</button>
    </ActionForm>
  );
}
