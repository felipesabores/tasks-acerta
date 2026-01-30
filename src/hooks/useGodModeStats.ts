import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export type DateRange = {
  from: Date;
  to: Date;
};

export type PeriodPreset = 'today' | 'yesterday' | 'last7days' | 'last15days' | 'lastMonth' | 'lastYear' | 'custom';

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  done: number;
  completionRate: number;
  avgCompletionTime: number;
}

interface AdvancedKPIs {
  totalPoints: number;
  avgPointsPerUser: number;
  topPerformerName: string;
  topPerformerPoints: number;
  worstPerformerName: string;
  worstPerformerRate: number;
  tasksPerUser: number;
  alertsPerUser: number;
  engagementRate: number;
  criticalTasksCount: number;
  overdueEstimate: number;
}

interface UserPerformance {
  profileId: string;
  name: string;
  totalPoints: number;
  tasksCompleted: number;
  tasksNotCompleted: number;
  tasksNoDemand: number;
  completionRate: number;
  trend: number;
}

interface DailyMetric {
  date: string;
  completed: number;
  notCompleted: number;
  noDemand: number;
  total: number;
}

interface CriticalityBreakdown {
  criticality: string;
  count: number;
  points: number;
}

interface GodModeData {
  taskStats: TaskStats;
  advancedKPIs: AdvancedKPIs;
  userPerformances: UserPerformance[];
  dailyMetrics: DailyMetric[];
  criticalityBreakdown: CriticalityBreakdown[];
  totalUsers: number;
  activeUsers: number;
  totalAlerts: number;
  unreadAlerts: number;
}

