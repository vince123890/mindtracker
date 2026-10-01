-- MIND Tracker prototype — Engine 2 (RTO Tool), sumber dummy pengganti integrasi, workflow config.
-- Menu mengikuti Analysis/[Timeline & Effort] MindID - Mind Tracker.xlsx.

-- ============================================================ Engine 2 — RTO Tool (FR-3, TL §2.2)
create table rto_pillar (
  id          smallint primary key,
  name        text not null,
  description text
);

create table rto_sub_element (
  id        serial primary key,
  pillar_id smallint not null references rto_pillar(id),
  code      text not null unique,          -- 1.1, 2.4
  name      text not null,
  verified  boolean not null default false -- true = terbaca dari RTO Tool v0.6; false = placeholder OI-02
);

create table rto_requirement (
  id                      serial primary key,
  sub_element_id          int not null references rto_sub_element(id),
  code                    text not null unique,
  deliverable_description text not null,
  guidance                text,
  weight                  numeric(6,4) not null default 1 check (weight > 0)
);

-- "Applicable Sub-Element per Proyek" (FR-3.3)
create table rto_project_sub_element (
  project_id     uuid not null references project(id),
  sub_element_id int not null references rto_sub_element(id),
  applicable     boolean not null default true,
  primary key (project_id, sub_element_id)
);

create table rto_assessment (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references project(id),
  assessment_date  date not null,
  assessment_point text not null,
  led_by           text not null,
  status           text not null default 'DRAFT' check (status in ('DRAFT','SUBMITTED','REVIEWED')),
  created_by       text not null references app_user(id),
  created_at       timestamptz not null default now()
);

create table rto_result (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references rto_assessment(id),
  requirement_id int not null references rto_requirement(id),
  maturity_score smallint check (maturity_score between 0 and 4),   -- sumbu Maturity
  is_delivered   boolean not null default false,                    -- sumbu Deliverable Completion
  is_na          boolean not null default false,
  notes          text,
  updated_by     text references app_user(id),
  updated_at     timestamptz not null default now(),
  unique (assessment_id, requirement_id),
  check (not (is_na and maturity_score is not null))
);

-- ============================================================ DUMMY pengganti integrasi (dikerjakan saat development)
create table ext_project_progress (       -- I-1 MIND Project (FEL-3 s.d. EPC)
  project_code     text primary key,
  stage            text not null,
  physical_progress numeric(5,2) not null,
  schedule_status  text not null check (schedule_status in ('ON_TRACK','AT_RISK','DELAYED')),
  target_cod       date
);

create table ext_project_risk (           -- I-2 PRISMA
  project_code       text primary key,
  risk_rating        text not null check (risk_rating in ('LOW','MEDIUM','HIGH','EXTREME')),
  open_risks         int not null,
  mitigation_on_track numeric(5,2) not null,
  top_risk           text
);

create table ext_project_document (       -- I-3 MIND Gate
  project_code       text primary key,
  rkap_status        text not null,
  fs_completeness    numeric(5,2) not null,
  fid_status         text not null
);

create table do_key_parameter (           -- I-4 MCT — parameter operasi
  id              bigserial primary key,
  organization_id text not null references organization(id),
  plant           text not null,
  parameter       text not null,
  unit            text not null,
  period          date not null,
  target          numeric(18,4) not null,
  actual          numeric(18,4) not null,
  higher_is_better boolean not null default true
);

create table do_maintenance (             -- I-4 MCT / CMMS (OI-18)
  id              bigserial primary key,
  organization_id text not null references organization(id),
  plant           text not null,
  equipment       text not null,
  period          date not null,
  availability    numeric(5,2) not null,
  mttr_hours      numeric(8,2) not null,
  mtbf_hours      numeric(10,2) not null,
  open_work_orders int not null
);

-- ============================================================ Workflow config (FR-7.5, read-only di prototype)
create table gate_workflow_step (
  step_order    smallint primary key,
  name          text not null,
  actor_role    text not null,
  sla_days      smallint not null,
  description   text not null
);

create trigger trg_rto_result_audit_ok before delete on rto_result for each row execute function forbid_mutation();

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
