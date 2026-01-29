import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserGreeting } from '@/components/home/UserGreeting';
import { HorizontalLeaderboard } from '@/components/leaderboard/HorizontalLeaderboard';
import { DailyTaskCard } from '@/components/tasks/DailyTaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  const { tasks, completions, loading, submitDayCompletion, getTaskCompletion, stats } = useDailyTasks();
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, CompletionStatus>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleStatusChange = (taskId: string, status: CompletionStatus) => {
    setSelectedStatuses(prev => ({
      ...prev,
      [taskId]: status,
    }));
  };

  const handleSubmitDay = async () => {
    const taskCompletions = Object.entries(selectedStatuses).map(([taskId, status]) => ({
      taskId,
      status,
    }));

    if (taskCompletions.length === 0) {
      return;
    }

    setSubmitting(true);
    const success = await submitDayCompletion(taskCompletions);
    if (success) {
      setSelectedStatuses({});
    }
    setSubmitting(false);
  };

  const pendingTasks = useMemo(() => {
    return tasks.filter(task => !getTaskCompletion(task.id));
  }, [tasks, getTaskCompletion]);

  const completedTasks = useMemo(() => {
    return tasks.filter(task => !!getTaskCompletion(task.id));
  }, [tasks, getTaskCompletion]);

  const allPendingHaveStatus = pendingTasks.every(task => selectedStatuses[task.id]);

  if (loading) {
    return (
      <AppLayout title="Início">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.completed}</div>
              {stats.total > 0 && (
                <Progress value={(stats.completed / stats.total) * 100} className="mt-2" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Não Concluídas</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.notCompleted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tarefas do Dia</h2>
                <Button
                  onClick={handleSubmitDay}
                  disabled={!allPendingHaveStatus || submitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Concluir o Dia
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingTasks.map(task => (
                  <DailyTaskCard
                    key={task.id}
                    task={task}
                    selectedStatus={selectedStatuses[task.id] || null}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          ) : tasks.length > 0 ? (
            /* All tasks completed for the day */
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center py-6">
                  <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
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
            <Card>
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
