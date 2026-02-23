-- ============================================
-- Phase 4: Synced data tables for partner mode
-- ============================================

-- 1. Synced todos
create table public.synced_todos (
  id text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  created_at text not null,
  completed_at text,
  due_date text not null,
  due_time text,
  priority text,
  is_work boolean default false,
  emoji text,
  emoji_color text,
  estimated_minutes int,
  time_of_day text,
  repeat text,
  subtasks jsonb,
  is_private boolean not null default false,
  synced_at timestamptz not null default now(),

  primary key (id, user_id)
);

-- 2. Synced calendar events
create table public.synced_events (
  id text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  date text not null,
  start_time text,
  end_time text,
  is_all_day boolean not null default true,
  color text not null default '#007AFF',
  notes text,
  created_at text not null,
  is_private boolean not null default false,
  synced_at timestamptz not null default now(),

  primary key (id, user_id)
);

-- 3. Synced focus sessions (completed only — no point syncing in-progress)
create table public.synced_focus_sessions (
  id text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  date text not null,
  duration_ms bigint not null,
  actual_ms bigint not null,
  started_at text not null,
  completed_at text not null,
  completed boolean not null default true,
  todo_title text,
  todo_emoji text,
  synced_at timestamptz not null default now(),

  primary key (id, user_id)
);

-- 4. Synced water logs (daily aggregate)
create table public.synced_water_logs (
  user_id uuid not null references public.users(id) on delete cascade,
  date text not null,
  total_ml int not null default 0,
  entry_count int not null default 0,
  synced_at timestamptz not null default now(),

  primary key (user_id, date)
);

-- 5. Indexes for partner reads
create index idx_synced_todos_user_date on public.synced_todos(user_id, due_date);
create index idx_synced_events_user_date on public.synced_events(user_id, date);
create index idx_synced_focus_user_date on public.synced_focus_sessions(user_id, date);
create index idx_synced_water_user_date on public.synced_water_logs(user_id, date);

-- 6. Helper: check if a user is my active partner
create or replace function is_active_partner(target_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.partnerships
    where status = 'active'
      and (
        (inviter_id = auth.uid() and invitee_id = target_user_id) or
        (invitee_id = auth.uid() and inviter_id = target_user_id)
      )
  );
end;
$$ language plpgsql security definer stable;

-- 7. Helper: check if partner shares a specific category
create or replace function partner_shares_category(
  target_user_id uuid,
  category text
)
returns boolean as $$
begin
  return exists (
    select 1 from public.sharing_preferences sp
    join public.partnerships p on p.id = sp.partnership_id
    where sp.user_id = target_user_id
      and p.status = 'active'
      and (
        (p.inviter_id = auth.uid() and p.invitee_id = target_user_id) or
        (p.invitee_id = auth.uid() and p.inviter_id = target_user_id)
      )
      and (
        (category = 'todos' and sp.share_todos = true) or
        (category = 'events' and sp.share_events = true) or
        (category = 'focus' and sp.share_focus = true) or
        (category = 'water' and sp.share_water = true) or
        (category = 'work_items' and sp.share_work_items = true)
      )
  );
end;
$$ language plpgsql security definer stable;

-- 8. Row-Level Security
alter table public.synced_todos enable row level security;
alter table public.synced_events enable row level security;
alter table public.synced_focus_sessions enable row level security;
alter table public.synced_water_logs enable row level security;

-- Own data: full access
create policy "Users can manage own todos" on public.synced_todos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage own events" on public.synced_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage own focus" on public.synced_focus_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can manage own water" on public.synced_water_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Partner reads: only non-private items when partnership active + category shared
create policy "Partners can read shared todos" on public.synced_todos
  for select using (
    is_private = false
    and is_active_partner(user_id)
    and partner_shares_category(user_id, case when is_work then 'work_items' else 'todos' end)
  );

create policy "Partners can read shared events" on public.synced_events
  for select using (
    is_private = false
    and is_active_partner(user_id)
    and partner_shares_category(user_id, 'events')
  );

create policy "Partners can read shared focus" on public.synced_focus_sessions
  for select using (
    is_active_partner(user_id)
    and partner_shares_category(user_id, 'focus')
  );

create policy "Partners can read shared water" on public.synced_water_logs
  for select using (
    is_active_partner(user_id)
    and partner_shares_category(user_id, 'water')
  );
