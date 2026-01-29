import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'task_editor' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user role:', error);
      setRole('user'); // Default to user if error
    } else {
      setRole((data?.role as AppRole) || 'user');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const isAdmin = role === 'admin';
  const isTaskEditor = role === 'task_editor';
  const isRegularUser = role === 'user';

  const canCreateTasks = isAdmin || isTaskEditor;
  const canEditTasks = isAdmin || isTaskEditor;
  const canDeleteTasks = isAdmin;
  const canManageUsers = isAdmin;
  const canCheckTasks = true; // All authenticated users can check their tasks

  return {
    role,
    loading,
    isAdmin,
    isTaskEditor,
    isRegularUser,
    canCreateTasks,
    canEditTasks,
    canDeleteTasks,
    canManageUsers,
    canCheckTasks,
    refetch: fetchRole,
  };
}
