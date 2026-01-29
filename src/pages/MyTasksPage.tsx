import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';
import { CriticalityBadge } from '@/components/tasks/CriticalityBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTasks, Task } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, 
  Star, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MyTasksPage() {
  const { user } = useAuth();
  const { tasks, profiles, loading, refetch } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Get current user's profile
  const currentProfile = profiles.find(p => p.user_id === user?.id);

  // Filter tasks assigned to current user
  const myTasks = useMemo(() => {
    if (!currentProfile) return [];
    return tasks.filter(task => task.assigned_to === currentProfile.id);
  }, [tasks, currentProfile]);

  const stats = useMemo(() => {
    const total = myTasks.length;
    const completed = myTasks.filter(t => t.status === 'done').length;
    const pending = myTasks.filter(t => t.status === 'pending').length;
    const inProgress = myTasks.filter(t => t.status === 'in_progress').length;
    const totalPoints = myTasks
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + (t.points || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, inProgress, totalPoints, completionRate };
  }, [myTasks]);

  const handleCardClick = (task: Task) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
  };

  if (loading) {
    return (
      <AppLayout title="Minhas Tarefas">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Minhas Tarefas">
      <div className="space-y-6">
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
              <div className="text-2xl font-bold">{stats.completed}</div>
              <Progress value={stats.completionRate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress + stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontos Ganhos</CardTitle>
              <Star className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPoints}</div>
            </CardContent>
          </Card>
        </div>

        {/* Task Cards */}
        {myTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Você não tem tarefas atribuídas.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myTasks.map(task => {
              const isCompleted = task.status === 'done';
              
              return (
                <Card
                  key={task.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    isCompleted 
                      ? "opacity-60 bg-muted/50" 
                      : "hover:shadow-md hover:border-primary/20"
                  )}
                  onClick={() => handleCardClick(task)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            "font-semibold truncate",
                            isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                          )}>
                            {task.title}
                          </h3>
                          {task.is_mandatory && (
                            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      {task.points > 0 && (
                        <div className="flex items-center gap-1 text-primary">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-semibold">{task.points}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <CriticalityBadge criticality={task.criticality} />
                      <TaskStatusBadge status={task.status} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <TaskDetailModal
          task={selectedTask}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          onTaskUpdated={refetch}
        />
      </div>
    </AppLayout>
  );
}
