import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
}

export interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'done';
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  is_mandatory: boolean;
  points: number;
  assignee?: Profile | null;
  checklist_items?: ChecklistItem[];
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'done';
  assignedToId: string;
  dueDate?: Date;
  criticality?: 'low' | 'medium' | 'high' | 'critical';
  isMandatory?: boolean;
  points?: number;
  checklistItems?: string[];
}

export function useTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    setProfiles(data || []);
  }, []);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Erro ao carregar tarefas',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Cast criticality to the correct type
    const typedData = (data || []).map(task => ({
      ...task,
      criticality: (task.criticality || 'medium') as 'low' | 'medium' | 'high' | 'critical',
    }));

    setTasks(typedData);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchTasks();
    }
  }, [user, fetchProfiles, fetchTasks]);

  const addTask = useCallback(async (data: TaskFormData) => {
    if (!user) return;

    const { data: taskData, error } = await supabase.from('tasks').insert({
      title: data.title,
      description: data.description || null,
      status: data.status,
      assigned_to: data.assignedToId || null,
      created_by: user.id,
      due_date: data.dueDate?.toISOString() || null,
      criticality: data.criticality || 'medium',
      is_mandatory: data.isMandatory || false,
      points: data.points || 0,
    }).select().single();

    if (error) {
      toast({
        title: 'Erro ao criar tarefa',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Add checklist items if provided
    if (data.checklistItems && data.checklistItems.length > 0 && taskData) {
      const checklistInserts = data.checklistItems.map((title, index) => ({
        task_id: taskData.id,
        title,
        position: index,
      }));

      const { error: checklistError } = await supabase
        .from('task_checklist_items')
        .insert(checklistInserts);

      if (checklistError) {
        console.error('Error adding checklist items:', checklistError);
      }
    }

    fetchTasks();
  }, [user, fetchTasks, toast]);

  const updateTask = useCallback(async (id: string, data: Partial<TaskFormData>) => {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assignedToId !== undefined) updateData.assigned_to = data.assignedToId || null;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate?.toISOString() || null;
    if (data.criticality !== undefined) updateData.criticality = data.criticality;
    if (data.isMandatory !== undefined) updateData.is_mandatory = data.isMandatory;
    if (data.points !== undefined) updateData.points = data.points;

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao atualizar tarefa',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Update checklist items if provided
    if (data.checklistItems !== undefined) {
      // Delete existing items
      await supabase
        .from('task_checklist_items')
        .delete()
        .eq('task_id', id);

      // Insert new items
      if (data.checklistItems.length > 0) {
        const checklistInserts = data.checklistItems.map((title, index) => ({
          task_id: id,
          title,
          position: index,
        }));

        await supabase
          .from('task_checklist_items')
          .insert(checklistInserts);
      }
    }

    fetchTasks();
  }, [fetchTasks, toast]);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao excluir tarefa',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    fetchTasks();
  }, [fetchTasks, toast]);

  const updateTaskStatus = useCallback(async (id: string, status: 'pending' | 'in_progress' | 'done') => {
    await updateTask(id, { status });
  }, [updateTask]);

  const getStats = useCallback(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, pending, inProgress, done, completionRate };
  }, [tasks]);

  const getStatsByUser = useCallback(() => {
    return profiles.map(profile => {
      const userTasks = tasks.filter(t => t.assigned_to === profile.id);
      const done = userTasks.filter(t => t.status === 'done').length;
      const total = userTasks.length;
      const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        user: { id: profile.id, name: profile.name },
        total,
        done,
        pending: userTasks.filter(t => t.status === 'pending').length,
        inProgress: userTasks.filter(t => t.status === 'in_progress').length,
        completionRate,
      };
    });
  }, [tasks, profiles]);

  return {
    tasks,
    users: profiles.map(p => ({ id: p.id, name: p.name })),
    profiles,
    loading,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    getStats,
    getStatsByUser,
    refetch: fetchTasks,
  };
}
