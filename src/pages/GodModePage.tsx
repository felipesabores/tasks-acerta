import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useGodModeStats, getDateRangeFromPreset, type DateRange } from '@/hooks/useGodModeStats';
import { DateRangePicker } from '@/components/godmode/DateRangePicker';
import { KPICard } from '@/components/godmode/KPICard';
import { PerformanceChart } from '@/components/godmode/PerformanceChart';
import { UserRankingTable } from '@/components/godmode/UserRankingTable';
import { CriticalityDonut } from '@/components/godmode/CriticalityDonut';
import { AlertsSummary } from '@/components/godmode/AlertsSummary';
import { GodModeLoadingSkeleton } from '@/components/godmode/GodModeSkeletons';
import { 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  Users, 
  Activity, 
  TrendingUp,
  Zap,
  Target,
  Award,
  AlertTriangle,
  BarChart3,
  Percent,
  UserCheck,
  Flame
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function GodModePage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('today'));
  const { data, loading, error } = useGodModeStats(dateRange);

  if (loading) {
    return (
      <AppLayout title="">
        <GodModeLoadingSkeleton />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="God Mode">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-destructive font-medium">Erro ao carregar dados</p>
            <p className="text-muted-foreground text-sm mt-1">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!data) return null;

  return (
    <AppLayout title="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  God Mode
                </h1>
                <p className="text-sm text-muted-foreground">
                  Painel de supervisão avançado
                </p>
              </div>
              <Badge variant="outline" className="ml-2 border-violet-500/50 text-violet-500 bg-violet-500/10">
                Ultra User
              </Badge>
            </div>
          </div>
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>

        {/* Primary KPIs - Task Overview */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total de Tarefas"
            value={data.taskStats.total}
            subtitle="Todas as tarefas no sistema"
            icon={ListTodo}
            variant="primary"
          />
          <KPICard
            title="Concluídas"
            value={data.taskStats.done}
            subtitle={`${data.taskStats.completionRate}% de conclusão`}
            icon={CheckCircle2}
            variant="success"
            trend={{ value: data.taskStats.completionRate, isPositive: data.taskStats.completionRate >= 50 }}
          />
          <KPICard
            title="Em Progresso"
            value={data.taskStats.inProgress}
            subtitle="Tarefas sendo executadas"
            icon={Activity}
            variant="warning"
          />
          <KPICard
            title="Pendentes"
            value={data.taskStats.pending}
            subtitle="Aguardando início"
            icon={Clock}
            variant="danger"
          />
        </div>

        {/* Secondary KPIs - User Metrics */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Usuários Totais"
            value={data.totalUsers}
            icon={Users}
            size="sm"
          />
          <KPICard
            title="Usuários Ativos"
            value={data.activeUsers}
            subtitle="No período selecionado"
            icon={UserCheck}
            size="sm"
            trend={{ value: data.advancedKPIs.engagementRate, isPositive: data.advancedKPIs.engagementRate >= 70 }}
          />
          <KPICard
            title="Taxa de Engajamento"
            value={`${data.advancedKPIs.engagementRate}%`}
            subtitle="Usuários ativos / total"
            icon={Percent}
            size="sm"
          />
          <KPICard
            title="Alertas Pendentes"
            value={data.unreadAlerts}
            subtitle={`de ${data.totalAlerts} alertas`}
            icon={TrendingUp}
            size="sm"
          />
        </div>

        {/* Advanced KPIs - Deep Insights */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <KPICard
            title="Pontuação Total"
            value={data.advancedKPIs.totalPoints.toLocaleString()}
            subtitle="Pontos acumulados"
            icon={Award}
            size="sm"
            variant="primary"
          />
          <KPICard
            title="Média por Usuário"
            value={data.advancedKPIs.avgPointsPerUser.toLocaleString()}
            subtitle="Pontos médios"
            icon={BarChart3}
            size="sm"
          />
          <KPICard
            title="Top Performer"
            value={data.advancedKPIs.topPerformerPoints.toLocaleString()}
            subtitle={data.advancedKPIs.topPerformerName}
            icon={Flame}
            size="sm"
            variant="success"
          />
          <KPICard
            title="Tarefas Críticas"
            value={data.advancedKPIs.criticalTasksCount}
            subtitle={`${data.advancedKPIs.overdueEstimate} pendentes`}
            icon={AlertTriangle}
            size="sm"
            variant="danger"
          />
          <KPICard
            title="Tarefas por Usuário"
            value={data.advancedKPIs.tasksPerUser}
            subtitle="Média de distribuição"
            icon={Target}
            size="sm"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PerformanceChart data={data.dailyMetrics} />
          </div>
          <div className="space-y-6">
            <CriticalityDonut data={data.criticalityBreakdown} />
          </div>
        </div>

        {/* Alerts and Ranking */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <AlertsSummary totalAlerts={data.totalAlerts} unreadAlerts={data.unreadAlerts} />
          </div>
          <div className="lg:col-span-2">
            <UserRankingTable users={data.userPerformances} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
