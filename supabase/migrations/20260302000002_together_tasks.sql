-- ============================================
-- "Do Together" collaborative tasks
--
-- Both you and your buddy share a task and both must independently
-- mark it complete. Uses a together_group_id to link both copies.
-- ============================================

-- 1a. Add together columns to synced_todos
ALTER TABLE synced_todos ADD COLUMN IF NOT EXISTS is_together boolean DEFAULT false;
ALTER TABLE synced_todos ADD COLUMN IF NOT EXISTS together_group_id uuid DEFAULT NULL;
ALTER TABLE synced_todos ADD COLUMN IF NOT EXISTS together_partner_id uuid DEFAULT NULL;

-- 1b. Create together_tasks delivery table (mirrors assigned_tasks pattern)
CREATE TABLE IF NOT EXISTS public.together_tasks (
  id text PRIMARY KEY,
  together_group_id uuid NOT NULL,
  creator_id uuid NOT NULL REFERENCES auth.users(id),
  creator_name text NOT NULL,
  creator_avatar_url text,
  partner_id uuid NOT NULL REFERENCES auth.users(id),
  task_id text NOT NULL,
  title text NOT NULL,
  created_at text NOT NULL,
  due_date text NOT NULL,
  due_time text DEFAULT NULL,
  priority text DEFAULT NULL,
  is_work boolean DEFAULT false,
  emoji text DEFAULT NULL,
  emoji_color text DEFAULT NULL,
  estimated_minutes int DEFAULT NULL,
  time_of_day text DEFAULT NULL,
  repeat text DEFAULT NULL,
  subtasks jsonb DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
  delivered_at timestamptz DEFAULT NULL,
  inserted_at timestamptz DEFAULT now()
);

-- RLS for together_tasks
ALTER TABLE public.together_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner can view own together tasks"
  ON public.together_tasks FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partner can update own together tasks"
  ON public.together_tasks FOR UPDATE
  USING (partner_id = auth.uid());

-- 1c. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.together_tasks;

-- 1d. RPC to create a together task
CREATE OR REPLACE FUNCTION create_together_task(
  task_id text,
  task_title text,
  task_created_at text,
  task_due_date text,
  task_due_time text DEFAULT NULL,
  task_priority text DEFAULT NULL,
  task_is_work boolean DEFAULT false,
  task_emoji text DEFAULT NULL,
  task_emoji_color text DEFAULT NULL,
  task_estimated_minutes int DEFAULT NULL,
  task_time_of_day text DEFAULT NULL,
  task_repeat text DEFAULT NULL,
  task_subtasks jsonb DEFAULT NULL,
  p_partner_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_partnership record;
  v_creator_name text;
  v_creator_avatar_url text;
  v_partner_id uuid;
  v_creator_shares boolean;
  v_partner_shares boolean;
  v_together_group_id uuid;
BEGIN
  -- Generate together_group_id
  v_together_group_id := gen_random_uuid();

  -- Get caller's name and avatar
  SELECT name, avatar_url INTO v_creator_name, v_creator_avatar_url
  FROM public.users
  WHERE id = auth.uid();

  IF v_creator_name IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  -- Find active partnership
  IF p_partner_id IS NOT NULL THEN
    SELECT * INTO v_partnership
    FROM public.partnerships
    WHERE status = 'active'
      AND (
        (inviter_id = auth.uid() AND invitee_id = p_partner_id)
        OR (invitee_id = auth.uid() AND inviter_id = p_partner_id)
      );
  ELSE
    SELECT * INTO v_partnership
    FROM public.partnerships
    WHERE status = 'active'
      AND (inviter_id = auth.uid() OR invitee_id = auth.uid())
    LIMIT 1;
  END IF;

  IF v_partnership IS NULL THEN
    RETURN jsonb_build_object('error', 'No active partnership');
  END IF;

  -- Determine partner
  IF v_partnership.inviter_id = auth.uid() THEN
    v_partner_id := v_partnership.invitee_id;
  ELSE
    v_partner_id := v_partnership.inviter_id;
  END IF;

  -- Check both partners share todos
  SELECT share_todos INTO v_creator_shares
  FROM public.sharing_preferences
  WHERE user_id = auth.uid() AND partnership_id = v_partnership.id;

  SELECT share_todos INTO v_partner_shares
  FROM public.sharing_preferences
  WHERE user_id = v_partner_id AND partnership_id = v_partnership.id;

  IF NOT coalesce(v_creator_shares, false) THEN
    RETURN jsonb_build_object('error', 'You have todo sharing disabled');
  END IF;

  IF NOT coalesce(v_partner_shares, false) THEN
    RETURN jsonb_build_object('error', 'Your partner has todo sharing disabled');
  END IF;

  -- Upsert creator's synced_todos with together fields
  INSERT INTO public.synced_todos (
    id, user_id, title, completed, created_at, due_date, due_time,
    priority, is_work, emoji, emoji_color, estimated_minutes,
    time_of_day, repeat, subtasks, is_private,
    is_together, together_group_id, together_partner_id,
    synced_at
  ) VALUES (
    task_id, auth.uid(), task_title, false, task_created_at, task_due_date, task_due_time,
    task_priority, task_is_work, task_emoji, task_emoji_color, task_estimated_minutes,
    task_time_of_day, task_repeat, task_subtasks, false,
    true, v_together_group_id, v_partner_id,
    now()
  )
  ON CONFLICT (id, user_id) DO UPDATE SET
    is_together = true,
    together_group_id = v_together_group_id,
    together_partner_id = v_partner_id,
    synced_at = now();

  -- Insert into together_tasks delivery queue for partner
  INSERT INTO public.together_tasks (
    id, together_group_id, creator_id, creator_name, creator_avatar_url,
    partner_id, task_id, title, created_at,
    due_date, due_time, priority, is_work,
    emoji, emoji_color, estimated_minutes, time_of_day,
    repeat, subtasks
  ) VALUES (
    task_id, v_together_group_id, auth.uid(), v_creator_name, v_creator_avatar_url,
    v_partner_id, task_id, task_title, task_created_at,
    task_due_date, task_due_time, task_priority, task_is_work,
    task_emoji, task_emoji_color, task_estimated_minutes, task_time_of_day,
    task_repeat, task_subtasks
  );

  RETURN jsonb_build_object(
    'success', true,
    'together_group_id', v_together_group_id,
    'partner_id', v_partner_id,
    'creator_name', v_creator_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
