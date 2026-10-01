import "server-only";
import { notFound } from "next/navigation";
import { assertOrgAccess, isMindId } from "@/lib/auth/session";
import type { DummyUser } from "@/lib/auth/users";
import { calculatePhase } from "@/lib/scoring/engine";
import { evaluateGate, type BlockingReason } from "@/lib/scoring/gate";
import type {
  ConditionalResolution,
  Marker,
  PhaseResult,
  ScoreInput,
  ScoringConfig,
} from "@/lib/scoring/types";
import { db, must } from "./client";

export type GateStatus = "DRAFT" | "WAITING_APPROVAL" | "APPROVED" | "REVISION_REQUIRED";

export interface Project {
  id: string;
  code: string;
  name: string;
  organization_id: string;
  location: string;
  project_type_1: string;
  project_type_2: string | null;
  entry_phase: string;
  current_phase: string;
  project_manager: string | null;
  executive_sponsor: string | null;
  key_dependencies: string | null;
  depended_by: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PhaseInstance {
  id: string;
  project_id: string;
  phase_code: string;
  gate_status: GateStatus;
  submitted_by: string | null;
  submitted_at: string | null;
  decided_by: string | null;
  decided_at: string | null;
  summary_comment: string | null;
}

export interface ScoreRowMeta {
  scoreId: string | null;
  deliverableId: number;
  code: string;
  name: string;
  referenceDocument: string | null;
  chapterNo: number;
  chapterName: string;
  dimensionId: number | null;
  baseWeight: number;
  marker1: Marker;
  marker2: Marker | null;
  score: number | null;
  isNa: boolean;
  resolution: ConditionalResolution | null;
  justification: string | null;
  notes: string | null;
  actionPlan: string | null;
  responsiblePerson: string | null;
  dueDate: string | null;
  updatedAt: string | null;
}

export interface Chapter {
  chapter_no: number;
  code_prefix: string;
  name: string;
  dimension_id: number | null;
}

export interface Dimension {
  id: number;
  name: string;
  sort_order: number;
}

// ------------------------------------------------------------------ master
export async function getConfig(): Promise<ScoringConfig> {
  const row = must(
    await db().from("scoring_config").select("*").order("version", { ascending: false }).limit(1).single(),
    "scoring_config",
  ) as Record<string, unknown>;
  return {
    version: row.version as number,
    startThreshold: row.start_threshold as number,
    passThreshold: row.pass_threshold as number,
    maxScore: row.max_score as number,
    gateMinMaturityPct: row.gate_min_maturity_pct === null ? null : Number(row.gate_min_maturity_pct),
    gateControlMustComplete: row.gate_control_must_complete as boolean,
    naTreatment: row.na_treatment as ScoringConfig["naTreatment"],
  };
}

export async function getChapters(): Promise<Chapter[]> {
  return must(await db().from("chapter_function").select("*").order("chapter_no"), "chapter_function");
}

export async function getDimensions(): Promise<Dimension[]> {
  return must(await db().from("dimension").select("*").order("sort_order"), "dimension");
}

export async function getProjectTypes(): Promise<{ code: string; name: string; criteria: string | null; modifier_header: string }[]> {
  return must(await db().from("project_type").select("*").order("sort_order"), "project_type");
}

export async function getPhases(activeOnly = true): Promise<{ code: string; name: string; seq: number; is_active: boolean }[]> {
  let q = db().from("phase").select("*").order("seq");
  if (activeOnly) q = q.eq("is_active", true);
  return must(await q, "phase");
}

export async function getOrganizations(): Promise<{ id: string; name: string; kind: string }[]> {
  return must(await db().from("organization").select("*").order("id"), "organization");
}

// ------------------------------------------------------------------ project
export async function listProjects(user: DummyUser): Promise<Project[]> {
  let q = db().from("project").select("*").eq("is_active", true).order("code");
  if (!isMindId(user)) q = q.eq("organization_id", user.organizationId);
  return must(await q, "project");
}

export async function getProject(id: string, user: DummyUser): Promise<Project> {
  const res = await db().from("project").select("*").eq("id", id).maybeSingle();
  const project = must(res, "project") as Project | null;
  if (!project) notFound();
  assertOrgAccess(user, project.organization_id);
  return project;
}

export async function getPhaseInstances(projectId: string): Promise<PhaseInstance[]> {
  const rows = must(
    await db().from("project_phase_instance").select("*, phase:phase_code(seq)").eq("project_id", projectId),
    "project_phase_instance",
  ) as (PhaseInstance & { phase: { seq: number } })[];
  return rows.sort((a, b) => a.phase.seq - b.phase.seq);
}

export async function getPhaseInstance(projectId: string, phase: string): Promise<PhaseInstance> {
  const row = must(
    await db().from("project_phase_instance").select("*").eq("project_id", projectId).eq("phase_code", phase).maybeSingle(),
    "project_phase_instance",
  ) as PhaseInstance | null;
  if (!row) notFound();
  return row;
}

// ------------------------------------------------------------------ scorecard
interface DeliverableRow {
  id: number;
  code: string;
  name: string;
  reference_document: string | null;
  chapter_no: number;
  base_weight: number;
  sort_order: number;
  deliverable_applicability: { project_type_code: string; marker: Marker; modifier: number }[];
}

export async function loadDeliverables(phase: string): Promise<DeliverableRow[]> {
  return must(
    await db()
      .from("deliverable")
      .select("id, code, name, reference_document, chapter_no, base_weight, sort_order, deliverable_applicability(project_type_code, marker, modifier)")
      .eq("phase_code", phase)
      .eq("is_active", true)
      .order("sort_order"),
    "deliverable",
  );
}

export interface Scorecard {
  project: Project;
  instance: PhaseInstance;
  config: ScoringConfig;
  meta: ScoreRowMeta[];
  inputs: ScoreInput[];
  result: PhaseResult;
  blocking: BlockingReason[];
  chapters: Chapter[];
  dimensions: Dimension[];
}

/** Satu-satunya jalur kalkulasi (AM-8): dipakai scorecard, dashboard, guard gate, snapshot. */
export async function buildScorecard(project: Project, instance: PhaseInstance, config?: ScoringConfig): Promise<Scorecard> {
  const [cfg, deliverables, scores, chapters, dimensions] = await Promise.all([
    config ? Promise.resolve(config) : getConfig(),
    loadDeliverables(instance.phase_code),
    db().from("deliverable_score").select("*").eq("phase_instance_id", instance.id),
    getChapters(),
    getDimensions(),
  ]);
  const scoreRows = must(scores, "deliverable_score") as Record<string, unknown>[];
  const byDeliverable = new Map(scoreRows.map((s) => [Number(s.deliverable_id), s]));
  const chapterMap = new Map(chapters.map((c) => [c.chapter_no, c]));

  const meta: ScoreRowMeta[] = [];
  const inputs: ScoreInput[] = [];
  for (const d of deliverables) {
    const a1 = d.deliverable_applicability.find((a) => a.project_type_code === project.project_type_1)!;
    const a2 = project.project_type_2
      ? d.deliverable_applicability.find((a) => a.project_type_code === project.project_type_2)!
      : null;
    const s = byDeliverable.get(d.id);
    const ch = chapterMap.get(d.chapter_no)!;
    const row: ScoreRowMeta = {
      scoreId: (s?.id as string) ?? null,
      deliverableId: d.id,
      code: d.code,
      name: d.name,
      referenceDocument: d.reference_document,
      chapterNo: d.chapter_no,
      chapterName: ch.name,
      dimensionId: ch.dimension_id,
      baseWeight: Number(d.base_weight),
      marker1: a1.marker,
      marker2: a2?.marker ?? null,
      score: (s?.score as number | null) ?? null,
      isNa: Boolean(s?.is_na),
      resolution: (s?.conditional_resolution as ConditionalResolution | null) ?? null,
      justification: (s?.conditional_justification as string | null) ?? null,
      notes: (s?.notes as string | null) ?? null,
      actionPlan: (s?.action_plan as string | null) ?? null,
      responsiblePerson: (s?.responsible_person as string | null) ?? null,
      dueDate: (s?.due_date as string | null) ?? null,
      updatedAt: (s?.updated_at as string | null) ?? null,
    };
    meta.push(row);
    inputs.push({
      deliverableId: d.id,
      chapterNo: d.chapter_no,
      dimensionId: ch.dimension_id,
      code: d.code,
      baseWeight: Number(d.base_weight),
      type1: { marker: a1.marker, modifier: Number(a1.modifier) },
      type2: a2 ? { marker: a2.marker, modifier: Number(a2.modifier) } : null,
      score: row.score,
      isNa: row.isNa,
      resolution: row.resolution,
    });
  }
  const result = calculatePhase(inputs, cfg);
  return {
    project,
    instance,
    config: cfg,
    meta,
    inputs,
    result,
    blocking: evaluateGate(inputs, result, cfg),
    chapters,
    dimensions,
  };
}

export interface PhaseSummary {
  instance: PhaseInstance;
  scorecard: Scorecard;
}

export async function projectPhaseSummaries(project: Project, config?: ScoringConfig): Promise<PhaseSummary[]> {
  const cfg = config ?? (await getConfig());
  const instances = await getPhaseInstances(project.id);
  return Promise.all(instances.map(async (instance) => ({ instance, scorecard: await buildScorecard(project, instance, cfg) })));
}

/** Ringkasan fase berjalan tiap proyek untuk dashboard & daftar proyek. */
export async function currentPhaseOverview(projects: Project[]): Promise<Map<string, Scorecard>> {
  const cfg = await getConfig();
  const entries = await Promise.all(
    projects.map(async (p) => {
      const inst = await getPhaseInstance(p.id, p.current_phase);
      return [p.id, await buildScorecard(p, inst, cfg)] as const;
    }),
  );
  return new Map(entries);
}

export async function listRevisionLog(instanceId: string) {
  return must(
    await db()
      .from("revision_log_entry")
      .select("id, deliverable_id, author_id, body, is_blocking, created_at, author:author_id(name, role)")
      .eq("phase_instance_id", instanceId)
      .order("created_at", { ascending: false }),
    "revision_log_entry",
  ) as unknown as {
    id: number;
    deliverable_id: number | null;
    author_id: string;
    body: string;
    is_blocking: boolean;
    created_at: string;
    author: { name: string; role: string } | null;
  }[];
}

export async function listTransitions(instanceIds: string[]) {
  if (instanceIds.length === 0) return [];
  return must(
    await db()
      .from("phase_gate_transition")
      .select("id, phase_instance_id, from_status, to_status, note, indices, created_at, actor:actor_id(name)")
      .in("phase_instance_id", instanceIds)
      .order("created_at", { ascending: false }),
    "phase_gate_transition",
  ) as unknown as {
    id: number;
    phase_instance_id: string;
    from_status: string;
    to_status: string;
    note: string | null;
    indices: Record<string, number | null> | null;
    created_at: string;
    actor: { name: string } | null;
  }[];
}
