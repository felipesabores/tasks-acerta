-- Create task_templates table
CREATE TABLE public.task_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all templates
CREATE POLICY "Authenticated users can view task templates"
  ON public.task_templates FOR SELECT
  USING (true);

-- Admins and task_editors can manage all templates
CREATE POLICY "Admins and task_editors can insert templates"
  ON public.task_templates FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'task_editor'::app_role) OR
    has_role(auth.uid(), 'god_mode'::app_role)
  );

CREATE POLICY "Admins and task_editors can update templates"
  ON public.task_templates FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'task_editor'::app_role) OR
    has_role(auth.uid(), 'god_mode'::app_role)
  );

CREATE POLICY "Admins can delete templates"
  ON public.task_templates FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'god_mode'::app_role)
  );

-- Sector managers can manage their sector templates
CREATE POLICY "Sector managers can insert their sector templates"
  ON public.task_templates FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'gestor_setor'::app_role) AND 
    sector_id IN (SELECT get_user_sector_ids(auth.uid()))
  );

CREATE POLICY "Sector managers can update their sector templates"
  ON public.task_templates FOR UPDATE
  USING (
    has_role(auth.uid(), 'gestor_setor'::app_role) AND 
    sector_id IN (SELECT get_user_sector_ids(auth.uid()))
  );

CREATE POLICY "Sector managers can delete their sector templates"
  ON public.task_templates FOR DELETE
  USING (
    has_role(auth.uid(), 'gestor_setor'::app_role) AND 
    sector_id IN (SELECT get_user_sector_ids(auth.uid()))
  );

-- Add trigger for updated_at
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();