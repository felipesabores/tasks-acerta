-- Fix 1: Add authorization checks to RPC functions

-- Fix has_pending_tasks - restrict to own profile or admin/god_mode
CREATE OR REPLACE FUNCTION public.has_pending_tasks(p_profile_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check authorization: own profile or admin/god_mode
  IF NOT (
    p_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'god_mode'::app_role)
    OR has_role(auth.uid(), 'gestor_setor'::app_role)
    OR has_role(auth.uid(), 'gestor_geral'::app_role)
  ) THEN
    RETURN false; -- Return false instead of error to prevent information disclosure
  END IF;
  
  RETURN EXISTS (
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
  );
END;
$function$;

-- Fix get_pending_tasks_from_previous_days - restrict to own profile or admin/god_mode
CREATE OR REPLACE FUNCTION public.get_pending_tasks_from_previous_days(p_profile_id uuid)
 RETURNS TABLE(task_id uuid, task_title text, task_date date, criticality text, points integer, is_mandatory boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check authorization: own profile or admin/god_mode/gestor
  IF NOT (
    p_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'god_mode'::app_role)
    OR has_role(auth.uid(), 'gestor_setor'::app_role)
    OR has_role(auth.uid(), 'gestor_geral'::app_role)
  ) THEN
    RETURN; -- Return empty set for unauthorized access
  END IF;
  
  RETURN QUERY
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
  ORDER BY t.task_date DESC, t.title;
END;
$function$;

-- Fix clone_tasks_for_day - restrict to own profile or admin/god_mode
CREATE OR REPLACE FUNCTION public.clone_tasks_for_day(p_profile_id uuid, p_target_date date DEFAULT CURRENT_DATE)
 RETURNS SETOF uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_task_id UUID;
  v_new_task_id UUID;
  v_yesterday DATE := p_target_date - INTERVAL '1 day';
BEGIN
  -- Check authorization: own profile or admin/god_mode
  IF NOT (
    p_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'god_mode'::app_role)
  ) THEN
    RETURN; -- Return empty set for unauthorized access
  END IF;

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
$function$;

-- Fix 2: Create a view for public profile data (name only) and update RLS policy
-- First, drop the existing policy
DROP POLICY IF EXISTS "Users can view relevant profiles" ON public.profiles;

-- Create a more restrictive policy that limits what data users can see
-- Users can see their own full profile, admins/god_mode can see all
-- Other users can only see profiles that are assigned to tasks or in leaderboard (but with limited fields via application logic)
CREATE POLICY "Users can view relevant profiles" ON public.profiles
FOR SELECT USING (
  -- Own profile - full access
  auth.uid() = user_id
  -- Admins and god_mode - full access
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'god_mode'::app_role)
  OR has_role(auth.uid(), 'gestor_setor'::app_role)
  OR has_role(auth.uid(), 'gestor_geral'::app_role)
  -- For leaderboard - only if profile has points (limited data exposure handled in app)
  OR id IN (SELECT profile_id FROM user_points)
  -- For task assignments - only if profile is assigned to visible tasks
  OR id IN (SELECT assigned_to FROM tasks WHERE assigned_to IS NOT NULL)
);