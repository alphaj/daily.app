import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Project, ProjectTask } from '@/types/project';

interface DbProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  type: string;
  deadline: string | null;
  created_at: string;
  completed_at: string | null;
}

interface DbProjectTask {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  order: number;
  created_at: string;
}

function mapDbProjectToProject(dbProject: DbProject, tasks: DbProjectTask[]): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description || '',
    color: dbProject.color,
    icon: dbProject.icon,
    type: dbProject.type as 'project' | 'goal',
    deadline: dbProject.deadline || undefined,
    createdAt: dbProject.created_at,
    completedAt: dbProject.completed_at || undefined,
    tasks: tasks
      .filter(t => t.project_id === dbProject.id)
      .map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        order: t.order,
        createdAt: t.created_at,
      }))
      .sort((a, b) => a.order - b.order),
  };
}

export const [ProjectProvider, useProjects] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  const projectsQuery = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const [projectsRes, tasksRes] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('project_tasks').select('*').eq('user_id', user.id),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const dbProjects = projectsRes.data as DbProject[];
      const dbTasks = tasksRes.data as DbProjectTask[];

      return dbProjects.map(p => mapDbProjectToProject(p, dbTasks));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (projectsQuery.data) {
      setProjects(projectsQuery.data);
    }
  }, [projectsQuery.data]);

  const addProject = useCallback(async (
    name: string,
    description: string,
    color: string,
    icon: string,
    type: 'project' | 'goal' = 'project',
    deadline?: string
  ) => {
    if (!user) return '';

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description,
        color,
        icon,
        type,
        deadline: deadline || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add project:', error);
      return '';
    }

    queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
    return data.id;
  }, [user, queryClient]);

  const deleteProject = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete project:', error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
  }, [user, queryClient]);

  const updateProject = useCallback(async (
    id: string,
    updates: Partial<Pick<Project, 'name' | 'description' | 'color' | 'icon' | 'type' | 'deadline'>>
  ) => {
    if (!user) return;

    const { error } = await supabase
      .from('projects')
      .update({
        name: updates.name,
        description: updates.description,
        color: updates.color,
        icon: updates.icon,
        type: updates.type,
        deadline: updates.deadline || null,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to update project:', error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
  }, [user, queryClient]);

  const addTask = useCallback(async (projectId: string, title: string) => {
    if (!user) return;

    // Get current max order
    const project = projects.find(p => p.id === projectId);
    const maxOrder = project?.tasks.length ? Math.max(...project.tasks.map(t => t.order)) : -1;

    const { error } = await supabase
      .from('project_tasks')
      .insert({
        project_id: projectId,
        user_id: user.id,
        title,
        order: maxOrder + 1,
      });

    if (error) {
      console.error('Failed to add task:', error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
  }, [user, projects, queryClient]);

  const deleteTask = useCallback(async (projectId: string, taskId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete task:', error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
  }, [user, queryClient]);

  const toggleTask = useCallback(async (projectId: string, taskId: string) => {
    if (!user) return;

    const project = projects.find(p => p.id === projectId);
    const task = project?.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;

    const { error } = await supabase
      .from('project_tasks')
      .update({ completed: newCompleted })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to toggle task:', error);
      return;
    }

    // Check if all tasks are now completed
    const updatedTasks = project!.tasks.map(t =>
      t.id === taskId ? { ...t, completed: newCompleted } : t
    );
    const allCompleted = updatedTasks.every(t => t.completed) && updatedTasks.length > 0;

    if (allCompleted) {
      await supabase
        .from('projects')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('projects')
        .update({ completed_at: null })
        .eq('id', projectId)
        .eq('user_id', user.id);
    }

    queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
  }, [user, projects, queryClient]);

  const reorderTasks = useCallback(async (projectId: string, taskIds: string[]) => {
    if (!user) return;

    const updates = taskIds.map((id, index) => ({
      id,
      order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('project_tasks')
        .update({ order: update.order })
        .eq('id', update.id)
        .eq('user_id', user.id);
    }

    queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
  }, [user, queryClient]);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  const getProjectProgress = useCallback((project: Project) => {
    if (project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(t => t.completed).length;
    return Math.round((completed / project.tasks.length) * 100);
  }, []);

  const activeProjects = useMemo(() =>
    projects.filter(p => !p.completedAt).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ), [projects]);

  const completedProjects = useMemo(() =>
    projects.filter(p => p.completedAt).sort((a, b) =>
      new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    ), [projects]);

  return {
    projects,
    activeProjects,
    completedProjects,
    isLoading: projectsQuery.isLoading,
    addProject,
    deleteProject,
    updateProject,
    addTask,
    deleteTask,
    toggleTask,
    reorderTasks,
    getProject,
    getProjectProgress,
  };
});
