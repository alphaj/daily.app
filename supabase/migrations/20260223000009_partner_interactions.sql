-- ============================================
-- Phase 9: Partner interactions (reactions & nudges)
-- ============================================

-- 1. Interactions table
create table public.partner_interactions (
  id uuid not null default gen_random_uuid() primary key,
  partnership_id uuid not null references public.partnerships(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('reaction', 'nudge')),
  emoji text not null,
  message text,
  target_todo_id text,
  target_todo_user_id uuid references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'delivered', 'read')),
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz,
  constraint no_self_interact check (sender_id != receiver_id)
);

create index idx_partner_interactions_receiver_pending
  on public.partner_interactions(receiver_id) where status in ('pending', 'delivered');

create index idx_partner_interactions_target_todo
  on public.partner_interactions(target_todo_id, target_todo_user_id) where type = 'reaction';

-- 2. RLS
alter table public.partner_interactions enable row level security;

create policy "Senders can read own interactions"
  on public.partner_interactions for select
  using (sender_id = auth.uid());

create policy "Receivers can read interactions sent to them"
  on public.partner_interactions for select
  using (receiver_id = auth.uid());

create policy "Receivers can update interaction status"
  on public.partner_interactions for update
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- 3. RPC: send_reaction
create or replace function send_reaction(
  p_target_todo_id text,
  p_emoji text
)
returns jsonb as $$
declare
  v_partnership record;
  v_receiver_id uuid;
  v_target_user_id uuid;
begin
  -- Find active partnership
  select * into v_partnership
  from public.partnerships
  where status = 'active'
    and (inviter_id = auth.uid() or invitee_id = auth.uid())
  limit 1;

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

-- 4. RPC: send_nudge
create or replace function send_nudge(
  p_emoji text,
  p_message text
)
returns jsonb as $$
declare
  v_partnership record;
  v_receiver_id uuid;
begin
  -- Find active partnership
  select * into v_partnership
  from public.partnerships
  where status = 'active'
    and (inviter_id = auth.uid() or invitee_id = auth.uid())
  limit 1;

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

-- 5. Enable Realtime
alter publication supabase_realtime add table public.partner_interactions;
