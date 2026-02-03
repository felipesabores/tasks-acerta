-- 1. Fix Tasks INSERT for God Mode
DROP POLICY IF EXISTS "Authorized users can create tasks" ON public.tasks;
CREATE POLICY "Authorized users can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'god_mode'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'task_editor'::app_role)
    OR (has_role(auth.uid(), 'gestor_setor'::app_role) AND sector_id IN (SELECT get_user_sector_ids(auth.uid())))
);

-- 2. Fix Checklist Items INSERT for God Mode
DROP POLICY IF EXISTS "Admins and task_editors can manage checklist items" ON public.task_checklist_items;
CREATE POLICY "Authorized users can insert checklist items"
ON public.task_checklist_items FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'god_mode'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'task_editor'::app_role)
);

-- 3. Fix Checklist Items UPDATE for God Mode
DROP POLICY IF EXISTS "Admins and task_editors can update checklist items" ON public.task_checklist_items;
CREATE POLICY "Authorized users can update checklist items"
ON public.task_checklist_items FOR UPDATE
USING (
    has_role(auth.uid(), 'god_mode'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'task_editor'::app_role) OR
    -- Regular users can only mark items as completed for their tasks
    (has_role(auth.uid(), 'user'::app_role) AND 
     EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND assigned_to = (SELECT id FROM public.profiles WHERE user_id = auth.uid())))
);

-- 4. Fix Checklist Items DELETE for God Mode
DROP POLICY IF EXISTS "Admins and task_editors can delete checklist items" ON public.task_checklist_items;
CREATE POLICY "Authorized users can delete checklist items"
ON public.task_checklist_items FOR DELETE
USING (
    has_role(auth.uid(), 'god_mode'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'task_editor'::app_role)
);
