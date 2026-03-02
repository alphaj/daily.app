-- ============================================
-- Fix: allow assigner to delete assigned tasks
--
-- deleteAssignedTask() was failing silently because:
-- 1. synced_todos RLS only allows deleting own rows (user_id = auth.uid())
--    but the assigner needs to delete the partner's row
-- 2. assigned_tasks has no DELETE RLS policy at all
--
-- Solution: security definer RPC that validates the caller is the
-- original assigner, then deletes from both tables.
-- ============================================

create or replace function delete_assigned_task(
  p_task_id text,
  p_partner_id uuid default null
)
returns jsonb as $$
declare
  v_task record;
begin
  -- Look up the assigned task and verify caller is the assigner
  select * into v_task
  from public.assigned_tasks
  where id = p_task_id
    and assigner_id = auth.uid();

  if v_task is null then
    return jsonb_build_object('error', 'Task not found or you are not the assigner');
  end if;

  -- Delete from synced_todos (the copy in the assignee's synced data)
  delete from public.synced_todos
  where id = p_task_id
    and user_id = v_task.assignee_id;

  -- Delete from assigned_tasks delivery queue
  delete from public.assigned_tasks
  where id = p_task_id
    and assigner_id = auth.uid();

  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;