export function useGodModeStats(dateRange: DateRange) {
  const [data, setData] = useState<GodModeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize date strings to prevent unnecessary re-fetches
  const fromDateStr = useMemo(() => format(startOfDay(dateRange.from), 'yyyy-MM-dd'), [dateRange.from.getTime()]);
  const toDateStr = useMemo(() => format(endOfDay(dateRange.to), 'yyyy-MM-dd'), [dateRange.to.getTime()]);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      setLoading(true);
      setError(null);
      setLoading(true);
      setError(null);

      try {
        // Fetch all data in parallel
        const [
          tasksResult,
          dailyCompletionsResult,
          userPointsResult,
          profilesResult,
          alertsResult,
          criticalityResult,
        ] = await Promise.all([
          supabase
            .from('tasks')
            .select('id, status, criticality, points, created_at, updated_at'),
          supabase
            .from('daily_task_completions')
            .select('*')
            .gte('completion_date', fromDateStr)
            .lte('completion_date', toDateStr),
          supabase
            .from('user_points')
            .select('*, profiles!inner(id, name)'),
          supabase
            .from('profiles')
            .select('id, name, created_at'),
          supabase
            .from('admin_alerts')
            .select('id, is_read, created_at')
            .gte('alert_date', fromDateStr)
            .lte('alert_date', toDateStr),
          supabase
            .from('criticality_points')
            .select('*'),
        ]);

        if (tasksResult.error) throw tasksResult.error;
        if (dailyCompletionsResult.error) throw dailyCompletionsResult.error;
        if (userPointsResult.error) throw userPointsResult.error;
        if (profilesResult.error) throw profilesResult.error;
        if (alertsResult.error) throw alertsResult.error;
        if (criticalityResult.error) throw criticalityResult.error;

        const tasks = tasksResult.data || [];
        const completions = dailyCompletionsResult.data || [];
        const userPoints = userPointsResult.data || [];
        const profiles = profilesResult.data || [];
        const alerts = alertsResult.data || [];

        // Calculate task stats
        const taskStats: TaskStats = {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending').length,
          inProgress: tasks.filter(t => t.status === 'in_progress').length,
          done: tasks.filter(t => t.status === 'done').length,
          completionRate: tasks.length > 0 
            ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
            : 0,
          avgCompletionTime: 0, // Would need more data to calculate
        };

        // Calculate user performances
        const userPerformances: UserPerformance[] = userPoints.map((up: any) => ({
          profileId: up.profile_id,
          name: up.profiles?.name || 'Unknown',
          totalPoints: up.total_points,
          tasksCompleted: up.tasks_completed,
          tasksNotCompleted: up.tasks_not_completed,
          tasksNoDemand: up.tasks_no_demand,
          completionRate: up.tasks_completed + up.tasks_not_completed > 0
            ? Math.round((up.tasks_completed / (up.tasks_completed + up.tasks_not_completed)) * 100)
            : 0,
          trend: Math.floor(Math.random() * 20) - 10, // Placeholder for trend calculation
        }));

        // Calculate daily metrics
        const dailyMap = new Map<string, DailyMetric>();
        completions.forEach((c: any) => {
          const date = c.completion_date;
          const existing = dailyMap.get(date) || { date, completed: 0, notCompleted: 0, noDemand: 0, total: 0 };
          
          if (c.status === 'completed') existing.completed++;
          else if (c.status === 'not_completed') existing.notCompleted++;
          else if (c.status === 'no_demand') existing.noDemand++;
          
          existing.total++;
          dailyMap.set(date, existing);
        });
        const dailyMetrics = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        // Calculate criticality breakdown
        const criticalityMap = new Map<string, CriticalityBreakdown>();
        tasks.forEach((t: any) => {
          const crit = t.criticality || 'medium';
          const existing = criticalityMap.get(crit) || { criticality: crit, count: 0, points: 0 };
          existing.count++;
          existing.points += t.points || 0;
          criticalityMap.set(crit, existing);
        });
        const criticalityBreakdown = Array.from(criticalityMap.values());

        // Calculate user metrics
        const activeUserIds = new Set(completions.map((c: any) => c.profile_id));
        const sortedUserPerformances = userPerformances.sort((a, b) => b.totalPoints - a.totalPoints);

        // Calculate advanced KPIs
        const totalPoints = userPoints.reduce((sum: number, up: any) => sum + (up.total_points || 0), 0);
        const avgPointsPerUser = profiles.length > 0 ? Math.round(totalPoints / profiles.length) : 0;
        
        const topPerformer = sortedUserPerformances[0];
        const worstPerformer = [...userPerformances].sort((a, b) => a.completionRate - b.completionRate)[0];
        
        const criticalTasks = tasks.filter((t: any) => t.criticality === 'critical' || t.criticality === 'high');
        const pendingCritical = criticalTasks.filter((t: any) => t.status !== 'done').length;
        
        const advancedKPIs: AdvancedKPIs = {
          totalPoints,
          avgPointsPerUser,
          topPerformerName: topPerformer?.name || 'N/A',
          topPerformerPoints: topPerformer?.totalPoints || 0,
          worstPerformerName: worstPerformer?.name || 'N/A',
          worstPerformerRate: worstPerformer?.completionRate || 0,
          tasksPerUser: profiles.length > 0 ? Math.round((tasks.length / profiles.length) * 10) / 10 : 0,
          alertsPerUser: profiles.length > 0 ? Math.round((alerts.length / profiles.length) * 10) / 10 : 0,
          engagementRate: profiles.length > 0 ? Math.round((activeUserIds.size / profiles.length) * 100) : 0,
          criticalTasksCount: criticalTasks.length,
          overdueEstimate: pendingCritical,
        };

        if (isMounted) {
          setData({
            taskStats,
            advancedKPIs,
            userPerformances: sortedUserPerformances,
            dailyMetrics,
            criticalityBreakdown,
            totalUsers: profiles.length,
            activeUsers: activeUserIds.size,
            totalAlerts: alerts.length,
            unreadAlerts: alerts.filter((a: any) => !a.is_read).length,
          });
        }
      } catch (err: any) {
        console.error('Error fetching god mode stats:', err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [fromDateStr, toDateStr]);

  return { data, loading, error };
}

export function getDateRangeFromPreset(preset: PeriodPreset): DateRange {
  const today = new Date();
  
  switch (preset) {
    case 'today':
      return { from: startOfDay(today), to: endOfDay(today) };
    case 'yesterday':
      const yesterday = subDays(today, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    case 'last7days':
      return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
    case 'last15days':
      return { from: startOfDay(subDays(today, 14)), to: endOfDay(today) };
    case 'lastMonth':
      return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
    case 'lastYear':
      return { from: startOfDay(subDays(today, 364)), to: endOfDay(today) };
    default:
      return { from: startOfDay(today), to: endOfDay(today) };
  }
}
