-- =============================================================================
-- 0001_core.sql — Together Church core schema
-- Multi-tenant church platform: orgs, membership, plans, features, people,
-- events, forms, messaging, notifications, audit.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Custom enum types
-- ---------------------------------------------------------------------------
create type campus_mode    as enum ('off', 'optional', 'required');
create type church_role    as enum ('admin', 'leader', 'member');
create type member_status  as enum ('active', 'invited', 'disabled');
create type sub_status     as enum ('active', 'trial', 'past_due', 'canceled');
create type person_status  as enum ('active', 'inactive', 'archived');
create type rsvp_status    as enum ('yes', 'no', 'maybe');
create type msg_channel    as enum ('sms', 'email');
create type audience_type  as enum ('all', 'tag', 'group', 'event');
create type msg_status     as enum ('queued', 'sent', 'failed');
create type device_platform as enum ('ios', 'android', 'web');

-- ---------------------------------------------------------------------------
-- 2. Helper functions (used by RLS policies)
-- ---------------------------------------------------------------------------

create or replace function is_church_member(_church_id uuid)
returns bool
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.church_users
    where church_id = _church_id
      and user_id  = auth.uid()
      and status   = 'active'
  );
$$;

create or replace function user_role_in_church(_church_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role::text
  from public.church_users
  where church_id = _church_id
    and user_id  = auth.uid()
    and status   = 'active'
  limit 1;
$$;

-- Convenience: is admin or leader
create or replace function is_church_admin_or_leader(_church_id uuid)
returns bool
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.church_users
    where church_id = _church_id
      and user_id  = auth.uid()
      and status   = 'active'
      and role in ('admin', 'leader')
  );
$$;

create or replace function is_church_admin(_church_id uuid)
returns bool
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.church_users
    where church_id = _church_id
      and user_id  = auth.uid()
      and status   = 'active'
      and role     = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Core org tables
-- ---------------------------------------------------------------------------

create table churches (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);
alter table churches enable row level security;

create table campuses (
  id         uuid primary key default gen_random_uuid(),
  church_id  uuid not null references churches(id) on delete cascade,
  name       text not null,
  is_default bool not null default false,
  created_at timestamptz not null default now()
);
alter table campuses enable row level security;

