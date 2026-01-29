import { useUserRole } from '@/hooks/useUserRole';
import DashboardPage from './DashboardPage';
import UserHomePage from './UserHomePage';

const Index = () => {
  const { canCreateTasks, loading } = useUserRole();

  // Show user home for regular users, admin dashboard for admins/editors
  if (loading) {
    return null;
  }

  if (canCreateTasks) {
    return <DashboardPage />;
  }

  return <UserHomePage />;
};

export default Index;
