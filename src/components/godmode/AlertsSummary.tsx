import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellDot, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertsSummaryProps {
  totalAlerts: number;
  unreadAlerts: number;
}

export function AlertsSummary({ totalAlerts, unreadAlerts }: AlertsSummaryProps) {
  const readAlerts = totalAlerts - unreadAlerts;
  const unreadPercentage = totalAlerts > 0 ? Math.round((unreadAlerts / totalAlerts) * 100) : 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <BellDot className="h-5 w-5 text-violet-500" />
          </div>
          Resumo de Alertas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Não lidos</span>
              <span className="font-medium text-foreground">{unreadPercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
                style={{ width: `${unreadPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
              <div className="p-2 rounded-lg bg-rose-500/10">
                <XCircle className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-500">{unreadAlerts}</p>
                <p className="text-xs text-muted-foreground">Não lidos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{readAlerts}</p>
                <p className="text-xs text-muted-foreground">Lidos</p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span className="text-sm">Total de alertas</span>
            </div>
            <span className="text-lg font-bold text-foreground">{totalAlerts}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
