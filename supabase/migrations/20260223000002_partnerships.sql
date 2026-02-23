-- ============================================
-- Phase 3: Partnerships + sharing preferences
-- ============================================

-- 1. Partnerships table
create table public.partnerships (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.users(id) on delete cascade,
  invitee_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'dissolved', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  dissolved_at timestamptz,

  -- Prevent duplicate active/pending partnerships between same pair
  constraint no_self_partnership check (inviter_id != invitee_id)
);

-- 2. Sharing preferences table
create table public.sharing_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  partnership_id uuid not null references public.partnerships(id) on delete cascade,
  share_todos boolean not null default true,
  share_events boolean not null default true,
  share_focus boolean not null default true,
  share_inbox boolean not null default false,
  share_water boolean not null default true,
  share_notes boolean not null default false,
  share_work_items boolean not null default false,
  share_later boolean not null default false,
  updated_at timestamptz not null default now(),

  unique(user_id, partnership_id)
);

-- 3. Indexes
create index idx_partnerships_inviter on public.partnerships(inviter_id) where status in ('pending', 'active');
create index idx_partnerships_invitee on public.partnerships(invitee_id) where status in ('pending', 'active');
create index idx_sharing_prefs_user on public.sharing_preferences(user_id);

-- 4. RPC: Request a partnership by partner code
create or replace function request_partnership(partner_code_input varchar(6))
returns json as $$
declare
  target_user_id uuid;
  target_name text;
  existing_partnership uuid;
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

  -- Check if requester already has an active or pending partnership
  select id into existing_partnership
  from public.partnerships
  where status in ('pending', 'active')
    and (inviter_id = auth.uid() or invitee_id = auth.uid());

  if existing_partnership is not null then
    return json_build_object('error', 'You already have an active or pending partnership');
  end if;

  -- Check if target already has an active or pending partnership
  select id into existing_partnership
  from public.partnerships
  where status in ('pending', 'active')
    and (inviter_id = target_user_id or invitee_id = target_user_id);

  if existing_partnership is not null then
    return json_build_object('error', 'This person already has an active or pending partnership');
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

-- 5. RPC: Respond to a partnership request (accept or decline)
create or replace function respond_to_partnership(
  partnership_id_input uuid,
  accept boolean
)
returns json as $$
declare
  p record;
begin
  -- Get the partnership (must be invitee and pending)
  select * into p
  from public.partnerships
  where id = partnership_id_input
    and invitee_id = auth.uid()
    and status = 'pending';

  if p is null then
    return json_build_object('error', 'Partnership request not found');
  end if;

  if accept then
    -- Accept: set active + create sharing preferences for both users
    update public.partnerships
    set status = 'active', responded_at = now()
    where id = partnership_id_input;

    insert into public.sharing_preferences (user_id, partnership_id)
    values
      (p.inviter_id, partnership_id_input),
      (p.invitee_id, partnership_id_input);

    return json_build_object('status', 'active');
  else
    -- Decline
    update public.partnerships
    set status = 'declined', responded_at = now()
    where id = partnership_id_input;

    return json_build_object('status', 'declined');
  end if;
end;
$$ language plpgsql security definer;

-- 6. RPC: Dissolve a partnership (either party can do this)
create or replace function dissolve_partnership(partnership_id_input uuid)
returns json as $$
declare
  p record;
begin
  select * into p
  from public.partnerships
  where id = partnership_id_input
    and status = 'active'
    and (inviter_id = auth.uid() or invitee_id = auth.uid());

  if p is null then
    return json_build_object('error', 'Active partnership not found');
  end if;

  update public.partnerships
  set status = 'dissolved', dissolved_at = now()
  where id = partnership_id_input;

  -- Remove sharing preferences
  delete from public.sharing_preferences
  where partnership_id = partnership_id_input;

  return json_build_object('status', 'dissolved');
end;
$$ language plpgsql security definer;

-- 7. RPC: Get current partnership status (active or pending)
create or replace function get_partnership_status()
returns json as $$
declare
  p record;
  partner_name text;
  partner_id uuid;
begin
  select * into p
  from public.partnerships
  where status in ('pending', 'active')
    and (inviter_id = auth.uid() or invitee_id = auth.uid())
  order by created_at desc
  limit 1;

  if p is null then
    return json_build_object('status', 'none');
  end if;

  -- Determine who the partner is
  if p.inviter_id = auth.uid() then
    partner_id := p.invitee_id;
  else
    partner_id := p.inviter_id;
  end if;

  select name into partner_name
  from public.users
  where id = partner_id;

  return json_build_object(
    'partnership_id', p.id,
    'status', p.status,
    'partner_name', partner_name,
    'partner_id', partner_id,
    'is_inviter', (p.inviter_id = auth.uid()),
    'created_at', p.created_at
  );
end;
$$ language plpgsql security definer;

-- 8. Row-Level Security
alter table public.partnerships enable row level security;
alter table public.sharing_preferences enable row level security;

-- Partnerships: users can read their own partnerships
create policy "Users can read own partnerships"
  on public.partnerships for select
  using (inviter_id = auth.uid() or invitee_id = auth.uid());

-- Sharing preferences: users can read their own + partner's (if active partnership)
create policy "Users can read own sharing prefs"
  on public.sharing_preferences for select
  using (user_id = auth.uid());

create policy "Users can read partner sharing prefs"
  on public.sharing_preferences for select
  using (
    exists (
      select 1 from public.partnerships p
      where p.id = partnership_id
        and p.status = 'active'
        and (p.inviter_id = auth.uid() or p.invitee_id = auth.uid())
    )
  );

-- Users can update their own sharing preferences
create policy "Users can update own sharing prefs"
  on public.sharing_preferences for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 9. Enable realtime on partnerships for live updates
alter publication supabase_realtime add table public.partnerships;
