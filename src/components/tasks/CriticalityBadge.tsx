import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Criticality = 'low' | 'medium' | 'high' | 'critical';

interface CriticalityBadgeProps {
  criticality: Criticality;
  className?: string;
}

const criticalityConfig: Record<Criticality, { label: string; className: string }> = {
  low: {
    label: 'Baixa',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  medium: {
    label: 'Média',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  high: {
    label: 'Alta',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  critical: {
    label: 'Crítica',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
};

export function CriticalityBadge({ criticality, className }: CriticalityBadgeProps) {
  const config = criticalityConfig[criticality] || criticalityConfig.medium;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
