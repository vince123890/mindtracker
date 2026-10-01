"use client";

import { ActionForm } from "@/components/action-form";
import { saveRca } from "../actions";

export interface RcaFormValues {
  id?: string;
  organization_id?: string;
  plant?: string;
  product?: string;
  unit?: string;
  period?: string;
  gap?: string;
  category?: string;
  problem?: string;
  root_cause_category?: string;
  root_cause?: string;
  analysis?: string;
}

const cls = "w-full rounded border border-slate-300 px-2 py-1.5 text-sm";

export function RcaForm({
  values,
  orgs,
  orgLocked,
  categories,
  rootCauses,
}: {
  values: RcaFormValues;
  orgs: { id: string; name: string }[];
  orgLocked: boolean;
  categories: string[];
  rootCauses: string[];
}) {
  const f = (label: string, el: React.ReactNode) => (
    <label className="block text-sm"><span className="mb-1 block font-medium text-slate-700">{label}</span>{el}</label>
  );
  return (
    <ActionForm action={saveRca} className="grid gap-3 md:grid-cols-2" okMessage="RCA tersimpan.">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      {f("Anggota Holding *", orgLocked ? (
        <input className={`${cls} bg-slate-100`} value={orgs.find((o) => o.id === values.organization_id)?.name ?? values.organization_id} readOnly />
      ) : (
        <select name="organization_id" defaultValue={values.organization_id} className={cls}>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      ))}
      {f("Periode *", <input type="month" name="period" defaultValue={values.period} className={cls} />)}
      {f("Plant *", <input name="plant" defaultValue={values.plant} className={cls} />)}
      {f("Produk *", <input name="product" defaultValue={values.product} className={cls} />)}
      {f("Satuan *", <input name="unit" defaultValue={values.unit} className={cls} />)}
      {f("Gap (realisasi − target)", <input name="gap" defaultValue={values.gap} className={cls} inputMode="decimal" />)}
      {f("Kategori penyebab * (⚠️ asumsi — bahan workshop)", (
        <select name="category" defaultValue={values.category} className={cls}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
      ))}
      {f("Kategori akar masalah (6M) *", (
        <select name="root_cause_category" defaultValue={values.root_cause_category} className={cls}>{rootCauses.map((c) => <option key={c}>{c}</option>)}</select>
      ))}
      <div className="md:col-span-2">{f("Uraian masalah *", <textarea name="problem" defaultValue={values.problem} rows={2} className={cls} />)}</div>
      <div className="md:col-span-2">{f("Akar masalah *", <textarea name="root_cause" defaultValue={values.root_cause} rows={2} className={cls} />)}</div>
      <div className="md:col-span-2">{f("Analisis", <textarea name="analysis" defaultValue={values.analysis} rows={3} className={cls} />)}</div>
      <div className="md:col-span-2"><button className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white">Simpan RCA</button></div>
    </ActionForm>
  );
}
