import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { PendingTaskFromPreviousDay, CompletionStatus } from '@/hooks/useDailyTasks';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendencyWarningProps {
  pendingTasks: PendingTaskFromPreviousDay[];
  onFinalizeTasks: (taskCompletions: { taskId: string; status: CompletionStatus; date: string }[]) => Promise<boolean>;
}

export function PendencyWarning({ pendingTasks, onFinalizeTasks }: PendencyWarningProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, CompletionStatus>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleStatusChange = (taskId: string, status: CompletionStatus) => {
    setSelectedStatuses(prev => ({
      ...prev,
      [taskId]: status,
    }));
  };

  const handleFinalizeAll = async () => {
    const completions = pendingTasks
      .filter(task => selectedStatuses[task.task_id])
      .map(task => ({
        taskId: task.task_id,
        status: selectedStatuses[task.task_id],
        date: task.task_date,
      }));

    if (completions.length === 0) return;

    setSubmitting(true);
    
    // Group by date and submit
    const groupedByDate = completions.reduce((acc, curr) => {
      if (!acc[curr.date]) acc[curr.date] = [];
      acc[curr.date].push({ taskId: curr.taskId, status: curr.status });
      return acc;
    }, {} as Record<string, { taskId: string; status: CompletionStatus }[]>);

    for (const [date, tasks] of Object.entries(groupedByDate)) {
      await onFinalizeTasks(tasks.map(t => ({ ...t, date })));
    }

    setSubmitting(false);
    setSelectedStatuses({});
  };

  const allHaveStatus = pendingTasks.every(task => selectedStatuses[task.task_id]);

  // Group tasks by date
  const tasksByDate = pendingTasks.reduce((acc, task) => {
    if (!acc[task.task_date]) acc[task.task_date] = [];
    acc[task.task_date].push(task);
    return acc;
  }, {} as Record<string, PendingTaskFromPreviousDay[]>);

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-600 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCriticalityLabel = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'Crítica';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return criticality;
    }
  };

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-destructive text-xl">
              Atenção: Você possui pendências
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              Para liberar seus pontos e voltar ao ranking, você precisa finalizar as tarefas dos dias anteriores.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(tasksByDate).map(([date, tasks]) => (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </div>
            <div className="grid gap-3">
              {tasks.map(task => (
                <div 
                  key={task.task_id} 
                  className="flex items-center gap-4 p-4 bg-background rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{task.task_title}</span>
                      {task.is_mandatory && (
                        <Badge variant="outline" className="text-xs">
                          Obrigatória
                        </Badge>
                      )}
                      <Badge className={getCriticalityColor(task.criticality)}>
                        {getCriticalityLabel(task.criticality)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {task.points} pts
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedStatuses[task.task_id] || ''}
                      onValueChange={(value) => handleStatusChange(task.task_id, value as CompletionStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Selecione status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Concluída
                          </div>
                        </SelectItem>
                        <SelectItem value="not_completed">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Não concluída
                          </div>
                        </SelectItem>
                        <SelectItem value="no_demand">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-600" />
                            Sem demanda
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleFinalizeAll}
            disabled={!allHaveStatus || submitting}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Regularizar Pendências ({pendingTasks.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
