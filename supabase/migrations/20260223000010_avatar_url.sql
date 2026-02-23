-- ============================================
-- Phase 10: Profile avatar support
-- ============================================

-- 1. Add avatar_url column to users
alter table public.users add column avatar_url text;

-- 2. Create avatars storage bucket (public, 2MB limit, jpeg/png/webp only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- 3. Storage RLS: anyone can read avatars
create policy "Anyone can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- 4. Storage RLS: users can upload to their own folder
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Storage RLS: users can update their own avatar
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. Storage RLS: users can delete their own avatar
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 7. Update get_partnership_status to include partner_avatar_url
create or replace function get_partnership_status()
returns json as $$
declare
  p record;
  partner_name text;
  partner_id uuid;
  partner_avatar text;
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

  select name, avatar_url into partner_name, partner_avatar
  from public.users
  where id = partner_id;

  return json_build_object(
    'partnership_id', p.id,
    'status', p.status,
    'partner_name', partner_name,
    'partner_id', partner_id,
    'is_inviter', (p.inviter_id = auth.uid()),
    'created_at', p.created_at,
    'partner_avatar_url', partner_avatar
  );
end;
$$ language plpgsql security definer;
