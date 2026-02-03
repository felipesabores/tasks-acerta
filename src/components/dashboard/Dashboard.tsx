import { StatsCard } from './StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  Clock,
  ListTodo,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

interface DashboardProps {
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    done: number;
    completionRate: number;
  };
  userStats: Array<{
    user: { id: string; name: string };
    total: number;
    done: number;
    pending: number;
    inProgress: number;
    completionRate: number;
  }>;
}

const COLORS = {
  pending: 'hsl(45, 93%, 47%)',
  inProgress: 'hsl(217, 91%, 60%)',
  done: 'hsl(142, 71%, 45%)',
};

export function Dashboard({ stats, userStats }: DashboardProps) {
  const barData = userStats.map(us => ({
    name: us.user.name.split(' ')[0],
    Concluídas: us.done,
    'Em Progresso': us.inProgress,
    Pendentes: us.pending,
  }));

  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return (value / stats.total) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Tarefas"
          value={stats.total}
          icon={ListTodo}
          description="Tarefas criadas"
        />
        <StatsCard
          title="Pendentes"
          value={stats.pending}
          icon={Clock}
          description="Aguardando início"
        />
        <StatsCard
          title="Em Progresso"
          value={stats.inProgress}
          icon={Loader2}
          description="Sendo executadas"
        />
        <StatsCard
          title="Taxa de Conclusão"
          value={`${stats.completionRate}%`}
          icon={TrendingUp}
          description={`${stats.done} tarefas concluídas`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.pending }} />
                    Pendentes
                  </span>
                  <span className="font-medium">{stats.pending} ({getPercentage(stats.pending).toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${getPercentage(stats.pending)}%`,
                      backgroundColor: COLORS.pending
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.inProgress }} />
                    Em Progresso
                  </span>
                  <span className="font-medium">{stats.inProgress} ({getPercentage(stats.inProgress).toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${getPercentage(stats.inProgress)}%`,
                      backgroundColor: COLORS.inProgress
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.done }} />
                    Concluídas
                  </span>
                  <span className="font-medium">{stats.done} ({getPercentage(stats.done).toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${getPercentage(stats.done)}%`,
                      backgroundColor: COLORS.done
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Desempenho por Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Concluídas"
                  stackId="a"
                  fill={COLORS.done}
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="Em Progresso"
                  stackId="a"
                  fill={COLORS.inProgress}
                />
                <Bar
                  dataKey="Pendentes"
                  stackId="a"
                  fill={COLORS.pending}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
