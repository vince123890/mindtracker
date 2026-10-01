-- MIND Tracker prototype — initial schema
-- Mengikuti TECHNICAL-LOGIC-MIND-Tracker.md v1.1 §2 & §16 dan docs/SPEK-RUMUS-Tracker-v1.4.md.
-- Prototype: tanpa Supabase Auth. Seluruh akses melalui server Next.js memakai service role;
-- RLS diaktifkan TANPA policy sehingga anon key tidak dapat membaca/menulis apa pun.

-- ============================================================ master
create table organization (
  id   text primary key,
  name text not null,
  kind text not null check (kind in ('HOLDING', 'MEMBER'))
);

create table app_user (
  id              text primary key,
  name            text not null,
  role            text not null check (role in ('PMO_ADMIN','DIREKTUR_MIND_ID','DIVISI_MIND_ID','DIVISI_DO_MIND_ID',
                                               'DIREKTUR_AH','PMO_AH','TIM_PROYEK','PIC_OPERASI_AH')),
  organization_id text not null references organization(id)
);

-- Kode peka huruf besar/kecil (AM-1): text default collation, perbandingan '=' saja.
create table project_type (
  code            text primary key check (code in ('NFP','NMF','MPM','m-PM','NSI')),
  name            text not null,
  modifier_header text not null,
  criteria        text,
  sort_order      smallint not null
);

create table phase (
  code      text primary key,
  name      text not null,
  seq       smallint not null unique,
  is_active boolean not null default true
);

create table dimension (
  id         smallint primary key,
  name       text not null,
  sort_order smallint not null
);

create table chapter_function (
  chapter_no   smallint primary key,
  code_prefix  text not null,
  name         text not null,
  dimension_id smallint references dimension(id)          -- null = belum dipetakan (OI-09)
);

create table deliverable (
  id                 bigserial primary key,
  phase_code         text not null references phase(code),
  chapter_no         smallint not null references chapter_function(chapter_no),
  code               text not null,
  name               text not null,
  reference_document text,
  base_weight        numeric(6,2) not null check (base_weight > 0),
  sort_order         int not null,
  is_active          boolean not null default true,
  unique (phase_code, chapter_no, code)                     -- F-07: kode tidak unik lintas chapter
);

create table deliverable_applicability (
  deliverable_id    bigint not null references deliverable(id),
  project_type_code text not null references project_type(code),
  marker            text not null check (marker in ('G','A','C','N')),   -- N = Not Required (kosong)
  modifier          numeric(6,4) not null check (modifier >= 0 and modifier <= 2),
  primary key (deliverable_id, project_type_code),
  check (marker <> 'N' or modifier = 0)                     -- F-06
);

create table scoring_config (
  version                    int primary key,
  start_threshold            smallint not null default 1,
  pass_threshold             smallint not null default 3,
  max_score                  smallint not null default 4,
  gate_min_maturity_pct      numeric(7,4) default 0.60,
  gate_control_must_complete boolean not null default true,
  na_treatment               text not null default 'EXCLUDE' check (na_treatment in ('EXCLUDE','EXCEL_PARITY')),
  created_by                 text not null references app_user(id),
  created_at                 timestamptz not null default now(),
  check (start_threshold between 0 and pass_threshold),
  check (pass_threshold between 0 and max_score)
);

-- ============================================================ tracker
create table project (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  name              text not null,
  organization_id   text not null references organization(id),
  location          text not null,
  project_type_1    text not null references project_type(code),
  project_type_2    text references project_type(code),
  entry_phase       text not null references phase(code),
  current_phase     text not null references phase(code),
  project_manager   text,
  executive_sponsor text,
  key_dependencies  text,
  depended_by       text,
  description       text,
  is_active         boolean not null default true,
  created_by        text not null references app_user(id),
  created_at        timestamptz not null default now(),
  check (project_type_2 is null or project_type_2 <> project_type_1)
);

create table project_phase_instance (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references project(id),
  phase_code      text not null references phase(code),
  gate_status     text not null default 'DRAFT'
                  check (gate_status in ('DRAFT','WAITING_APPROVAL','APPROVED','REVISION_REQUIRED')),
  submitted_by    text references app_user(id),
  submitted_at    timestamptz,
  decided_by      text references app_user(id),
  decided_at      timestamptz,
  summary_comment text,
  created_at      timestamptz not null default now(),
  unique (project_id, phase_code)
);

create table deliverable_score (
  id                        uuid primary key default gen_random_uuid(),
  phase_instance_id         uuid not null references project_phase_instance(id),
  deliverable_id            bigint not null references deliverable(id),
  score                     smallint check (score between 0 and 4),
  is_na                     boolean not null default false,
  conditional_resolution    text check (conditional_resolution in ('GATE','APPLICABLE','NOT_REQUIRED')),
  conditional_justification text,
  conditional_decided_by    text references app_user(id),
  conditional_decided_at    timestamptz,
  notes                     text,
  action_plan               text,
  responsible_person        text,
  due_date                  date,
  updated_by                text references app_user(id),
  updated_at                timestamptz not null default now(),
  unique (phase_instance_id, deliverable_id),
  check (not (is_na and score is not null)),
  check (conditional_resolution is null or length(trim(coalesce(conditional_justification, ''))) > 0)
);

