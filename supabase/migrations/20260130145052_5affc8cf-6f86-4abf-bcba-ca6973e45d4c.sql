-- Adicionar campos para sistema de clonagem de tarefas diárias
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON public.tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_template ON public.tasks(is_template);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_date ON public.tasks(assigned_to, task_date);

-- Função para verificar se usuário tem tarefas pendentes de dias anteriores
CREATE OR REPLACE FUNCTION public.has_pending_tasks(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.assigned_to = p_profile_id
      AND t.task_date < CURRENT_DATE
      AND t.is_template = false
      AND NOT EXISTS (
        SELECT 1 FROM daily_task_completions dtc
        WHERE dtc.task_id = t.id
          AND dtc.profile_id = p_profile_id
          AND dtc.completion_date = t.task_date
      )
  )
$$;

-- Função para buscar tarefas pendentes de dias anteriores
CREATE OR REPLACE FUNCTION public.get_pending_tasks_from_previous_days(p_profile_id UUID)
RETURNS TABLE (
  task_id UUID,
  task_title TEXT,
  task_date DATE,
  criticality TEXT,
  points INTEGER,
  is_mandatory BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.title,
    t.task_date,
    t.criticality,
    t.points,
    t.is_mandatory
  FROM tasks t
  WHERE t.assigned_to = p_profile_id
    AND t.task_date < CURRENT_DATE
    AND t.is_template = false
    AND NOT EXISTS (
      SELECT 1 FROM daily_task_completions dtc
      WHERE dtc.task_id = t.id
        AND dtc.profile_id = p_profile_id
        AND dtc.completion_date = t.task_date
    )
  ORDER BY t.task_date DESC, t.title
$$;

-- Função para clonar tarefas para um novo dia
CREATE OR REPLACE FUNCTION public.clone_tasks_for_day(p_profile_id UUID, p_target_date DATE DEFAULT CURRENT_DATE)
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_id UUID;
  v_new_task_id UUID;
  v_yesterday DATE := p_target_date - INTERVAL '1 day';
BEGIN
  -- Para cada tarefa template do usuário (ou tarefa do dia anterior)
  FOR v_task_id IN
    SELECT DISTINCT t.id
    FROM tasks t
    WHERE t.assigned_to = p_profile_id
      AND (
        t.is_template = true
        OR (t.task_date = v_yesterday AND t.is_template = false)
      )
      -- Não clonar se já existe tarefa para esse dia
      AND NOT EXISTS (
        SELECT 1 FROM tasks t2
        WHERE t2.assigned_to = p_profile_id
          AND t2.task_date = p_target_date
          AND (t2.parent_task_id = t.id OR t2.parent_task_id = t.parent_task_id OR (t2.title = t.title AND t2.is_template = false))
      )
  LOOP
    INSERT INTO tasks (
      title,
      description,
      status,
      assigned_to,
      created_by,
      criticality,
      is_mandatory,
      points,
      sector_id,
      task_date,
      parent_task_id,
      is_template
    )
    SELECT 
      t.title,
      t.description,
      'pending',
      t.assigned_to,
      t.created_by,
      t.criticality,
      t.is_mandatory,
      t.points,
      t.sector_id,
      p_target_date,
      COALESCE(t.parent_task_id, t.id),
      false
    FROM tasks t
    WHERE t.id = v_task_id
    RETURNING id INTO v_new_task_id;
    
    -- Clonar checklist items
    INSERT INTO task_checklist_items (task_id, title, position)
    SELECT v_new_task_id, tci.title, tci.position
    FROM task_checklist_items tci
    WHERE tci.task_id = v_task_id;
    
    RETURN NEXT v_new_task_id;
  END LOOP;
  
  RETURN;
END;
$$;

-- Permitir que a tabela admin_alerts aceite task_id nulo para alertas de pendência geral
ALTER TABLE public.admin_alerts ALTER COLUMN task_id DROP NOT NULL;

-- Atualizar tarefas existentes para ter task_date = CURRENT_DATE e is_template = true
UPDATE public.tasks 
SET 
  task_date = CURRENT_DATE,
  is_template = true
WHERE task_date IS NULL OR is_template IS NULL;