-- Enable realtime on assigned_tasks for instant delivery notifications
alter publication supabase_realtime add table public.assigned_tasks;
