import { useState, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserGreeting } from '@/components/home/UserGreeting';
import { HorizontalLeaderboard } from '@/components/leaderboard/HorizontalLeaderboard';
import { DailyTaskCard } from '@/components/tasks/DailyTaskCard';
import { PendencyWarning } from '@/components/tasks/PendencyWarning';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/godmode/KPICard';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useDailyTasks, CompletionStatus } from '@/hooks/useDailyTasks';
import { 
  Loader2, 
  Star, 
  CheckCircle2, 
  XCircle,
  Target,
  ChevronDown,
  ClipboardList
} from 'lucide-react';

export default function UserHomePage() {
  const { 
    tasks, 
    completions, 
    loading, 
    submitDayCompletion, 
    getTaskCompletion, 
    stats,
    hasPendingDays,
    pendingFromPreviousDays 
  } = useDailyTasks();
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, CompletionStatus>>({});

  const handleStatusChange = (taskId: string, status: CompletionStatus) => {
    setSelectedStatuses(prev => ({
      ...prev,
      [taskId]: status,
    }));
  };

  const handleFinalizeTask = useCallback(async (taskId: string, status: CompletionStatus) => {
    const success = await submitDayCompletion([{ taskId, status }]);
    if (success) {
      setSelectedStatuses(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
    }
  }, [submitDayCompletion]);

  const handleFinalizePendingTasks = useCallback(async (
    taskCompletions: { taskId: string; status: CompletionStatus; date: string }[]
  ) => {
    // Group by date and submit each group
    const groupedByDate = taskCompletions.reduce((acc, curr) => {
      if (!acc[curr.date]) acc[curr.date] = [];
      acc[curr.date].push({ taskId: curr.taskId, status: curr.status });
      return acc;
    }, {} as Record<string, { taskId: string; status: CompletionStatus }[]>);

    for (const [date, tasks] of Object.entries(groupedByDate)) {
      await submitDayCompletion(tasks, date);
    }
    return true;
  }, [submitDayCompletion]);

  const pendingTasks = useMemo(() => {
    return tasks.filter(task => !getTaskCompletion(task.id));
  }, [tasks, getTaskCompletion]);

  const completedTasks = useMemo(() => {
    return tasks.filter(task => !!getTaskCompletion(task.id));
  }, [tasks, getTaskCompletion]);

  if (loading) {
    return (
      <AppLayout title="Início">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // If user has pending days, show the warning and block the task panel
  if (hasPendingDays && pendingFromPreviousDays.length > 0) {
    return (
      <AppLayout title="Início">
        <div className="space-y-6">
          <UserGreeting />
          
          <PendencyWarning 
            pendingTasks={pendingFromPreviousDays}
            onFinalizeTasks={handleFinalizePendingTasks}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Início">
      <div className="space-y-6">
        {/* Greeting with date and time */}
        <UserGreeting />

        {/* Horizontal Leaderboard */}
        <HorizontalLeaderboard />

        {/* Stats Cards - Premium KPI Style */}
        <div className="grid gap-4 md:grid-cols-4">
          <KPICard
            title="Total de Tarefas"
            value={stats.total}
            icon={Target}
            variant="default"
            size="sm"
          />
          <KPICard
            title="Concluídas"
            value={stats.completed}
            subtitle={stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% do total` : undefined}
            icon={CheckCircle2}
            variant="success"
            size="sm"
          />
          <KPICard
            title="Não Concluídas"
            value={stats.notCompleted}
            icon={XCircle}
            variant="danger"
            size="sm"
          />
          <KPICard
            title="Pendentes"
            value={stats.pending}
            icon={Star}
            variant="warning"
            size="sm"
          />
        </div>

        {/* Tasks Section */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Tarefas do Dia</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingTasks.map(task => (
                  <DailyTaskCard
                    key={task.id}
                    task={task}
                    selectedStatus={selectedStatuses[task.id] || null}
                    onStatusChange={handleStatusChange}
                    onFinalize={handleFinalizeTask}
                  />
                ))}
              </div>
            </div>
          ) : tasks.length > 0 ? (
            /* All tasks completed for the day */
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="text-center py-6">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-primary mb-2">Dia Concluído!</h2>
                  <p className="text-muted-foreground mb-6">
                    Todas as suas {completedTasks.length} tarefas do dia foram registradas.
                  </p>
                  
                  {/* Review completed tasks */}
                  <Collapsible className="w-full max-w-2xl mx-auto">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Revisar Tarefas do Dia
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-6">
                      <div className="grid gap-4 md:grid-cols-2 text-left">
                        {completedTasks.map(task => (
                          <DailyTaskCard
                            key={task.id}
                            task={task}
                            completion={getTaskCompletion(task.id)}
                            selectedStatus={null}
                            onStatusChange={() => {}}
                            disabled
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* No tasks assigned */
            <Card className="border-muted">
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>Você não tem tarefas atribuídas.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
