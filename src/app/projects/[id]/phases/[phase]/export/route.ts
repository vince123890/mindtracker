import { can } from "@/lib/auth/roles";
import { currentUser } from "@/lib/auth/session";
import { buildScorecard, getPhaseInstance, getProject } from "@/lib/db/tracker";

/** Export Scorecard — nilai hasil hitung server, tanpa formula (FSD-5 §2.3). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string; phase: string }> }) {
  const user = await currentUser();
  if (!can(user.role, "project.read")) return new Response("Forbidden", { status: 403 });
  const { id, phase } = await params;
  const project = await getProject(id, user);
  const inst = await getPhaseInstance(project.id, decodeURIComponent(phase));
  const sc = await buildScorecard(project, inst);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = [
    "Chapter", "No.", "Deliverables", "Reference Document",
    `Requirement ${project.project_type_1}`, `Requirement ${project.project_type_2 ?? "-"}`, "Overall Requirement", "Accepted Requirement",
    "Base Weight", "Effective Weight", "Score", "Starting Status", "Completion Status", "Weighted Score",
    "Notes/Justifications", "Action", "Responsible Person", "Due Date",
  ];
  const lines = sc.meta.map((m, i) => {
    const r = sc.result.rows[i];
    return [
      m.chapterName, m.code, m.name, m.referenceDocument, m.marker1, m.marker2 ?? "", r.overall,
      r.accepted === "N" ? "Not Required" : r.accepted, m.baseWeight, r.effectiveWeight.toFixed(4),
      m.isNa ? "NA" : m.score, r.starting, r.completion, r.weightedScore === "NA" ? "NA" : r.weightedScore.toFixed(4),
      m.notes, m.actionPlan, m.responsiblePerson, m.dueDate,
    ].map(esc).join(",");
  });
  const i = sc.result.indices;
  const summary = [
    "",
    `Index 1 (FDMI),${i.index1 ?? ""}`,
    `Index 2 (FGDI),${i.index2 ?? ""}`,
    `Index 3 (FDCI),${i.index3 ?? ""}`,
    `Index 4 (requirements still to be defined),${i.index4}`,
  ];
  const body = "﻿" + [header.map(esc).join(","), ...lines, ...summary].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${project.code}_${inst.phase_code}_scorecard.csv"`,
    },
  });
}
