-- ---------------------------------------------------------------------------
-- Migration 0002: Groups module
-- Tables: groups, group_members, chat_messages, sms_thread_tokens
-- ---------------------------------------------------------------------------

-- Enums
create type group_role  as enum ('leader', 'member');
create type chat_source as enum ('app', 'sms');

-- ---------------------------------------------------------------------------
-- 1. Groups
-- ---------------------------------------------------------------------------

create table groups (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid not null references churches(id) on delete cascade,
  campus_id   uuid references campuses(id) on delete set null,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);
alter table groups enable row level security;

create index idx_groups_church on groups(church_id);

-- ---------------------------------------------------------------------------
-- 2. Group Members
-- ---------------------------------------------------------------------------

create table group_members (
  group_id          uuid not null references groups(id) on delete cascade,
  church_id         uuid not null references churches(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  role              group_role not null default 'member',
  sms_mirror_opt_in bool not null default false,
  sms_notify_opt_in bool not null default false,
  is_muted          bool not null default false,
  joined_at         timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table group_members enable row level security;

create index idx_group_members_user on group_members(user_id);
create index idx_group_members_church on group_members(church_id);

-- ---------------------------------------------------------------------------
-- 3. Chat Messages
-- ---------------------------------------------------------------------------

create table chat_messages (
  id              uuid primary key default gen_random_uuid(),
  church_id       uuid not null references churches(id) on delete cascade,
  group_id        uuid not null references groups(id) on delete cascade,
  sender_user_id  uuid references auth.users(id) on delete set null,
  source          chat_source not null default 'app',
  body            text not null,
  meta            jsonb,
  created_at      timestamptz not null default now()
);
alter table chat_messages enable row level security;

create index idx_chat_messages_group on chat_messages(group_id, created_at);
create index idx_chat_messages_church on chat_messages(church_id);

-- ---------------------------------------------------------------------------
-- 4. SMS Thread Tokens (for routing inbound SMS → group)
-- ---------------------------------------------------------------------------

create table sms_thread_tokens (
  token      text primary key,
  church_id  uuid not null references churches(id) on delete cascade,
  group_id   uuid not null references groups(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);

create index idx_sms_tokens_expires on sms_thread_tokens(expires_at);

-- No RLS on sms_thread_tokens — server-only access via service role

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------

-- groups: church members can view, leaders+ manage
create policy "members can view groups"
  on groups for select
  using (is_church_member(church_id));

create policy "leaders can insert groups"
  on groups for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update groups"
  on groups for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete groups"
  on groups for delete
  using (is_church_admin_or_leader(church_id));

-- group_members: members see co-members, leaders+ manage
create policy "members can view group members"
  on group_members for select
  using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy "leaders can insert group members"
  on group_members for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update group members"
  on group_members for update
  using (is_church_admin_or_leader(church_id));

create policy "members can update own membership"
  on group_members for update
  using (user_id = auth.uid());

create policy "leaders can delete group members"
  on group_members for delete
  using (is_church_admin_or_leader(church_id));

-- chat_messages: group members can view and insert
create policy "group members can view messages"
  on chat_messages for select
  using (
    exists (
      select 1 from group_members gm
      where gm.group_id = chat_messages.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy "group members can insert messages"
  on chat_messages for insert
  with check (
    exists (
      select 1 from group_members gm
      where gm.group_id = chat_messages.group_id
        and gm.user_id = auth.uid()
    )
  );
