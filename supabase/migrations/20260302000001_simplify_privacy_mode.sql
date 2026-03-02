-- ============================================
-- Simplify privacy mode: 3 modes → 2 (visible / private)
-- Removes 'open' and 'focus', adds 'visible'
-- ============================================

-- 1. Drop old check constraint first so we can write new values
alter table public.users drop constraint users_privacy_mode_check;

-- 2. Migrate existing data
update public.users set privacy_mode = 'visible' where privacy_mode = 'open';
update public.users set privacy_mode = 'private' where privacy_mode = 'focus';

-- 3. Add new check constraint
alter table public.users
  add constraint users_privacy_mode_check check (privacy_mode in ('visible', 'private'));

-- 3. Update default
alter table public.users alter column privacy_mode set default 'visible';

-- 4. Update set_privacy_mode() RPC to validate against new values
create or replace function set_privacy_mode(mode text)
returns void as $$
begin
  if mode not in ('visible', 'private') then
    raise exception 'Invalid privacy mode: %', mode;
  end if;

  update public.users
  set privacy_mode = mode
  where id = auth.uid();
end;
$$ language plpgsql security definer;