create table church_settings (
  church_id   uuid primary key references churches(id) on delete cascade,
  campus_mode campus_mode not null default 'off',
  giving_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table church_settings enable row level security;

-- ---------------------------------------------------------------------------
-- 4. Membership / roles
-- ---------------------------------------------------------------------------

create table church_users (
  id         uuid primary key default gen_random_uuid(),
  church_id  uuid not null references churches(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       church_role not null default 'member',
  status     member_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (church_id, user_id)
);
alter table church_users enable row level security;

create table profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone        text,
  email        text,
  sms_opt_out  bool not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table profiles enable row level security;

-- ---------------------------------------------------------------------------
-- 5. Plans + feature flags
-- ---------------------------------------------------------------------------

create table plans (
  id         text primary key,
  name       text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table plans enable row level security;

create table features (
  key         text primary key,
  description text
);
alter table features enable row level security;

create table plan_features (
  plan_id     text not null references plans(id) on delete cascade,
  feature_key text not null references features(key) on delete cascade,
  enabled     bool not null default true,
  config      jsonb not null default '{}'::jsonb,
  primary key (plan_id, feature_key)
);
alter table plan_features enable row level security;

create table church_subscriptions (
  church_id              uuid primary key references churches(id) on delete cascade,
  plan_id                text not null references plans(id),
  status                 sub_status not null default 'trial',
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
alter table church_subscriptions enable row level security;

create table church_feature_overrides (
  church_id   uuid not null references churches(id) on delete cascade,
  feature_key text not null references features(key) on delete cascade,
  enabled     bool not null default true,
  config      jsonb not null default '{}'::jsonb,
  primary key (church_id, feature_key)
);
alter table church_feature_overrides enable row level security;

-- ---------------------------------------------------------------------------
-- 6. Usage metering
-- ---------------------------------------------------------------------------

create table usage_counters_daily (
  church_id  uuid not null references churches(id) on delete cascade,
  date       date not null default current_date,
  metric_key text not null,
  count      bigint not null default 0,
  primary key (church_id, date, metric_key)
);
alter table usage_counters_daily enable row level security;

-- ---------------------------------------------------------------------------
-- 7. People
-- ---------------------------------------------------------------------------

create table households (
  id         uuid primary key default gen_random_uuid(),
  church_id  uuid not null references churches(id) on delete cascade,
  campus_id  uuid references campuses(id) on delete set null,
  name       text not null,
  created_at timestamptz not null default now()
);
alter table households enable row level security;

create table people (
  id            uuid primary key default gen_random_uuid(),
  church_id     uuid not null references churches(id) on delete cascade,
  campus_id     uuid references campuses(id) on delete set null,
  household_id  uuid references households(id) on delete set null,
  first_name    text not null,
  last_name     text not null,
  email         text,
  phone         text,
  status        person_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table people enable row level security;

create table tags (
  id         uuid primary key default gen_random_uuid(),
  church_id  uuid not null references churches(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
alter table tags enable row level security;

create table person_tags (
  person_id uuid not null references people(id) on delete cascade,
  tag_id    uuid not null references tags(id) on delete cascade,
  primary key (person_id, tag_id)
);
alter table person_tags enable row level security;

-- ---------------------------------------------------------------------------
-- 8. Events
-- ---------------------------------------------------------------------------

create table events (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid not null references churches(id) on delete cascade,
  campus_id   uuid references campuses(id) on delete set null,
  title       text not null,
  description text,
  location    text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  featured    bool not null default false,
  capacity    int,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table events enable row level security;

create table event_rsvps (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid not null references churches(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  guest_name  text,
  guest_email text,
  status      rsvp_status not null default 'yes',
  created_at  timestamptz not null default now()
);
alter table event_rsvps enable row level security;

-- ---------------------------------------------------------------------------
-- 9. Forms
-- ---------------------------------------------------------------------------

create table form_definitions (
  id         uuid primary key default gen_random_uuid(),
  church_id  uuid not null references churches(id) on delete cascade,
  key        text not null,
  title      text not null,
  schema     jsonb not null default '{}'::jsonb,
  is_enabled bool not null default true,
  created_at timestamptz not null default now()
);
alter table form_definitions enable row level security;

create table form_submissions (
  id                   uuid primary key default gen_random_uuid(),
  church_id            uuid not null references churches(id) on delete cascade,
  form_id              uuid not null references form_definitions(id) on delete cascade,
  submitted_by_user_id uuid references auth.users(id) on delete set null,
  payload              jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now()
);
alter table form_submissions enable row level security;

-- ---------------------------------------------------------------------------
-- 10. Announcements
-- ---------------------------------------------------------------------------

create table announcements (
  id           uuid primary key default gen_random_uuid(),
  church_id    uuid not null references churches(id) on delete cascade,
  campus_id    uuid references campuses(id) on delete set null,
  title        text not null,
  body         text,
  publish_at   timestamptz,
  is_published bool not null default false,
  created_at   timestamptz not null default now()
);
alter table announcements enable row level security;

-- ---------------------------------------------------------------------------
-- 11. Messaging
-- ---------------------------------------------------------------------------

create table message_templates (
  id         uuid primary key default gen_random_uuid(),
  church_id  uuid not null references churches(id) on delete cascade,
  channel    msg_channel not null,
  name       text not null,
  body       text not null,
  created_at timestamptz not null default now()
);
alter table message_templates enable row level security;

create table message_sends (
  id                  uuid primary key default gen_random_uuid(),
  church_id           uuid not null references churches(id) on delete cascade,
  channel             msg_channel not null,
  created_by_user_id  uuid not null references auth.users(id),
  audience_type       audience_type not null,
  audience_ref        uuid,
  subject             text,
  body                text not null,
  provider_message_id text,
  status              msg_status not null default 'queued',
  error               text,
  created_at          timestamptz not null default now()
);
alter table message_sends enable row level security;

-- ---------------------------------------------------------------------------
-- 12. Notifications
-- ---------------------------------------------------------------------------

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  church_id  uuid not null references churches(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  data       jsonb,
  is_read    bool not null default false,
  created_at timestamptz not null default now()
);
alter table notifications enable row level security;

-- ---------------------------------------------------------------------------
-- 13. Device tokens
-- ---------------------------------------------------------------------------

create table device_tokens (
  id           uuid primary key default gen_random_uuid(),
  church_id    uuid not null references churches(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  platform     device_platform not null,
  token        text not null,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
alter table device_tokens enable row level security;

-- ---------------------------------------------------------------------------
-- 14. Audit log
-- ---------------------------------------------------------------------------

create table audit_log (
  id            uuid primary key default gen_random_uuid(),
  church_id     uuid not null references churches(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id),
  action        text not null,
  target_type   text,
  target_id     uuid,
  meta          jsonb,
  created_at    timestamptz not null default now()
);
alter table audit_log enable row level security;

-- ---------------------------------------------------------------------------
-- 15. Indexes
-- ---------------------------------------------------------------------------

-- Membership lookups
create index idx_church_users_user    on church_users(user_id);
create index idx_church_users_church  on church_users(church_id);

-- People
create index idx_people_church        on people(church_id);
create index idx_people_household     on people(household_id);
create index idx_households_church    on households(church_id);

-- Events
create index idx_events_church        on events(church_id);
create index idx_events_starts        on events(church_id, starts_at);
create index idx_event_rsvps_event    on event_rsvps(event_id);

-- Forms
create index idx_form_defs_church     on form_definitions(church_id);
create index idx_form_subs_form       on form_submissions(form_id);

-- Messaging
create index idx_msg_sends_church     on message_sends(church_id);
create index idx_msg_templates_church on message_templates(church_id);

-- Notifications
create index idx_notifications_user   on notifications(user_id, is_read);

-- Device tokens
create index idx_device_tokens_user   on device_tokens(user_id);

-- Audit
create index idx_audit_church         on audit_log(church_id);
create index idx_audit_created        on audit_log(church_id, created_at);

-- Usage
create index idx_usage_church_date    on usage_counters_daily(church_id, date);

-- Campuses
create index idx_campuses_church      on campuses(church_id);

-- Tags
create index idx_tags_church          on tags(church_id);

-- Announcements
create index idx_announcements_church on announcements(church_id);

-- Subscriptions
create index idx_church_subs_plan     on church_subscriptions(plan_id);

-- =========================================================================
-- 16. RLS POLICIES
-- =========================================================================

-- -------------------------------------------------------------------------
-- churches: members can read their own church
-- -------------------------------------------------------------------------
create policy "members can view own church"
  on churches for select
  using (is_church_member(id));

-- -------------------------------------------------------------------------
-- campuses: members can read; admins can manage
-- -------------------------------------------------------------------------
create policy "members can view campuses"
  on campuses for select
  using (is_church_member(church_id));

create policy "admins can insert campuses"
  on campuses for insert
  with check (is_church_admin(church_id));

create policy "admins can update campuses"
  on campuses for update
  using (is_church_admin(church_id));

create policy "admins can delete campuses"
  on campuses for delete
  using (is_church_admin(church_id));

-- -------------------------------------------------------------------------
-- church_settings: members can read; admins can manage
-- -------------------------------------------------------------------------
create policy "members can view settings"
  on church_settings for select
  using (is_church_member(church_id));

create policy "admins can insert settings"
  on church_settings for insert
  with check (is_church_admin(church_id));

create policy "admins can update settings"
  on church_settings for update
  using (is_church_admin(church_id));

-- -------------------------------------------------------------------------
-- church_users: members can see co-members; admins can manage
-- -------------------------------------------------------------------------
create policy "members can view church members"
  on church_users for select
  using (is_church_member(church_id));

create policy "admins can insert church users"
  on church_users for insert
  with check (is_church_admin(church_id));

create policy "admins can update church users"
  on church_users for update
  using (is_church_admin(church_id));

create policy "admins can delete church users"
  on church_users for delete
  using (is_church_admin(church_id));

-- -------------------------------------------------------------------------
-- profiles: users can read/update their own; church co-members can read
-- -------------------------------------------------------------------------
create policy "users can view own profile"
  on profiles for select
  using (user_id = auth.uid());

create policy "co-members can view profiles"
  on profiles for select
  using (
    exists (
      select 1 from church_users a
      join church_users b on a.church_id = b.church_id
      where a.user_id = auth.uid() and a.status = 'active'
        and b.user_id = profiles.user_id and b.status = 'active'
    )
  );

create policy "users can insert own profile"
  on profiles for insert
  with check (user_id = auth.uid());

create policy "users can update own profile"
  on profiles for update
  using (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- plans / features / plan_features: public read (catalog)
-- -------------------------------------------------------------------------
create policy "anyone can view plans"
  on plans for select
  using (true);

create policy "anyone can view features"
  on features for select
  using (true);

create policy "anyone can view plan features"
  on plan_features for select
  using (true);

-- -------------------------------------------------------------------------
-- church_subscriptions: members can read; admins can manage
-- -------------------------------------------------------------------------
create policy "members can view subscription"
  on church_subscriptions for select
  using (is_church_member(church_id));

create policy "admins can insert subscription"
  on church_subscriptions for insert
  with check (is_church_admin(church_id));

create policy "admins can update subscription"
  on church_subscriptions for update
  using (is_church_admin(church_id));

-- -------------------------------------------------------------------------
-- church_feature_overrides: members can read; admins can manage
-- -------------------------------------------------------------------------
create policy "members can view feature overrides"
  on church_feature_overrides for select
  using (is_church_member(church_id));

create policy "admins can insert feature overrides"
  on church_feature_overrides for insert
  with check (is_church_admin(church_id));

create policy "admins can update feature overrides"
  on church_feature_overrides for update
  using (is_church_admin(church_id));

create policy "admins can delete feature overrides"
  on church_feature_overrides for delete
  using (is_church_admin(church_id));

-- -------------------------------------------------------------------------
-- usage_counters_daily: admins/leaders can read; server-side writes
-- -------------------------------------------------------------------------
create policy "leaders can view usage"
  on usage_counters_daily for select
  using (is_church_admin_or_leader(church_id));

-- -------------------------------------------------------------------------
-- households: members can read; leaders+ can manage
-- -------------------------------------------------------------------------
create policy "members can view households"
  on households for select
  using (is_church_member(church_id));

create policy "leaders can insert households"
  on households for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update households"
  on households for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete households"
  on households for delete
  using (is_church_admin_or_leader(church_id));

-- -------------------------------------------------------------------------
-- people: members can read; leaders+ can manage
-- -------------------------------------------------------------------------
create policy "members can view people"
  on people for select
  using (is_church_member(church_id));

create policy "leaders can insert people"
  on people for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update people"
  on people for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete people"
  on people for delete
  using (is_church_admin_or_leader(church_id));

-- -------------------------------------------------------------------------
-- tags + person_tags: members can read; leaders+ can manage
-- -------------------------------------------------------------------------
create policy "members can view tags"
  on tags for select
  using (is_church_member(church_id));

create policy "leaders can insert tags"
  on tags for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update tags"
  on tags for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete tags"
  on tags for delete
  using (is_church_admin_or_leader(church_id));

create policy "members can view person tags"
  on person_tags for select
  using (
    exists (
      select 1 from people p
      where p.id = person_tags.person_id
        and is_church_member(p.church_id)
    )
  );

create policy "leaders can insert person tags"
  on person_tags for insert
  with check (
    exists (
      select 1 from people p
      where p.id = person_tags.person_id
        and is_church_admin_or_leader(p.church_id)
    )
  );

create policy "leaders can delete person tags"
  on person_tags for delete
  using (
    exists (
      select 1 from people p
      where p.id = person_tags.person_id
        and is_church_admin_or_leader(p.church_id)
    )
  );

-- -------------------------------------------------------------------------
-- events: members can read; leaders+ can manage
-- -------------------------------------------------------------------------
create policy "members can view events"
  on events for select
  using (is_church_member(church_id));

create policy "leaders can insert events"
  on events for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update events"
  on events for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete events"
  on events for delete
  using (is_church_admin_or_leader(church_id));

-- -------------------------------------------------------------------------
-- event_rsvps: members can read; members can insert own; leaders+ manage
-- -------------------------------------------------------------------------
create policy "members can view rsvps"
  on event_rsvps for select
  using (is_church_member(church_id));

create policy "members can insert own rsvp"
  on event_rsvps for insert
  with check (
    is_church_member(church_id)
    and (user_id = auth.uid() or user_id is null)
  );

create policy "members can update own rsvp"
  on event_rsvps for update
  using (
    is_church_member(church_id)
    and user_id = auth.uid()
  );

create policy "leaders can manage rsvps"
  on event_rsvps for delete
  using (is_church_admin_or_leader(church_id));

-- -------------------------------------------------------------------------
-- form_definitions: members can read enabled; leaders+ can manage
-- -------------------------------------------------------------------------
create policy "members can view enabled forms"
  on form_definitions for select
  using (is_church_member(church_id));

create policy "leaders can insert forms"
  on form_definitions for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update forms"
  on form_definitions for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete forms"
  on form_definitions for delete
  using (is_church_admin_or_leader(church_id));

-- -------------------------------------------------------------------------
-- form_submissions: submitter can insert; leaders+ can read all
-- -------------------------------------------------------------------------
create policy "members can submit forms"
  on form_submissions for insert
  with check (is_church_member(church_id));

create policy "leaders can view submissions"
  on form_submissions for select
  using (is_church_admin_or_leader(church_id));

create policy "submitters can view own"
  on form_submissions for select
  using (submitted_by_user_id = auth.uid());

-- -------------------------------------------------------------------------
-- announcements: members can read published; leaders+ can manage
-- -------------------------------------------------------------------------
create policy "members can view published announcements"
  on announcements for select
  using (is_church_member(church_id));

create policy "leaders can insert announcements"
  on announcements for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update announcements"
  on announcements for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete announcements"
  on announcements for delete
  using (is_church_admin_or_leader(church_id));

-- -------------------------------------------------------------------------
-- message_templates: leaders+ can manage
-- -------------------------------------------------------------------------
create policy "leaders can view templates"
  on message_templates for select
  using (is_church_admin_or_leader(church_id));

create policy "leaders can insert templates"
  on message_templates for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update templates"
  on message_templates for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete templates"
  on message_templates for delete
  using (is_church_admin_or_leader(church_id));

-- -------------------------------------------------------------------------
-- message_sends: leaders+ can manage
-- -------------------------------------------------------------------------
create policy "leaders can view sends"
  on message_sends for select
  using (is_church_admin_or_leader(church_id));

create policy "leaders can insert sends"
  on message_sends for insert
  with check (is_church_admin_or_leader(church_id));

-- -------------------------------------------------------------------------
-- notifications: users can read/update own
-- -------------------------------------------------------------------------
create policy "users can view own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "users can update own notifications"
  on notifications for update
  using (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- device_tokens: users can manage own
-- -------------------------------------------------------------------------
create policy "users can view own tokens"
  on device_tokens for select
  using (user_id = auth.uid());

create policy "users can insert own tokens"
  on device_tokens for insert
  with check (user_id = auth.uid());

create policy "users can update own tokens"
  on device_tokens for update
  using (user_id = auth.uid());

create policy "users can delete own tokens"
  on device_tokens for delete
  using (user_id = auth.uid());

-- -------------------------------------------------------------------------
-- audit_log: admins can read; server-side writes
-- -------------------------------------------------------------------------
create policy "admins can view audit log"
  on audit_log for select
  using (is_church_admin(church_id));

-- =========================================================================
-- 17. SEED DATA — Plans
-- =========================================================================

insert into plans (id, name, sort_order) values
  ('under_150',  'Under 150',   1),
  ('151_500',    '151–500',     2),
  ('501_800',    '501–800',     3),
  ('801_plus',   '801+',        4),
  ('multisite',  'Multisite',   5);

-- =========================================================================
-- 18. SEED DATA — Feature keys
-- =========================================================================

insert into features (key, description) values
  ('core.people',              'Contact directory and profiles'),
  ('core.events',              'Event calendar and management'),
  ('core.forms',               'Custom form builder'),
  ('core.giving_external',     'External giving link integration'),
  ('core.messaging_sms',       'SMS messaging'),
  ('core.messaging_email',     'Email messaging'),
  ('engage.groups',            'Small groups management'),
  ('engage.groups.chat',       'In-app group chat'),
  ('engage.groups.sms_mirror', 'SMS mirroring for group messages'),
  ('engage.care_meals',        'Meal train / care coordination'),
  ('services.kids_checkin',           'Child check-in system'),
  ('services.kids_checkin.labels',    'Printed security labels'),
  ('engage.events.tickets',          'Event ticketing'),
  ('org.campuses',                    'Multi-campus management');

-- =========================================================================
-- 19. SEED DATA — Plan ↔ Feature mapping
-- =========================================================================

-- under_150: all core features + messaging
insert into plan_features (plan_id, feature_key) values
  ('under_150', 'core.people'),
  ('under_150', 'core.events'),
  ('under_150', 'core.forms'),
  ('under_150', 'core.giving_external'),
  ('under_150', 'core.messaging_sms'),
  ('under_150', 'core.messaging_email');

-- 151_500: under_150 + groups (chat, sms_mirror) + care_meals
insert into plan_features (plan_id, feature_key) values
  ('151_500', 'core.people'),
  ('151_500', 'core.events'),
  ('151_500', 'core.forms'),
  ('151_500', 'core.giving_external'),
  ('151_500', 'core.messaging_sms'),
  ('151_500', 'core.messaging_email'),
  ('151_500', 'engage.groups'),
  ('151_500', 'engage.groups.chat'),
  ('151_500', 'engage.groups.sms_mirror'),
  ('151_500', 'engage.care_meals');

-- 501_800: 151_500 + kids_checkin + labels + tickets
insert into plan_features (plan_id, feature_key) values
  ('501_800', 'core.people'),
  ('501_800', 'core.events'),
  ('501_800', 'core.forms'),
  ('501_800', 'core.giving_external'),
  ('501_800', 'core.messaging_sms'),
  ('501_800', 'core.messaging_email'),
  ('501_800', 'engage.groups'),
  ('501_800', 'engage.groups.chat'),
  ('501_800', 'engage.groups.sms_mirror'),
  ('501_800', 'engage.care_meals'),
  ('501_800', 'services.kids_checkin'),
  ('501_800', 'services.kids_checkin.labels'),
  ('501_800', 'engage.events.tickets');

-- 801_plus: same as 501_800
insert into plan_features (plan_id, feature_key) values
  ('801_plus', 'core.people'),
  ('801_plus', 'core.events'),
  ('801_plus', 'core.forms'),
  ('801_plus', 'core.giving_external'),
  ('801_plus', 'core.messaging_sms'),
  ('801_plus', 'core.messaging_email'),
  ('801_plus', 'engage.groups'),
  ('801_plus', 'engage.groups.chat'),
  ('801_plus', 'engage.groups.sms_mirror'),
  ('801_plus', 'engage.care_meals'),
  ('801_plus', 'services.kids_checkin'),
  ('801_plus', 'services.kids_checkin.labels'),
  ('801_plus', 'engage.events.tickets');

-- multisite: everything
insert into plan_features (plan_id, feature_key) values
  ('multisite', 'core.people'),
  ('multisite', 'core.events'),
  ('multisite', 'core.forms'),
  ('multisite', 'core.giving_external'),
  ('multisite', 'core.messaging_sms'),
  ('multisite', 'core.messaging_email'),
  ('multisite', 'engage.groups'),
  ('multisite', 'engage.groups.chat'),
  ('multisite', 'engage.groups.sms_mirror'),
  ('multisite', 'engage.care_meals'),
  ('multisite', 'services.kids_checkin'),
  ('multisite', 'services.kids_checkin.labels'),
  ('multisite', 'engage.events.tickets'),
  ('multisite', 'org.campuses');
