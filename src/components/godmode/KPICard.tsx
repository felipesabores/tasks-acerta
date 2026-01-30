import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: {
    card: 'bg-card border-border',
    icon: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
  },
  primary: {
    card: 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20',
    icon: 'bg-primary/20 text-primary',
    value: 'text-primary',
  },
  success: {
    card: 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20',
    icon: 'bg-emerald-500/20 text-emerald-500',
    value: 'text-emerald-500',
  },
  warning: {
    card: 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20',
    icon: 'bg-amber-500/20 text-amber-500',
    value: 'text-amber-500',
  },
  danger: {
    card: 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20',
    icon: 'bg-rose-500/20 text-rose-500',
    value: 'text-rose-500',
  },
};

const sizeStyles = {
  sm: {
    padding: 'p-4',
    iconSize: 'h-8 w-8',
    iconInner: 'h-4 w-4',
    valueSize: 'text-2xl',
    titleSize: 'text-xs',
  },
  md: {
    padding: 'p-5',
    iconSize: 'h-10 w-10',
    iconInner: 'h-5 w-5',
    valueSize: 'text-3xl',
    titleSize: 'text-sm',
  },
  lg: {
    padding: 'p-6',
    iconSize: 'h-12 w-12',
    iconInner: 'h-6 w-6',
    valueSize: 'text-4xl',
    titleSize: 'text-sm',
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  size = 'md',
}: KPICardProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md',
        styles.card,
        sizes.padding
      )}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg className="w-full h-full">
          <pattern id={`grid-${title}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#grid-${title})`} />
        </svg>
      </div>

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn('font-medium text-muted-foreground uppercase tracking-wider', sizes.titleSize)}>
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={cn('font-bold tracking-tight', styles.value, sizes.valueSize)}>
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded-full',
                  trend.isPositive
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-rose-500/10 text-rose-500'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn('rounded-lg flex items-center justify-center', styles.icon, sizes.iconSize)}>
          <Icon className={sizes.iconInner} />
        </div>
      </div>
    </div>
  );
}
