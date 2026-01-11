import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Project, ProjectTask } from '@/types/project';

const STORAGE_KEY = 'daily_projects';

export const [ProjectProvider, useProjects] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [projects, setProjects] = useState<Project[]>([]);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  });

  const { mutate: saveProjects } = useMutation({
    mutationFn: async (projects: Project[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      return projects;
    },
    onSuccess: (projects) => {
      queryClient.setQueryData(['projects'], projects);
    }
  });

  useEffect(() => {
    if (projectsQuery.data) {
      setProjects(projectsQuery.data);
    }
  }, [projectsQuery.data]);

  const addProject = useCallback((name: string, description: string, color: string, icon: string, type: 'project' | 'goal' = 'project', deadline?: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      description,
      color,
      icon,
      type,
      deadline,
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    saveProjects(updated);
    return newProject.id;
  }, [projects, saveProjects]);

  const deleteProject = useCallback((id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveProjects(updated);
  }, [projects, saveProjects]);

  const updateProject = useCallback((id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'color' | 'icon' | 'type' | 'deadline'>>) => {
    const updated = projects.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    setProjects(updated);
    saveProjects(updated);
  }, [projects, saveProjects]);

  const addTask = useCallback((projectId: string, title: string) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        const maxOrder = p.tasks.length > 0
          ? Math.max(...p.tasks.map(t => t.order))
          : -1;
        const newTask: ProjectTask = {
          id: Date.now().toString(),
          title,
          completed: false,
          order: maxOrder + 1,
          createdAt: new Date().toISOString(),
        };
        return { ...p, tasks: [...p.tasks, newTask] };
      }
      return p;
    });
    setProjects(updated);
    saveProjects(updated);
  }, [projects, saveProjects]);

  const deleteTask = useCallback((projectId: string, taskId: string) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
      }
      return p;
    });
    setProjects(updated);
    saveProjects(updated);
  }, [projects, saveProjects]);

  const toggleTask = useCallback((projectId: string, taskId: string) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        const updatedTasks = p.tasks.map(t =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        const allCompleted = updatedTasks.every(t => t.completed) && updatedTasks.length > 0;
        return {
          ...p,
          tasks: updatedTasks,
          completedAt: allCompleted ? new Date().toISOString() : undefined
        };
      }
      return p;
    });
    setProjects(updated);
    saveProjects(updated);
  }, [projects, saveProjects]);

  const reorderTasks = useCallback((projectId: string, taskIds: string[]) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        const reorderedTasks = taskIds.map((id, index) => {
          const task = p.tasks.find(t => t.id === id);
          return task ? { ...task, order: index } : null;
        }).filter((t): t is ProjectTask => t !== null);
        return { ...p, tasks: reorderedTasks };
      }
      return p;
    });
    setProjects(updated);
    saveProjects(updated);
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
