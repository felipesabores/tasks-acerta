-- Permitir que admins e god_mode excluam qualquer tarefa
DROP POLICY IF EXISTS "Admins can delete any task" ON public.tasks;

CREATE POLICY "Admins can delete any task"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'god_mode') OR
  auth.uid() = created_by -- Mantém a permissão para quem criou também
);
