-- ---------------------------------------------------------------------------
-- Migration 0004: Kids Check-in module
-- Tables: kids, kids_sessions, kids_checkins, label_templates
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Kids
-- ---------------------------------------------------------------------------

create table kids (
  id               uuid primary key default gen_random_uuid(),
  church_id        uuid not null references churches(id) on delete cascade,
  campus_id        uuid references campuses(id) on delete set null,
  first_name       text not null,
  last_name        text not null,
  dob              date,
  allergies        text,
  guardian_user_id  uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);
alter table kids enable row level security;

create index idx_kids_church on kids(church_id);
create index idx_kids_guardian on kids(guardian_user_id);

-- ---------------------------------------------------------------------------
-- 2. Kids Sessions
-- ---------------------------------------------------------------------------

create table kids_sessions (
  id         uuid primary key default gen_random_uuid(),
  church_id  uuid not null references churches(id) on delete cascade,
  campus_id  uuid references campuses(id) on delete set null,
  name       text not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);
alter table kids_sessions enable row level security;

create index idx_kids_sessions_church on kids_sessions(church_id);

-- ---------------------------------------------------------------------------
-- 3. Kids Checkins
-- ---------------------------------------------------------------------------

create table kids_checkins (
  id             uuid primary key default gen_random_uuid(),
  church_id      uuid not null references churches(id) on delete cascade,
  session_id     uuid not null references kids_sessions(id) on delete cascade,
  kid_id         uuid not null references kids(id) on delete cascade,
  checked_in_at  timestamptz not null default now(),
  checked_out_at timestamptz,
  pickup_code    text not null,
  created_at     timestamptz not null default now()
);
alter table kids_checkins enable row level security;

create index idx_kids_checkins_session on kids_checkins(session_id);
create index idx_kids_checkins_kid on kids_checkins(kid_id);

-- ---------------------------------------------------------------------------
-- 4. Label Templates
-- ---------------------------------------------------------------------------

create table label_templates (
  id        uuid primary key default gen_random_uuid(),
  church_id uuid not null references churches(id) on delete cascade,
  key       text not null,
  name      text not null,
  width_mm  int not null,
  height_mm int not null,
  layout    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table label_templates enable row level security;

create index idx_label_templates_church on label_templates(church_id);

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------

-- kids: leaders+ manage, members can view
create policy "members can view kids"
  on kids for select
  using (is_church_member(church_id));

create policy "leaders can insert kids"
  on kids for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update kids"
  on kids for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete kids"
  on kids for delete
  using (is_church_admin_or_leader(church_id));

-- kids_sessions
create policy "members can view sessions"
  on kids_sessions for select
  using (is_church_member(church_id));

create policy "leaders can insert sessions"
  on kids_sessions for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update sessions"
  on kids_sessions for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete sessions"
  on kids_sessions for delete
  using (is_church_admin_or_leader(church_id));

-- kids_checkins
create policy "members can view checkins"
  on kids_checkins for select
  using (is_church_member(church_id));

create policy "leaders can insert checkins"
  on kids_checkins for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update checkins"
  on kids_checkins for update
  using (is_church_admin_or_leader(church_id));

-- label_templates
create policy "leaders can view templates"
  on label_templates for select
  using (is_church_admin_or_leader(church_id));

create policy "leaders can insert templates"
  on label_templates for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update templates"
  on label_templates for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete templates"
  on label_templates for delete
  using (is_church_admin_or_leader(church_id));
