-- Enable God Mode update permissions on tasks table
DROP POLICY IF EXISTS "Authorized users can update tasks" ON public.tasks;

CREATE POLICY "Authorized users can update tasks"
ON public.tasks FOR UPDATE
USING (
    has_role(auth.uid(), 'god_mode'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'task_editor'::app_role)
    OR (has_role(auth.uid(), 'gestor_setor'::app_role) AND sector_id IN (SELECT get_user_sector_ids(auth.uid())))
    OR (has_role(auth.uid(), 'user'::app_role) AND assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