create table phase_gate_transition (
  id                bigserial primary key,
  phase_instance_id uuid not null references project_phase_instance(id),
  from_status       text not null,
  to_status         text not null,
  actor_id          text not null references app_user(id),
  note              text,
  indices           jsonb,
  created_at        timestamptz not null default now(),
  check (to_status <> 'REVISION_REQUIRED' or length(trim(coalesce(note, ''))) > 0)
);

create table revision_log_entry (
  id                bigserial primary key,
  phase_instance_id uuid not null references project_phase_instance(id),
  deliverable_id    bigint references deliverable(id),
  author_id         text not null references app_user(id),
  body              text not null,
  is_blocking       boolean not null default false,
  created_at        timestamptz not null default now()
);

create table score_snapshot (
  id                bigserial primary key,
  phase_instance_id uuid not null references project_phase_instance(id),
  label             text not null,
  indices           jsonb not null,
  dimension_results jsonb,
  scores            jsonb,
  config_version    int not null,
  created_at        timestamptz not null default now(),
  unique (phase_instance_id, label)
);

create table audit_log_entry (
  id          bigserial primary key,
  actor_id    text not null,
  actor_role  text not null,
  entity_type text not null,
  entity_id   text not null,
  action      text not null,
  changes     jsonb,
  reason      text,
  created_at  timestamptz not null default now()
);
create index ix_audit_entity on audit_log_entry (entity_type, entity_id, created_at desc);

-- ============================================================ Dashboard DO (pekerjaan tambahan)
create table do_production (            -- DUMMY pengganti integrasi MCT (I-4)
  id              bigserial primary key,
  organization_id text not null references organization(id),
  plant           text not null,
  product         text not null,
  unit            text not null,
  period          date not null,
  target          numeric(18,2) not null,
  actual          numeric(18,2) not null,
  unique (organization_id, plant, product, period)
);

create table rca (
  id                  uuid primary key default gen_random_uuid(),
  number              text not null unique,
  organization_id     text not null references organization(id),
  plant               text not null,
  product             text not null,
  unit                text not null,
  period              date not null,
  gap                 numeric(18,2),
  category            text not null,
  problem             text not null,
  root_cause_category text not null check (root_cause_category in ('Man','Machine','Method','Material','Measurement','Environment')),
  root_cause          text not null,
  analysis            text,
  status              text not null default 'DRAFT'
                      check (status in ('DRAFT','MENUNGGU_REVIEW','DISETUJUI','PERLU_PERBAIKAN')),
  created_by          text not null references app_user(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create table rca_review_log (
  id          bigserial primary key,
  rca_id      uuid not null references rca(id),
  from_status text not null,
  to_status   text not null,
  actor_id    text not null references app_user(id),
  note        text,
  created_at  timestamptz not null default now(),
  check (to_status <> 'PERLU_PERBAIKAN' or length(trim(coalesce(note, ''))) > 0)
);

create table action_plan (
  id          uuid primary key default gen_random_uuid(),
  rca_id      uuid not null references rca(id),
  action      text not null,
  pic         text not null,
  target_date date not null,
  progress    smallint not null default 0 check (progress between 0 and 100),
  status      text not null default 'OPEN'
              check (status in ('OPEN','IN_PROGRESS','DONE_PENDING_VERIFY','VERIFIED')),
  created_by  text not null references app_user(id),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table action_plan_progress (
  id             bigserial primary key,
  action_plan_id uuid not null references action_plan(id),
  progress       smallint not null check (progress between 0 and 100),
  note           text,
  actor_id       text not null references app_user(id),
  created_at     timestamptz not null default now()
);

create table strategy_scenario (        -- DUMMY pengganti output aplikasi simulasi eksternal (I-5)
  code        text primary key,
  name        text not null,
  description text,
  source      text not null,
  variables   jsonb not null,
  projections jsonb not null
);

-- ============================================================ append-only (AM-10, §7.1)
create or replace function forbid_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'Tabel % bersifat append-only', tg_table_name;
end $$;

create trigger trg_audit_append_only      before update or delete on audit_log_entry       for each row execute function forbid_mutation();
create trigger trg_snapshot_append_only   before update or delete on score_snapshot        for each row execute function forbid_mutation();
create trigger trg_gate_tr_append_only    before update or delete on phase_gate_transition for each row execute function forbid_mutation();
create trigger trg_revlog_append_only     before update or delete on revision_log_entry    for each row execute function forbid_mutation();
create trigger trg_rca_review_append_only before update or delete on rca_review_log        for each row execute function forbid_mutation();

-- ============================================================ RLS: tertutup bagi anon/authenticated
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
