import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useTasks } from '@/hooks/useTasks';

export default function DashboardPage() {
  const { getStats, getStatsByUser } = useTasks();

  return (
    <AppLayout title="Dashboard">
      <Dashboard stats={getStats()} userStats={getStatsByUser()} />
    </AppLayout>
  );
}
