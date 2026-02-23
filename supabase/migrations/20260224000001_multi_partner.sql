-- ============================================
-- Multi-partner support
-- ============================================

-- 1. Add unique constraint on active partnership pairs
--    Prevents duplicate active/pending partnerships between the same two users
create unique index idx_unique_active_partnership_pair
  on public.partnerships (
    least(inviter_id, invitee_id),
    greatest(inviter_id, invitee_id)
  )
  where status in ('pending', 'active');

-- 2. Replace request_partnership: remove "already has a partnership" guards
create or replace function request_partnership(partner_code_input varchar(6))
returns json as $$
declare
  target_user_id uuid;
  target_name text;
  new_partnership_id uuid;
begin
  -- Look up the target user
  select id, name into target_user_id, target_name
  from public.users
  where partner_code = upper(partner_code_input)
    and id != auth.uid();

  if target_user_id is null then
    return json_build_object('error', 'No user found with this code');
  end if;

  -- Check for existing active/pending partnership between this specific pair
  -- The unique index will also enforce this, but a friendly error is better
  perform 1
  from public.partnerships
  where status in ('pending', 'active')
    and (
      (inviter_id = auth.uid() and invitee_id = target_user_id)
      or (inviter_id = target_user_id and invitee_id = auth.uid())
    );

  if found then
    return json_build_object('error', 'You already have a partnership with this person');
  end if;

  -- Create the partnership
  insert into public.partnerships (inviter_id, invitee_id, status)
  values (auth.uid(), target_user_id, 'pending')
  returning id into new_partnership_id;

  return json_build_object(
    'partnership_id', new_partnership_id,
    'partner_name', target_name
  );
end;
$$ language plpgsql security definer;

-- 3. Replace get_partnership_status with get_all_partnerships (returns array)
create or replace function get_all_partnerships()
returns json as $$
declare
  result json;
begin
  select coalesce(json_agg(row_to_json(t)), '[]'::json) into result
  from (
    select
      p.id as partnership_id,
      p.status,
      case when p.inviter_id = auth.uid() then u_other.name else u_other.name end as partner_name,
      case when p.inviter_id = auth.uid() then p.invitee_id else p.inviter_id end as partner_id,
      u_other.avatar_url as partner_avatar_url,
      (p.inviter_id = auth.uid()) as is_inviter,
      p.created_at
    from public.partnerships p
    join public.users u_other
      on u_other.id = case when p.inviter_id = auth.uid() then p.invitee_id else p.inviter_id end
    where p.status in ('pending', 'active')
      and (p.inviter_id = auth.uid() or p.invitee_id = auth.uid())
    order by p.created_at desc
  ) t;

  return result;
end;
$$ language plpgsql security definer;

-- Keep get_partnership_status for backward compat (still works, returns first)
-- but primary consumer will switch to get_all_partnerships

-- 4. Replace assign_task_to_partner: add p_partner_id parameter
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

  return jsonb_build_object(
    'success', true,
    'assignee_id', v_assignee_id,
    'assigner_name', v_assigner_name
  );
end;
$$ language plpgsql security definer;

-- 5. Replace send_reaction: add p_partner_id parameter
create or replace function send_reaction(
  p_target_todo_id text,
  p_emoji text,
  p_partner_id uuid default null
)
returns jsonb as $$
declare
  v_partnership record;
  v_receiver_id uuid;
  v_target_user_id uuid;
begin
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
    select * into v_partnership
    from public.partnerships
    where status = 'active'
      and (inviter_id = auth.uid() or invitee_id = auth.uid())
    limit 1;
  end if;

  if v_partnership is null then
    return jsonb_build_object('error', 'No active partnership');
  end if;

  -- Determine receiver (the partner)
  if v_partnership.inviter_id = auth.uid() then
    v_receiver_id := v_partnership.invitee_id;
  else
    v_receiver_id := v_partnership.inviter_id;
  end if;

  -- The target todo belongs to the partner (receiver)
  v_target_user_id := v_receiver_id;

  -- Upsert: one reaction per sender per todo
  insert into public.partner_interactions (
    partnership_id, sender_id, receiver_id, type, emoji,
    target_todo_id, target_todo_user_id
  ) values (
    v_partnership.id, auth.uid(), v_receiver_id, 'reaction', p_emoji,
    p_target_todo_id, v_target_user_id
  )
  on conflict (id) do nothing;

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

-- 6. Replace send_nudge: add p_partner_id parameter
create or replace function send_nudge(
  p_emoji text,
  p_message text,
  p_partner_id uuid default null
)
returns jsonb as $$
declare
  v_partnership record;
  v_receiver_id uuid;
begin
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
    select * into v_partnership
    from public.partnerships
    where status = 'active'
      and (inviter_id = auth.uid() or invitee_id = auth.uid())
    limit 1;
  end if;

  if v_partnership is null then
    return jsonb_build_object('error', 'No active partnership');
  end if;

  -- Determine receiver
  if v_partnership.inviter_id = auth.uid() then
    v_receiver_id := v_partnership.invitee_id;
  else
    v_receiver_id := v_partnership.inviter_id;
  end if;

  insert into public.partner_interactions (
    partnership_id, sender_id, receiver_id, type, emoji, message
  ) values (
    v_partnership.id, auth.uid(), v_receiver_id, 'nudge', p_emoji, p_message
  );

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;
