import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TaskStatus = 'pending' | 'in_progress' | 'done';

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-status-pending text-status-pending-foreground hover:bg-status-pending/90',
  },
  in_progress: {
    label: 'Em Progresso',
    className: 'bg-status-progress text-status-progress-foreground hover:bg-status-progress/90',
  },
  done: {
    label: 'Concluída',
    className: 'bg-status-done text-status-done-foreground hover:bg-status-done/90',
  },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
