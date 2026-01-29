import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

export interface AdminAlert {
  id: string;
  task_id: string;
  profile_id: string;
  alert_date: string;
  message: string;
  is_read: boolean;
  created_at: string;
  task?: {
    title: string;
  };
  profile?: {
    name: string;
  };
}

export function useAdminAlerts() {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    if (!isAdmin) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('admin_alerts')
      .select(`
        *,
        task:tasks(title),
        profile:profiles(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching alerts:', error);
      return;
    }

    const typedData = (data || []) as AdminAlert[];
    setAlerts(typedData);
    setUnreadCount(typedData.filter(a => !a.is_read).length);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markAsRead = useCallback(async (alertId: string) => {
    const { error } = await supabase
      .from('admin_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar como lido.',
        variant: 'destructive',
      });
      return;
    }

    setAlerts(prev => 
      prev.map(a => a.id === alertId ? { ...a, is_read: true } : a)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [toast]);

  const markAllAsRead = useCallback(async () => {
    const { error } = await supabase
      .from('admin_alerts')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar todos como lidos.',
        variant: 'destructive',
      });
      return;
    }

    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    setUnreadCount(0);
  }, [toast]);

  const deleteAlert = useCallback(async (alertId: string) => {
    const { error } = await supabase
      .from('admin_alerts')
      .delete()
      .eq('id', alertId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o alerta.',
        variant: 'destructive',
      });
      return;
    }

    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, [toast]);

  return {
    alerts,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    refetch: fetchAlerts,
  };
}
