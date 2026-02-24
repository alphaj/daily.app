-- ============================================
-- Fix: Prevent duplicate reactions per sender per todo
-- ============================================

-- 1. Add unique constraint for one reaction per sender per todo
--    (allows updating the emoji on an existing reaction)
create unique index idx_unique_reaction_per_sender_todo
  on public.partner_interactions (sender_id, target_todo_id)
  where type = 'reaction' and target_todo_id is not null;

-- 2. Replace send_reaction to use the correct conflict target
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

  -- Upsert: one reaction per sender per todo, update emoji if changed
  insert into public.partner_interactions (
    partnership_id, sender_id, receiver_id, type, emoji,
    target_todo_id, target_todo_user_id
  ) values (
    v_partnership.id, auth.uid(), v_receiver_id, 'reaction', p_emoji,
    p_target_todo_id, v_target_user_id
  )
  on conflict (sender_id, target_todo_id) where type = 'reaction' and target_todo_id is not null
  do update set
    emoji = excluded.emoji,
    status = 'pending',
    created_at = now(),
    delivered_at = null,
    read_at = null;

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;
