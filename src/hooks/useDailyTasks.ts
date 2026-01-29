import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Task, Profile } from '@/hooks/useTasks';

export type CompletionStatus = 'completed' | 'not_completed' | 'no_demand';

export interface DailyTaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  profile_id: string;
  completion_date: string;
  status: CompletionStatus;
  points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface UserPoints {
  id: string;
  profile_id: string;
  total_points: number;
  tasks_completed: number;
  tasks_not_completed: number;
  tasks_no_demand: number;
  updated_at: string;
  profile?: Profile;
}

export function useDailyTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<DailyTaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  const fetchCurrentProfile = useCallback(async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    setCurrentProfile(data);
    return data;
  }, [user]);

  const fetchMyTasks = useCallback(async (profileId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(*)
      `)
      .eq('assigned_to', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Erro ao carregar tarefas',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }

    return (data || []).map(task => ({
      ...task,
      criticality: (task.criticality || 'medium') as 'low' | 'medium' | 'high' | 'critical',
    }));
  }, [toast]);

  const fetchTodayCompletions = useCallback(async (profileId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_task_completions')
      .select('*')
      .eq('profile_id', profileId)
      .eq('completion_date', today);

    if (error) {
      console.error('Error fetching completions:', error);
      return [];
    }

    return data || [];
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const profile = await fetchCurrentProfile();
    
    if (profile) {
      const [tasksData, completionsData] = await Promise.all([
        fetchMyTasks(profile.id),
        fetchTodayCompletions(profile.id),
      ]);
      
      setTasks(tasksData);
      setCompletions(completionsData as DailyTaskCompletion[]);
    }
    
    setLoading(false);
  }, [user, fetchCurrentProfile, fetchMyTasks, fetchTodayCompletions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitDayCompletion = useCallback(async (taskCompletions: { taskId: string; status: CompletionStatus }[]) => {
    if (!user || !currentProfile) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para concluir o dia.',
        variant: 'destructive',
      });
      return false;
    }

    const today = new Date().toISOString().split('T')[0];
    
    const completionsToInsert = taskCompletions.map(tc => ({
      task_id: tc.taskId,
      user_id: user.id,
      profile_id: currentProfile.id,
      completion_date: today,
      status: tc.status,
    }));

    const { error } = await supabase
      .from('daily_task_completions')
      .upsert(completionsToInsert, { 
        onConflict: 'task_id,profile_id,completion_date',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error submitting completions:', error);
      toast({
        title: 'Erro ao concluir o dia',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    // Calculate points earned
    let totalPointsEarned = 0;
    taskCompletions.forEach(tc => {
      const task = tasks.find(t => t.id === tc.taskId);
      if (task) {
        if (tc.status === 'completed') {
          totalPointsEarned += task.points || 0;
        } else if (tc.status === 'not_completed') {
          totalPointsEarned -= task.points || 0;
        }
      }
    });

    toast({
      title: 'Dia concluído!',
      description: totalPointsEarned >= 0 
        ? `Você ganhou ${totalPointsEarned} pontos!`
        : `Você perdeu ${Math.abs(totalPointsEarned)} pontos.`,
    });

    await loadData();
    return true;
  }, [user, currentProfile, tasks, toast, loadData]);

  const getTaskCompletion = useCallback((taskId: string) => {
    return completions.find(c => c.task_id === taskId);
  }, [completions]);

  const stats = {
    total: tasks.length,
    completed: completions.filter(c => c.status === 'completed').length,
    notCompleted: completions.filter(c => c.status === 'not_completed').length,
    noDemand: completions.filter(c => c.status === 'no_demand').length,
    pending: tasks.length - completions.length,
  };

  return {
    tasks,
    completions,
    currentProfile,
    loading,
    submitDayCompletion,
    getTaskCompletion,
    stats,
    refetch: loadData,
  };
}
