-- ============================================
-- Phase 7: Last-active tracking for presence
-- ============================================

-- 1. Add last_active_at column to users
alter table public.users
  add column last_active_at timestamptz not null default now();

-- 2. RPC: Update own last_active_at timestamp
create or replace function update_last_active()
returns void as $$
begin
  update public.users
  set last_active_at = now()
  where id = auth.uid();
end;
$$ language plpgsql security definer;

-- 3. RPC: Get partner's last_active_at (only if active partner)
create or replace function get_partner_last_active(partner_user_id uuid)
returns timestamptz as $$
declare
  ts timestamptz;
begin
  if not is_active_partner(partner_user_id) then
    return null;
  end if;

  select last_active_at into ts
  from public.users
  where id = partner_user_id;

  return ts;
end;
$$ language plpgsql security definer stable;
