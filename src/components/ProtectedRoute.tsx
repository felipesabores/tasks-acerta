import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [checkingActive, setCheckingActive] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const checkUserActive = async () => {
      if (!user) {
        setCheckingActive(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking user active status:', error);
        setCheckingActive(false);
        return;
      }

      // If is_active is null (legacy users), treat as active
      const userIsActive = profile?.is_active ?? true;
      
      if (!userIsActive) {
        toast({
          title: 'Acesso negado',
          description: 'Sua conta está desativada. Entre em contato com o administrador.',
          variant: 'destructive',
        });
        await signOut();
        setIsActive(false);
      }

      setCheckingActive(false);
    };

    if (!loading) {
      checkUserActive();
    }
  }, [user, loading, signOut, toast]);

  if (loading || checkingActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isActive) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
