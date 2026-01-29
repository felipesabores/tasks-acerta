import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TaskStatusBadge } from './TaskStatusBadge';
import { CriticalityBadge } from './CriticalityBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, MoreVertical, Pencil, Trash2, Star, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task } from '@/hooks/useTasks';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'pending' | 'in_progress' | 'done') => void;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange, onClick }: TaskCardProps) {
  const { canEditTasks, canDeleteTasks } = useUserRole();
  const isCompleted = task.status === 'done';
  
  const assigneeName = task.assignee?.name || 'Não atribuído';
  const initials = assigneeName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click if clicking on dropdown
    if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
      return;
    }
    onClick(task);
  };

  return (
    <Card 
      className={cn(
        "group transition-all duration-200 cursor-pointer w-full max-w-full",
        isCompleted 
          ? "opacity-60 bg-muted/50" 
          : "hover:shadow-md hover:border-primary/20"
      )}
      onClick={handleCardClick}
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
          {(canEditTasks || canDeleteTasks) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild data-radix-dropdown-menu-trigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEditTasks && (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'pending'); }}>
                      Marcar como Pendente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'in_progress'); }}>
                      Marcar como Em Progresso
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, 'done'); }}>
                      Marcar como Concluída
                    </DropdownMenuItem>
                  </>
                )}
                {canDeleteTasks && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">{assigneeName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end max-w-full">
            {task.points > 0 && (
              <div className="flex items-center gap-1 text-primary">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-xs font-medium">{task.points}</span>
              </div>
            )}
            <CriticalityBadge criticality={task.criticality} />
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="whitespace-nowrap">{format(new Date(task.due_date), "dd MMM", { locale: ptBR })}</span>
              </div>
            )}
            <TaskStatusBadge status={task.status} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
