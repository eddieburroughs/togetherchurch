-- ---------------------------------------------------------------------------
-- Migration 0005: Tickets module + Stripe Connect
-- Tables: stripe_connect_accounts, ticket_types, ticket_orders,
--         ticket_order_items, ticket_checkins
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Stripe Connect Accounts (one per church)
-- ---------------------------------------------------------------------------

create table stripe_connect_accounts (
  id                 uuid primary key default gen_random_uuid(),
  church_id          uuid not null unique references churches(id) on delete cascade,
  stripe_account_id  text not null,
  charges_enabled    boolean not null default false,
  details_submitted  boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table stripe_connect_accounts enable row level security;

create index idx_stripe_connect_church on stripe_connect_accounts(church_id);

-- ---------------------------------------------------------------------------
-- 2. Ticket Types
-- ---------------------------------------------------------------------------

create table ticket_types (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid not null references churches(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade,
  name        text not null,
  description text,
  price_cents int not null default 0,
  capacity    int,
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table ticket_types enable row level security;

create index idx_ticket_types_event on ticket_types(event_id);
create index idx_ticket_types_church on ticket_types(church_id);

-- ---------------------------------------------------------------------------
-- 3. Ticket Orders
-- ---------------------------------------------------------------------------

create type order_status as enum ('pending', 'completed', 'cancelled', 'refunded');

create table ticket_orders (
  id                   uuid primary key default gen_random_uuid(),
  church_id            uuid not null references churches(id) on delete cascade,
  event_id             uuid not null references events(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  status               order_status not null default 'pending',
  total_cents          int not null default 0,
  stripe_payment_intent text,
  confirmation_code    text not null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
alter table ticket_orders enable row level security;

create index idx_ticket_orders_event on ticket_orders(event_id);
create index idx_ticket_orders_user on ticket_orders(user_id);
create index idx_ticket_orders_church on ticket_orders(church_id);
create index idx_ticket_orders_confirmation on ticket_orders(confirmation_code);

-- ---------------------------------------------------------------------------
-- 4. Ticket Order Items
-- ---------------------------------------------------------------------------

create table ticket_order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references ticket_orders(id) on delete cascade,
  ticket_type_id  uuid not null references ticket_types(id) on delete cascade,
  quantity        int not null default 1,
  unit_price_cents int not null default 0,
  created_at      timestamptz not null default now()
);
alter table ticket_order_items enable row level security;

create index idx_ticket_order_items_order on ticket_order_items(order_id);
create index idx_ticket_order_items_type on ticket_order_items(ticket_type_id);

-- ---------------------------------------------------------------------------
-- 5. Ticket Checkins
-- ---------------------------------------------------------------------------

create table ticket_checkins (
  id           uuid primary key default gen_random_uuid(),
  church_id    uuid not null references churches(id) on delete cascade,
  order_id     uuid not null references ticket_orders(id) on delete cascade,
  event_id     uuid not null references events(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users(id) on delete set null
);
alter table ticket_checkins enable row level security;

create index idx_ticket_checkins_order on ticket_checkins(order_id);
create index idx_ticket_checkins_event on ticket_checkins(event_id);

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------

-- stripe_connect_accounts: admin only
create policy "admins can view stripe connect"
  on stripe_connect_accounts for select
  using (is_church_admin_or_leader(church_id));

create policy "admins can insert stripe connect"
  on stripe_connect_accounts for insert
  with check (is_church_admin_or_leader(church_id));

create policy "admins can update stripe connect"
  on stripe_connect_accounts for update
  using (is_church_admin_or_leader(church_id));

-- ticket_types: leaders+ manage, members can view active
create policy "members can view ticket types"
  on ticket_types for select
  using (is_church_member(church_id));

create policy "leaders can insert ticket types"
  on ticket_types for insert
  with check (is_church_admin_or_leader(church_id));

create policy "leaders can update ticket types"
  on ticket_types for update
  using (is_church_admin_or_leader(church_id));

create policy "leaders can delete ticket types"
  on ticket_types for delete
  using (is_church_admin_or_leader(church_id));

-- ticket_orders: members can view own, leaders+ can view all
create policy "members can view own orders"
  on ticket_orders for select
  using (auth.uid() = user_id or is_church_admin_or_leader(church_id));

create policy "members can insert orders"
  on ticket_orders for insert
  with check (is_church_member(church_id) and auth.uid() = user_id);

create policy "leaders can update orders"
  on ticket_orders for update
  using (is_church_admin_or_leader(church_id));

-- ticket_order_items: follow parent order visibility
create policy "members can view own order items"
  on ticket_order_items for select
  using (
    exists (
      select 1 from ticket_orders o
      where o.id = ticket_order_items.order_id
      and (o.user_id = auth.uid() or is_church_admin_or_leader(o.church_id))
    )
  );

create policy "members can insert order items"
  on ticket_order_items for insert
  with check (
    exists (
      select 1 from ticket_orders o
      where o.id = ticket_order_items.order_id
      and o.user_id = auth.uid()
    )
  );

-- ticket_checkins: leaders+ only
create policy "leaders can view checkins"
  on ticket_checkins for select
  using (is_church_admin_or_leader(church_id));

create policy "leaders can insert checkins"
  on ticket_checkins for insert
  with check (is_church_admin_or_leader(church_id));
