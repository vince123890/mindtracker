import { Card, DummyBadge, PageHeader, td, th } from "@/components/ui";
import { can } from "@/lib/auth/roles";
import { requirePermission } from "@/lib/auth/session";
import { getAssessment, RTO_STATUS_LABEL } from "@/lib/db/rto";
import { date, pct } from "@/lib/format";
import { toggleSubElement } from "../actions";
import { RtoResultForm, RtoStatusForm } from "../rto-controls";

function DualBar({ maturity, completion }: { maturity: number | null; completion: number | null }) {
  return (
    <div className="w-40 space-y-1">
      {[["Maturity", maturity, "bg-indigo-500"], ["Deliverables", completion, "bg-emerald-500"]].map(([label, v, color]) => (
        <div key={label as string} className="flex items-center gap-1 text-xs">
          <span className="w-16 text-slate-500">{label as string}</span>
          <div className="h-2 flex-1 rounded bg-slate-100">{v !== null ? <div className={`h-2 rounded ${color}`} style={{ width: `${(v as number) * 100}%` }} /> : null}</div>
          <span className="w-9 text-right">{pct(v as number | null)}</span>
        </div>
      ))}
    </div>
  );
}

export default async function RtoAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("rto.read");
  const { id } = await params;
  const { assessment, project, master, results, applicable, metrics } = await getAssessment(id, user);
  const canWrite = can(user.role, "rto.write") && assessment.status === "DRAFT";

  return (
    <div className="space-y-5">
      <PageHeader
        title={`RTO Assessment · ${project.code}`}
        subtitle={`${date(assessment.assessment_date)} · ${assessment.assessment_point} · dipimpin ${assessment.led_by} · Status: ${RTO_STATUS_LABEL[assessment.status]}`}
        actions={
          <>
            {can(user.role, "rto.write") && assessment.status === "DRAFT" ? <RtoStatusForm assessmentId={assessment.id} target="SUBMITTED" label="Serahkan" /> : null}
            {can(user.role, "rto.review") && assessment.status === "SUBMITTED" ? <RtoStatusForm assessmentId={assessment.id} target="REVIEWED" label="Tandai ditinjau" /> : null}
          </>
        }
      />

      <Card title="RTO Progress Summary — Maturity dan Deliverable Completion tidak digabung">
        <div className="mb-3 flex flex-wrap items-center gap-6">
          <div><div className="text-xs text-slate-500">Overall Operational Readiness (Maturity)</div><div className="text-3xl font-bold">{pct(metrics.overall.maturity)}</div></div>
          <div><div className="text-xs text-slate-500">Deliverable Completion</div><div className="text-3xl font-bold">{pct(metrics.overall.completion)}</div></div>
          <DummyBadge />
        </div>
        <table className="w-full">
          <thead><tr><th className={th}>Pilar</th><th className={th}>Progres</th><th className={th}>Terpenuhi / total</th></tr></thead>
          <tbody>
            {master.pillars.map((p) => {
              const m = metrics.pillars.get(p.id);
              return (
                <tr key={p.id}>
                  <td className={td}>{p.id}. {p.name}</td>
                  <td className={td}><DualBar maturity={m?.maturity ?? null} completion={m?.completion ?? null} /></td>
                  <td className={td}>{m ? `${m.delivered} / ${m.total}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">Sub-elemen pilar 1–2 terbaca dari RTO Tool v0.6; pilar 3–6 dan teks requirement adalah placeholder menunggu berkas RTO penuh (OI-02).</p>
      </Card>

      {master.pillars.map((p) => (
        <Card key={p.id} title={`${p.id}. ${p.name}`}>
          <div className="space-y-4">
            {master.subElements.filter((s) => s.pillar_id === p.id).map((s) => {
              const isApplicable = applicable.get(s.id) ?? true;
              const m = metrics.subElements.get(s.code);
              return (
                <div key={s.id} className={isApplicable ? "" : "opacity-50"}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{s.code} {s.name}{s.verified ? "" : " 🧪"}</div>
                    <div className="flex items-center gap-3">
                      <DualBar maturity={m?.maturity ?? null} completion={m?.completion ?? null} />
                      <span className="text-xs">{m ? `${m.delivered} dari ${m.total}` : "—"}</span>
                      {canWrite ? (
                        <form action={toggleSubElement}>
                          <input type="hidden" name="assessment_id" value={assessment.id} />
                          <input type="hidden" name="sub_element_id" value={s.id} />
                          <input type="hidden" name="applicable" value={isApplicable ? "false" : "true"} />
                          <button className="text-xs text-indigo-600 underline">{isApplicable ? "Tandai tidak berlaku" : "Tandai berlaku"}</button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                  {isApplicable ? (
                    <table className="w-full">
                      <tbody>
                        {master.requirements.filter((r) => r.sub_element_id === s.id).map((r) => {
                          const res = results.get(r.id);
                          return (
                            <tr key={r.id}>
                              <td className={`${td} w-20 font-mono text-xs`}>{r.code}</td>
                              <td className={td}>
                                <div>{r.deliverable_description}</div>
                                <details className="text-xs text-slate-500"><summary className="cursor-pointer">Panduan</summary>{r.guidance}</details>
                              </td>
                              <td className={`${td} w-[26rem]`}>
                                {canWrite ? (
                                  <RtoResultForm assessmentId={assessment.id} requirementId={r.id} score={res?.maturity_score ?? null} isNa={res?.is_na ?? false} delivered={res?.is_delivered ?? false} notes={res?.notes ?? null} />
                                ) : (
                                  <span className="text-sm">Maturity {res?.is_na ? "NA" : res?.maturity_score ?? "–"} · {res?.is_delivered ? "✓ terpenuhi" : "belum"}{res?.notes ? ` · ${res.notes}` : ""}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : <p className="text-xs text-slate-500">Sub-elemen tidak berlaku untuk proyek ini.</p>}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
