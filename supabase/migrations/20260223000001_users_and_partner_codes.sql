-- ============================================
-- Phase 0: Users table + partner code generation
-- ============================================

-- 1. Create users table (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  partner_code varchar(6) unique not null,
  onboarded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2. Partner code generation function
-- Uses chars: 2-9, A-Z minus I/L/O = 23 letters + 8 digits = 31 chars
-- 31^6 = ~887 million unique codes
create or replace function generate_partner_code()
returns varchar(6) as $$
declare
  chars text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  code varchar(6);
  i int;
  attempts int := 0;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;

    -- Check uniqueness
    if not exists (select 1 from public.users where partner_code = code) then
      return code;
    end if;

    attempts := attempts + 1;
    if attempts > 100 then
      raise exception 'Could not generate unique partner code after 100 attempts';
    end if;
  end loop;
end;
$$ language plpgsql;

-- 3. RPC to create user profile after signup
-- Called from the app after auth.signUp() succeeds
create or replace function create_user_profile(user_name text)
returns table(partner_code varchar(6)) as $$
declare
  new_code varchar(6);
  user_email text;
begin
  -- Get email from auth.users
  select au.email into user_email
  from auth.users au
  where au.id = auth.uid();

  if user_email is null then
    raise exception 'Not authenticated';
  end if;

  -- Generate unique code
  new_code := generate_partner_code();

  -- Insert profile
  insert into public.users (id, name, email, partner_code)
  values (auth.uid(), user_name, user_email, new_code);

  return query select new_code;
end;
$$ language plpgsql security definer;

-- 4. RPC to regenerate partner code
create or replace function regenerate_partner_code()
returns table(partner_code varchar(6)) as $$
declare
  new_code varchar(6);
begin
  new_code := generate_partner_code();

  update public.users
  set partner_code = new_code
  where id = auth.uid();

  if not found then
    raise exception 'User profile not found';
  end if;

  return query select new_code;
end;
$$ language plpgsql security definer;

-- 5. RPC to look up a user by partner code (for partnership requests)
create or replace function lookup_partner_code(code varchar(6))
returns table(user_id uuid, user_name text) as $$
begin
  return query
  select u.id, u.name
  from public.users u
  where u.partner_code = upper(code)
    and u.id != auth.uid();  -- Can't partner with yourself
end;
$$ language plpgsql security definer;

-- 6. Row-Level Security
alter table public.users enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.users for select
  using (id = auth.uid());

-- Users can update their own profile (name only, code via RPC)
create policy "Users can update own profile"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Allow reading partner's name via partner code lookup (handled by security definer RPC)
-- No direct insert policy — handled by create_user_profile RPC (security definer)

-- 7. Index for fast partner code lookups
create index idx_users_partner_code on public.users(partner_code);
