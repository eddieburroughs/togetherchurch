-- ---------------------------------------------------------------------------
-- Giving Partners
-- ---------------------------------------------------------------------------

create table giving_partners (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid not null references churches(id) on delete cascade,
  name        text not null,
  description text,
  website_url text,
  category    text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table giving_partners enable row level security;

create index idx_giving_partners_church on giving_partners(church_id);

create policy "leaders+ can manage giving partners"
  on giving_partners for all
  using (is_church_admin_or_leader(church_id));

-- Members can view active partners
create policy "members can view active giving partners"
  on giving_partners for select
  using (
    is_church_member(church_id) and is_active = true
  );

-- Feature key (available on all plans)
insert into features (key, description)
values ('core.giving', 'Giving link and partner directory')
on conflict (key) do nothing;

insert into plan_features (plan_id, feature_key)
select p.id, 'core.giving'
from plans p
where p.id in ('under_150', '151_500', '501_800', '801_plus', 'multisite')
on conflict do nothing;
