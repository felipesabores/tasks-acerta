import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import DashboardPage from './DashboardPage';
import UserHomePage from './UserHomePage';

const Index = () => {
  const { canCreateTasks, isGodMode, loading } = useUserRole();
  const navigate = useNavigate();

  // Redirect god_mode users to /god-mode on first session access
  useEffect(() => {
    if (!loading && isGodMode && !sessionStorage.getItem('godmode_initial_redirect')) {
      sessionStorage.setItem('godmode_initial_redirect', 'true');
      navigate('/god-mode', { replace: true });
    }
  }, [isGodMode, loading, navigate]);

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
