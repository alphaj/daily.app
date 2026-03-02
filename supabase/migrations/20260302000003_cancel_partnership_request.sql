-- Allow the inviter to cancel a pending partnership request
create or replace function cancel_partnership_request(partnership_id_input uuid)
returns json as $$
declare
  p record;
begin
  select * into p
  from public.partnerships
  where id = partnership_id_input
    and status = 'pending'
    and inviter_id = auth.uid();

  if p is null then
    return json_build_object('error', 'Pending request not found');
  end if;

  update public.partnerships
  set status = 'dissolved', dissolved_at = now()
  where id = partnership_id_input;

  return json_build_object('status', 'dissolved');
end;
$$ language plpgsql security definer;
