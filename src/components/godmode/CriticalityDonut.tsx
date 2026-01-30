import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface CriticalityBreakdown {
  criticality: string;
  count: number;
  points: number;
}

interface CriticalityDonutProps {
  data: CriticalityBreakdown[];
}

const CRITICALITY_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: 'hsl(142, 71%, 45%)', label: 'Baixa' },
  medium: { color: 'hsl(45, 93%, 47%)', label: 'Média' },
  high: { color: 'hsl(25, 95%, 53%)', label: 'Alta' },
  critical: { color: 'hsl(0, 84%, 60%)', label: 'Crítica' },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3">
      <p className="font-semibold text-foreground">{data.label}</p>
      <div className="mt-1 space-y-0.5 text-sm">
        <p className="text-muted-foreground">
          Tarefas: <span className="font-medium text-foreground">{data.count}</span>
        </p>
        <p className="text-muted-foreground">
          Pontos: <span className="font-medium text-foreground">{data.points}</span>
        </p>
      </div>
    </div>
  );
};

const renderCustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
          <span className="text-sm font-medium text-foreground">({entry.payload.count})</span>
        </div>
      ))}
    </div>
  );
};

export function CriticalityDonut({ data }: CriticalityDonutProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      label: CRITICALITY_CONFIG[item.criticality]?.label || item.criticality,
      color: CRITICALITY_CONFIG[item.criticality]?.color || 'hsl(var(--muted))',
    }));
  }, [data]);

  const totalTasks = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-rose-500/10">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          </div>
          Distribuição por Criticidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="count"
                nameKey="label"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderCustomLegend} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-3xl font-bold text-foreground">{totalTasks}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
