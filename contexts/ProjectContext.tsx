import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Project, ProjectTask } from '@/types/project';

const PROJECTS_STORAGE_KEY = 'daily_projects';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const [ProjectProvider, useProjects] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [projects, setProjects] = useState<Project[]>([]);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PROJECTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  useEffect(() => {
    if (projectsQuery.data) {
      setProjects(projectsQuery.data);
    }
  }, [projectsQuery.data]);

  const saveProjects = useCallback(async (newProjects: Project[]) => {
    await AsyncStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(newProjects));
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  }, [queryClient]);

  const addProject = useCallback(async (
    name: string,
    description: string,
    color: string,
    icon: string,
    type: 'project' | 'goal' = 'project',
    deadline?: string
  ) => {
    const newProject: Project = {
      id: generateId(),
      name,
      description,
      color,
      icon,
      type,
      deadline,
      createdAt: new Date().toISOString(),
      tasks: [],
    };

    const newProjects = [...projects, newProject];
    setProjects(newProjects);
    await saveProjects(newProjects);
    return newProject.id;
  }, [projects, saveProjects]);

  const deleteProject = useCallback(async (id: string) => {
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    await saveProjects(newProjects);
  }, [projects, saveProjects]);

  const updateProject = useCallback(async (
    id: string,
    updates: Partial<Pick<Project, 'name' | 'description' | 'color' | 'icon' | 'type' | 'deadline'>>
  ) => {
    const newProjects = projects.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    setProjects(newProjects);
    await saveProjects(newProjects);
  }, [projects, saveProjects]);

  const addTask = useCallback(async (projectId: string, title: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const maxOrder = project.tasks.length ? Math.max(...project.tasks.map(t => t.order)) : -1;

    const newTask: ProjectTask = {
      id: generateId(),
      title,
      completed: false,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };

    const newProjects = projects.map(p =>
      p.id === projectId
        ? { ...p, tasks: [...p.tasks, newTask] }
        : p
    );

    setProjects(newProjects);
    await saveProjects(newProjects);
  }, [projects, saveProjects]);

  const deleteTask = useCallback(async (projectId: string, taskId: string) => {
    const newProjects = projects.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
        : p
    );

    setProjects(newProjects);
    await saveProjects(newProjects);
  }, [projects, saveProjects]);

  const toggleTask = useCallback(async (projectId: string, taskId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    const updatedTasks = project.tasks.map(t =>
      t.id === taskId ? { ...t, completed: newCompleted } : t
    );

    const allCompleted = updatedTasks.every(t => t.completed) && updatedTasks.length > 0;

    const newProjects = projects.map(p =>
      p.id === projectId
        ? {
            ...p,
            tasks: updatedTasks,
            completedAt: allCompleted ? new Date().toISOString() : undefined,
          }
        : p
    );

    setProjects(newProjects);
    await saveProjects(newProjects);
  }, [projects, saveProjects]);

  const reorderTasks = useCallback(async (projectId: string, taskIds: string[]) => {
    const newProjects = projects.map(p => {
      if (p.id !== projectId) return p;

      const reorderedTasks = taskIds.map((id, index) => {
        const task = p.tasks.find(t => t.id === id);
        return task ? { ...task, order: index } : null;
      }).filter(Boolean) as ProjectTask[];

      return { ...p, tasks: reorderedTasks };
    });

    setProjects(newProjects);
    await saveProjects(newProjects);
  }, [projects, saveProjects]);

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
