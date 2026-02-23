-- ============================================
-- Phase 6: Privacy mode on user profile
-- ============================================

-- 1. Add privacy_mode column to users
alter table public.users
  add column privacy_mode text not null default 'open'
  check (privacy_mode in ('open', 'focus', 'private'));

-- 2. RPC: Update privacy mode
create or replace function set_privacy_mode(mode text)
returns void as $$
begin
  if mode not in ('open', 'focus', 'private') then
    raise exception 'Invalid privacy mode: %', mode;
  end if;

  update public.users
  set privacy_mode = mode
  where id = auth.uid();
end;
$$ language plpgsql security definer;

-- 3. RPC: Get partner's privacy mode (for partner view screen)
create or replace function get_partner_privacy_mode(partner_user_id uuid)
returns text as $$
declare
  mode text;
begin
  -- Verify they are actually our active partner
  if not is_active_partner(partner_user_id) then
    return null;
  end if;

  select privacy_mode into mode
  from public.users
  where id = partner_user_id;

  return mode;
end;
$$ language plpgsql security definer stable;
