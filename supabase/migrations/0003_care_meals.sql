-- ---------------------------------------------------------------------------
-- Migration 0003: Care Meals module
-- Tables: care_trains, care_slots, care_signups
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Care Trains
-- ---------------------------------------------------------------------------

create table care_trains (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid not null references churches(id) on delete cascade,
  campus_id   uuid references campuses(id) on delete set null,
  title       text not null,
  description text,
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now()
);
alter table care_trains enable row level security;

create index idx_care_trains_church on care_trains(church_id);

-- ---------------------------------------------------------------------------
-- 2. Care Slots
-- ---------------------------------------------------------------------------

create table care_slots (
  id         uuid primary key default gen_random_uuid(),
  church_id  uuid not null references churches(id) on delete cascade,
  train_id   uuid not null references care_trains(id) on delete cascade,
  slot_date  date not null,
  slot_label text not null,
  capacity   int not null default 1,
  notes      text,
  created_at timestamptz not null default now()
);
alter table care_slots enable row level security;

create index idx_care_slots_train on care_slots(train_id, slot_date);

-- ---------------------------------------------------------------------------
-- 3. Care Signups
-- ---------------------------------------------------------------------------

create table care_signups (
  id         uuid primary key default gen_random_uuid(),
  church_id  uuid not null references churches(id) on delete cascade,
  slot_id    uuid not null references care_slots(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);
alter table care_signups enable row level security;

create index idx_care_signups_slot on care_signups(slot_id);
create index idx_care_signups_user on care_signups(user_id);

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------

-- care_trains: members can view, leaders+ manage
create policy "members can view trains"
  on care_trains for select
  using (is_church_member(church_id));

create policy "leaders can insert trains"
  on care_trains for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update trains"
  on care_trains for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete trains"
  on care_trains for delete
  using (is_church_admin_or_leader(church_id));

-- care_slots: members can view, leaders+ manage
create policy "members can view slots"
  on care_slots for select
  using (is_church_member(church_id));

create policy "leaders can insert slots"
  on care_slots for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update slots"
  on care_slots for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete slots"
  on care_slots for delete
  using (is_church_admin_or_leader(church_id));

-- care_signups: members can view, members can claim/unclaim own
create policy "members can view signups"
  on care_signups for select
  using (is_church_member(church_id));

create policy "members can insert own signups"
  on care_signups for insert
  with check (is_church_member(church_id) and user_id = auth.uid());

create policy "members can delete own signups"
  on care_signups for delete
  using (user_id = auth.uid());

-- Leaders can also remove signups
create policy "leaders can delete signups"
  on care_signups for delete
  using (is_church_admin_or_leader(church_id));
