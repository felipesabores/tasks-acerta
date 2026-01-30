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

export interface PendingTaskFromPreviousDay {
  task_id: string;
  task_title: string;
  task_date: string;
  criticality: string;
  points: number;
  is_mandatory: boolean;
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
  const [pendingFromPreviousDays, setPendingFromPreviousDays] = useState<PendingTaskFromPreviousDay[]>([]);
  const [hasPendingDays, setHasPendingDays] = useState(false);
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

  const checkPendingFromPreviousDays = useCallback(async (profileId: string) => {
    // Check if user has pending tasks from previous days
    const { data: hasPending, error: hasPendingError } = await supabase
      .rpc('has_pending_tasks', { p_profile_id: profileId });

    if (hasPendingError) {
      console.error('Error checking pending tasks:', hasPendingError);
      return { hasPending: false, pendingTasks: [] };
    }

    if (hasPending) {
      // Get the pending tasks details
      const { data: pendingTasks, error: pendingError } = await supabase
        .rpc('get_pending_tasks_from_previous_days', { p_profile_id: profileId });

      if (pendingError) {
        console.error('Error fetching pending tasks:', pendingError);
        return { hasPending: true, pendingTasks: [] };
      }

      return { 
        hasPending: true, 
        pendingTasks: (pendingTasks || []).map((t: PendingTaskFromPreviousDay) => ({
          task_id: t.task_id,
          task_title: t.task_title,
          task_date: t.task_date,
          criticality: t.criticality,
          points: t.points,
          is_mandatory: t.is_mandatory,
        }))
      };
    }

    return { hasPending: false, pendingTasks: [] };
  }, []);

  const cloneTasksForToday = useCallback(async (profileId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Call the clone function
    const { error } = await supabase
      .rpc('clone_tasks_for_day', { 
        p_profile_id: profileId, 
        p_target_date: today 
      });

    if (error) {
      console.error('Error cloning tasks:', error);
    }
  }, []);

  const fetchMyTasks = useCallback(async (profileId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(*)
      `)
      .eq('assigned_to', profileId)
      .eq('task_date', today)
      .eq('is_template', false)
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
      is_mandatory: task.is_mandatory || false,
      is_template: task.is_template || false,
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
      // First check for pending days
      const { hasPending, pendingTasks } = await checkPendingFromPreviousDays(profile.id);
      setHasPendingDays(hasPending);
      setPendingFromPreviousDays(pendingTasks);

      // Clone tasks for today if needed
      await cloneTasksForToday(profile.id);

      // Then fetch today's tasks and completions
      const [tasksData, completionsData] = await Promise.all([
        fetchMyTasks(profile.id),
        fetchTodayCompletions(profile.id),
      ]);
      
      setTasks(tasksData);
      setCompletions(completionsData as DailyTaskCompletion[]);
    }
    
    setLoading(false);
  }, [user, fetchCurrentProfile, checkPendingFromPreviousDays, cloneTasksForToday, fetchMyTasks, fetchTodayCompletions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitDayCompletion = useCallback(async (
    taskCompletions: { taskId: string; status: CompletionStatus }[],
    forDate?: string
  ) => {
    if (!user || !currentProfile) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para concluir o dia.',
        variant: 'destructive',
      });
      return false;
    }

    const completionDate = forDate || new Date().toISOString().split('T')[0];
    
    const completionsToInsert = taskCompletions.map(tc => ({
      task_id: tc.taskId,
      user_id: user.id,
      profile_id: currentProfile.id,
      completion_date: completionDate,
      status: tc.status,
    }));

    const { data: insertedData, error } = await supabase
      .from('daily_task_completions')
      .upsert(completionsToInsert, { 
        onConflict: 'task_id,profile_id,completion_date',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error submitting completions:', error);
      toast({
        title: 'Erro ao concluir',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    // Optimistic update for completions
    if (insertedData) {
      setCompletions(prev => {
        const newCompletions = [...prev];
        insertedData.forEach((inserted: DailyTaskCompletion) => {
          const existingIndex = newCompletions.findIndex(
            c => c.task_id === inserted.task_id && c.completion_date === inserted.completion_date
          );
          if (existingIndex >= 0) {
            newCompletions[existingIndex] = inserted;
          } else {
            newCompletions.push(inserted);
          }
        });
        return newCompletions;
      });
    }

    // Calculate points earned
    let totalPointsEarned = 0;
    const allTasks = [...tasks, ...pendingFromPreviousDays.map(p => ({
      id: p.task_id,
      points: p.points,
    }))];
    
    taskCompletions.forEach(tc => {
      const task = allTasks.find(t => t.id === tc.taskId);
      if (task) {
        if (tc.status === 'completed') {
          totalPointsEarned += task.points || 0;
        } else if (tc.status === 'not_completed') {
          totalPointsEarned -= task.points || 0;
        }
      }
    });

    toast({
      title: 'Tarefa finalizada!',
      description: totalPointsEarned >= 0 
        ? `Você ganhou ${totalPointsEarned} pontos!`
        : `Você perdeu ${Math.abs(totalPointsEarned)} pontos.`,
    });

    // Reload data to refresh pending status
    await loadData();
    return true;
  }, [user, currentProfile, tasks, pendingFromPreviousDays, toast, loadData]);

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
    hasPendingDays,
    pendingFromPreviousDays,
    submitDayCompletion,
    getTaskCompletion,
    stats,
    refetch: loadData,
  };
}
