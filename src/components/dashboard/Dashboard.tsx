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
  PieChart,
  Pie,
  Cell,
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
  const pieData = [
    { name: 'Pendentes', value: stats.pending, color: COLORS.pending },
    { name: 'Em Progresso', value: stats.inProgress, color: COLORS.inProgress },
    { name: 'Concluídas', value: stats.done, color: COLORS.done },
  ];

  const barData = userStats.map(us => ({
    name: us.user.name.split(' ')[0],
    Concluídas: us.done,
    'Em Progresso': us.inProgress,
    Pendentes: us.pending,
  }));

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
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Concluídas"
                  stackId="a"
                  fill={COLORS.done}
                  radius={[0, 0, 0, 0]}
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
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de Conclusão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userStats
              .sort((a, b) => b.completionRate - a.completionRate)
              .map((us, index) => (
                <div key={us.user.id} className="flex items-center gap-4">
                  <span className="text-lg font-bold text-muted-foreground w-6">
                    {index + 1}º
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{us.user.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {us.done}/{us.total} tarefas ({us.completionRate}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${us.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
