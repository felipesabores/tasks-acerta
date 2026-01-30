import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'god_mode' | 'admin' | 'task_editor' | 'gestor_setor' | 'gestor_geral' | 'user';

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

  const isGodMode = role === 'god_mode';
  const isAdmin = role === 'admin' || isGodMode;
  const isTaskEditor = role === 'task_editor';
  const isGestorSetor = role === 'gestor_setor';
  const isGestorGeral = role === 'gestor_geral';
  const isRegularUser = role === 'user';

  // Permission flags
  const canCreateTasks = isAdmin || isTaskEditor; // Global task creation
  const canCreateSectorTasks = isGestorSetor; // Sector-specific task creation
  const canEditTasks = isAdmin || isTaskEditor;
  const canDeleteTasks = isAdmin;
  const canManageUsers = isGodMode || isAdmin;
  const canCheckTasks = true; // All authenticated users can check their tasks
  const canViewAllTasks = isGodMode || isAdmin || isGestorGeral; // Read-only view of all tasks
  const canViewSectorTasks = isGestorSetor; // View tasks in their sector
  const canManageSectors = isGodMode || isAdmin; // Create/edit sectors

  return {
    role,
    loading,
    isGodMode,
    isAdmin,
    isTaskEditor,
    isGestorSetor,
    isGestorGeral,
    isRegularUser,
    canCreateTasks,
    canCreateSectorTasks,
    canEditTasks,
    canDeleteTasks,
    canManageUsers,
    canCheckTasks,
    canViewAllTasks,
    canViewSectorTasks,
    canManageSectors,
    refetch: fetchRole,
  };
}
