import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskStatusBadge } from './TaskStatusBadge';
import { CriticalityBadge } from './CriticalityBadge';
import { Task, ChecklistItem } from '@/hooks/useTasks';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  User, 
  Eye, 
  Check, 
  Star,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

export function TaskDetailModal({ 
  task, 
  open, 
  onOpenChange,
  onTaskUpdated 
}: TaskDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canEditTasks } = useUserRole();
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  const isCompleted = task?.status === 'done';
  const isAssignedToCurrentUser = task?.assignee?.user_id === user?.id;

  useEffect(() => {
    if (task && open) {
      fetchChecklistItems();
      setReviewMode(false);
    }
  }, [task, open]);

  const fetchChecklistItems = async () => {
    if (!task) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('task_checklist_items')
      .select('*')
      .eq('task_id', task.id)
      .order('position');

    if (error) {
      console.error('Error fetching checklist:', error);
    } else {
      setChecklistItems(data || []);
    }
    setLoading(false);
  };

  const handleCheckItem = async (itemId: string, checked: boolean) => {
    if (!user || (isCompleted && !reviewMode)) return;

    const { error } = await supabase
      .from('task_checklist_items')
      .update({
        is_completed: checked,
        completed_at: checked ? new Date().toISOString() : null,
        completed_by: checked ? user.id : null,
      })
      .eq('id', itemId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o item.',
        variant: 'destructive',
      });
    } else {
      setChecklistItems(items =>
        items.map(item =>
          item.id === itemId
            ? { ...item, is_completed: checked, completed_at: checked ? new Date().toISOString() : null }
            : item
        )
      );
    }
  };

  const handleCompleteTask = async () => {
    if (!task) return;

    setCompleting(true);
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', task.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir a tarefa.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Tarefa concluída!',
        description: `Você ganhou ${task.points || 0} pontos!`,
      });
      onTaskUpdated();
      onOpenChange(false);
    }
    setCompleting(false);
  };

  const allItemsChecked = checklistItems.length === 0 || checklistItems.every(item => item.is_completed);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className={cn(
              "text-xl",
              isCompleted && !reviewMode && "text-muted-foreground"
            )}>
              {task.title}
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              {task.points > 0 && (
                <div className="flex items-center gap-1 text-primary">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-semibold">{task.points}</span>
                </div>
              )}
              <TaskStatusBadge status={task.status} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meta info */}
          <div className="flex flex-wrap gap-3 text-sm">
            <CriticalityBadge criticality={task.criticality as 'low' | 'medium' | 'high' | 'critical'} />
            {task.is_mandatory && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>Obrigatória</span>
              </div>
            )}
            {task.due_date && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(task.due_date), "dd 'de' MMMM", { locale: ptBR })}</span>
              </div>
            )}
            {task.assignee && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{task.assignee.name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div className={cn(
              "text-sm",
              isCompleted && !reviewMode && "text-muted-foreground"
            )}>
              <p className="whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Checklist */}
          {checklistItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Checklist</h4>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    checklistItems.map(item => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                          item.is_completed && "bg-muted/50",
                          isCompleted && !reviewMode && "opacity-60"
                        )}
                      >
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={(checked) => handleCheckItem(item.id, checked as boolean)}
                          disabled={isCompleted && !reviewMode}
                        />
                        <span className={cn(
                          "flex-1 text-sm",
                          item.is_completed && "line-through text-muted-foreground"
                        )}>
                          {item.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Progress */}
          {checklistItems.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progresso</span>
                <span>
                  {checklistItems.filter(i => i.is_completed).length} / {checklistItems.length}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ 
                    width: `${(checklistItems.filter(i => i.is_completed).length / checklistItems.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {isCompleted ? (
              <Button
                variant={reviewMode ? "default" : "outline"}
                onClick={() => setReviewMode(!reviewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {reviewMode ? 'Sair da Revisão' : 'Revisar'}
              </Button>
            ) : (
              (isAssignedToCurrentUser || canEditTasks) && (
                <Button
                  onClick={handleCompleteTask}
                  disabled={!allItemsChecked || completing}
                  variant="default"
                  className="bg-primary hover:bg-primary/90"
                >
                  {completing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Concluir Tarefa
                </Button>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
