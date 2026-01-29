import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AdminAlerts } from '@/components/admin/AdminAlerts';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { useTasks } from '@/hooks/useTasks';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { getStats, getStatsByUser, loading } = useTasks();
  const { isAdmin } = useUserRole();

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <Dashboard stats={getStats()} userStats={getStatsByUser()} />
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Leaderboard de Pontuação */}
          <Leaderboard />
          
          {/* Alertas para Admin */}
          {isAdmin && <AdminAlerts />}
        </div>
      </div>
    </AppLayout>
  );
}
