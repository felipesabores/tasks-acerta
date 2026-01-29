import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useTasks } from '@/hooks/useTasks';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { getStats, getStatsByUser, loading } = useTasks();

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
      <Dashboard stats={getStats()} userStats={getStatsByUser()} />
    </AppLayout>
  );
}
