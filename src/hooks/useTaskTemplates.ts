import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  sector_id: string;
  sector?: { id: string; name: string };
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplateFormData {
  title: string;
  description: string;
  sectorId: string;
}

export function useTaskTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('task_templates')
      .select(`
        *,
        sector:sectors(id, name)
      `)
      .order('title');

    if (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Erro ao carregar modelos',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setTemplates(data || []);
    setLoading(false);
  }, [toast]);

  const fetchTemplatesBySector = useCallback(async (sectorId: string) => {
    const { data, error } = await supabase
      .from('task_templates')
      .select(`
        *,
        sector:sectors(id, name)
      `)
      .eq('sector_id', sectorId)
      .order('title');

    if (error) {
      console.error('Error fetching templates by sector:', error);
      return [];
    }

    return data || [];
  }, []);

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user, fetchTemplates]);

  const addTemplate = useCallback(async (data: TaskTemplateFormData) => {
    if (!user) return;

    const { error } = await supabase.from('task_templates').insert({
      title: data.title,
      description: data.description,
      sector_id: data.sectorId,
      created_by: user.id,
    });

    if (error) {
      toast({
        title: 'Erro ao criar modelo',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await fetchTemplates();
    return true;
  }, [user, fetchTemplates, toast]);

  const updateTemplate = useCallback(async (id: string, data: Partial<TaskTemplateFormData>) => {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.sectorId !== undefined) updateData.sector_id = data.sectorId;

    const { error } = await supabase
      .from('task_templates')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao atualizar modelo',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await fetchTemplates();
    return true;
  }, [fetchTemplates, toast]);

  const deleteTemplate = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao excluir modelo',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    await fetchTemplates();
    return true;
  }, [fetchTemplates, toast]);

  return {
    templates,
    loading,
    fetchTemplates,
    fetchTemplatesBySector,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
