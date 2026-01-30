import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  actions?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    gradient: 'from-muted/50 via-muted/25 to-transparent',
    border: 'border-border',
  },
  primary: {
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
    gradient: 'from-primary/10 via-primary/5 to-transparent',
    border: 'border-primary/20',
  },
  success: {
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-500',
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/20',
  },
  warning: {
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-500',
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    border: 'border-amber-500/20',
  },
};

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  variant = 'default',
  actions,
  className,
}: PageHeaderProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-6 transition-all duration-300',
        `bg-gradient-to-r ${styles.gradient}`,
        styles.border,
        className
      )}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <svg className="w-full h-full">
          <pattern id="header-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#header-grid)" />
        </svg>
      </div>

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div
              className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center shadow-sm',
                styles.iconBg
              )}
            >
              <Icon className={cn('h-6 w-6', styles.iconColor)} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
