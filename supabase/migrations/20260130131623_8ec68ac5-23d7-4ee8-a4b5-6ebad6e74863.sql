-- 2. Create sectors table
CREATE TABLE public.sectors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create profile_sectors junction table (many-to-many)
CREATE TABLE public.profile_sectors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sector_id uuid NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(profile_id, sector_id)
);

-- 4. Add sector_id to tasks table for sector-based task management
ALTER TABLE public.tasks ADD COLUMN sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL;

-- 5. Enable RLS on new tables
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_sectors ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for sectors table
CREATE POLICY "Anyone authenticated can view sectors"
ON public.sectors FOR SELECT
USING (true);

CREATE POLICY "Admins and god_mode can manage sectors"
ON public.sectors FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'god_mode'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'god_mode'::app_role));

-- 7. Create RLS policies for profile_sectors table
CREATE POLICY "Users can view their own sector assignments"
ON public.profile_sectors FOR SELECT
USING (
    profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'god_mode'::app_role)
    OR has_role(auth.uid(), 'gestor_setor'::app_role)
    OR has_role(auth.uid(), 'gestor_geral'::app_role)
);

CREATE POLICY "Admins and god_mode can manage sector assignments"
ON public.profile_sectors FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'god_mode'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'god_mode'::app_role));

-- 8. Create function to check if user is gestor of a specific sector
CREATE OR REPLACE FUNCTION public.is_sector_manager(_user_id uuid, _sector_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_sectors ps
    JOIN public.profiles p ON ps.profile_id = p.id
    WHERE p.user_id = _user_id
      AND ps.sector_id = _sector_id
      AND public.has_role(_user_id, 'gestor_setor'::app_role)
  )
$$;

-- 9. Create function to get user's sector IDs
CREATE OR REPLACE FUNCTION public.get_user_sector_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ps.sector_id
  FROM public.profile_sectors ps
  JOIN public.profiles p ON ps.profile_id = p.id
  WHERE p.user_id = _user_id
$$;

-- 10. Update tasks RLS policy to allow gestor_setor to manage tasks in their sector
DROP POLICY IF EXISTS "Admins and task_editors can create tasks" ON public.tasks;
CREATE POLICY "Authorized users can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'task_editor'::app_role)
    OR (has_role(auth.uid(), 'gestor_setor'::app_role) AND sector_id IN (SELECT get_user_sector_ids(auth.uid())))
);

DROP POLICY IF EXISTS "Admins and task_editors can update tasks" ON public.tasks;
CREATE POLICY "Authorized users can update tasks"
ON public.tasks FOR UPDATE
USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'task_editor'::app_role)
    OR (has_role(auth.uid(), 'gestor_setor'::app_role) AND sector_id IN (SELECT get_user_sector_ids(auth.uid())))
    OR (has_role(auth.uid(), 'user'::app_role) AND assigned_to = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Only admins can delete tasks" ON public.tasks;
CREATE POLICY "Authorized users can delete tasks"
ON public.tasks FOR DELETE
USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'gestor_setor'::app_role) AND sector_id IN (SELECT get_user_sector_ids(auth.uid())))
);

-- 11. Add trigger for sectors updated_at
CREATE TRIGGER update_sectors_updated_at
BEFORE UPDATE ON public.sectors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();