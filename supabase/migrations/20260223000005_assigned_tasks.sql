-- ============================================
-- Phase 5: Assign tasks to partner
-- ============================================

-- 1. Delivery queue for assigned tasks
create table public.assigned_tasks (
  id text not null primary key,
  assigner_id uuid not null references public.users(id) on delete cascade,
  assigner_name text not null,
  assignee_id uuid not null references public.users(id) on delete cascade,
  partnership_id uuid not null references public.partnerships(id) on delete cascade,
  title text not null,
  created_at text not null,
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
  status text not null default 'pending' check (status in ('pending', 'delivered')),
  assigned_at timestamptz not null default now(),
  delivered_at timestamptz,
  constraint no_self_assign check (assigner_id != assignee_id)
);

create index idx_assigned_tasks_assignee_pending
  on public.assigned_tasks(assignee_id) where status = 'pending';

-- 2. Add provenance columns to synced_todos
alter table public.synced_todos
  add column assigned_by_id uuid references public.users(id),
  add column assigned_by_name text;

-- 3. RLS on assigned_tasks
alter table public.assigned_tasks enable row level security;

create policy "Assigners can read own assigned tasks"
  on public.assigned_tasks for select
  using (assigner_id = auth.uid());

create policy "Assignees can read tasks assigned to them"
  on public.assigned_tasks for select
  using (assignee_id = auth.uid());

create policy "Assignees can update delivery status"
  on public.assigned_tasks for update
  using (assignee_id = auth.uid())
  with check (assignee_id = auth.uid());

-- 4. RPC to assign a task to partner (security definer)
create or replace function assign_task_to_partner(
  task_id text,
  task_title text,
  task_created_at text,
  task_due_date text,
  task_due_time text default null,
  task_priority text default null,
  task_is_work boolean default false,
  task_emoji text default null,
  task_emoji_color text default null,
  task_estimated_minutes int default null,
  task_time_of_day text default null,
  task_repeat text default null,
  task_subtasks jsonb default null
)
returns jsonb as $$
declare
  v_partnership record;
  v_assigner_name text;
  v_assignee_id uuid;
  v_assigner_shares boolean;
  v_assignee_shares boolean;
begin
  -- Get caller's name
  select name into v_assigner_name
  from public.users
  where id = auth.uid();

  if v_assigner_name is null then
    return jsonb_build_object('error', 'User not found');
  end if;

  -- Find active partnership
  select * into v_partnership
  from public.partnerships
  where status = 'active'
    and (inviter_id = auth.uid() or invitee_id = auth.uid())
  limit 1;

  if v_partnership is null then
    return jsonb_build_object('error', 'No active partnership');
  end if;

  -- Determine assignee
  if v_partnership.inviter_id = auth.uid() then
    v_assignee_id := v_partnership.invitee_id;
  else
    v_assignee_id := v_partnership.inviter_id;
  end if;

  -- Check both partners share todos
  select share_todos into v_assigner_shares
  from public.sharing_preferences
  where user_id = auth.uid() and partnership_id = v_partnership.id;

  select share_todos into v_assignee_shares
  from public.sharing_preferences
  where user_id = v_assignee_id and partnership_id = v_partnership.id;

  if not coalesce(v_assigner_shares, false) then
    return jsonb_build_object('error', 'You have todo sharing disabled');
  end if;

  if not coalesce(v_assignee_shares, false) then
    return jsonb_build_object('error', 'Your partner has todo sharing disabled');
  end if;

  -- Insert the assigned task
  insert into public.assigned_tasks (
    id, assigner_id, assigner_name, assignee_id, partnership_id,
    title, created_at, due_date, due_time, priority, is_work,
    emoji, emoji_color, estimated_minutes, time_of_day, repeat, subtasks
  ) values (
    task_id, auth.uid(), v_assigner_name, v_assignee_id, v_partnership.id,
    task_title, task_created_at, task_due_date, task_due_time, task_priority, task_is_work,
    task_emoji, task_emoji_color, task_estimated_minutes, task_time_of_day, task_repeat, task_subtasks
  );

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;
