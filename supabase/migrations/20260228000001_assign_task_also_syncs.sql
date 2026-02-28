-- ============================================
-- Fix: assigned tasks immediately visible on partner detail page
--
-- Previously, assign_task_to_partner only inserted into assigned_tasks
-- (a delivery queue). The partner detail page reads from synced_todos,
-- so assigned tasks were invisible until the partner's device completed
-- a full sync round-trip. Now the RPC also upserts into synced_todos
-- for the assignee so the task shows up immediately.
-- ============================================

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
  task_subtasks jsonb default null,
  p_partner_id uuid default null
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

  -- Find active partnership with the specified partner
  if p_partner_id is not null then
    select * into v_partnership
    from public.partnerships
    where status = 'active'
      and (
        (inviter_id = auth.uid() and invitee_id = p_partner_id)
        or (invitee_id = auth.uid() and inviter_id = p_partner_id)
      );
  else
    -- Fallback: find any active partnership (backward compat)
    select * into v_partnership
    from public.partnerships
    where status = 'active'
      and (inviter_id = auth.uid() or invitee_id = auth.uid())
    limit 1;
  end if;

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

  -- Insert into assigned_tasks (delivery queue for partner's device)
  insert into public.assigned_tasks (
    id, assigner_id, assigner_name, assignee_id, partnership_id,
    title, created_at, due_date, due_time, priority, is_work,
    emoji, emoji_color, estimated_minutes, time_of_day, repeat, subtasks
  ) values (
    task_id, auth.uid(), v_assigner_name, v_assignee_id, v_partnership.id,
    task_title, task_created_at, task_due_date, task_due_time, task_priority, task_is_work,
    task_emoji, task_emoji_color, task_estimated_minutes, task_time_of_day, task_repeat, task_subtasks
  );

  -- Also upsert into synced_todos for the assignee so the task is
  -- immediately visible on the assigner's partner detail page
  insert into public.synced_todos (
    id, user_id, title, completed, created_at, due_date, due_time,
    priority, is_work, emoji, emoji_color, estimated_minutes,
    time_of_day, repeat, subtasks, is_private,
    assigned_by_id, assigned_by_name, synced_at
  ) values (
    task_id, v_assignee_id, task_title, false, task_created_at, task_due_date, task_due_time,
    task_priority, task_is_work, task_emoji, task_emoji_color, task_estimated_minutes,
    task_time_of_day, task_repeat, task_subtasks, false,
    auth.uid(), v_assigner_name, now()
  )
  on conflict (id, user_id) do update set
    title = excluded.title,
    due_date = excluded.due_date,
    due_time = excluded.due_time,
    priority = excluded.priority,
    is_work = excluded.is_work,
    emoji = excluded.emoji,
    emoji_color = excluded.emoji_color,
    estimated_minutes = excluded.estimated_minutes,
    time_of_day = excluded.time_of_day,
    repeat = excluded.repeat,
    subtasks = excluded.subtasks,
    assigned_by_id = excluded.assigned_by_id,
    assigned_by_name = excluded.assigned_by_name,
    synced_at = excluded.synced_at;

  return jsonb_build_object(
    'success', true,
    'assignee_id', v_assignee_id,
    'assigner_name', v_assigner_name
  );
end;
$$ language plpgsql security definer;
