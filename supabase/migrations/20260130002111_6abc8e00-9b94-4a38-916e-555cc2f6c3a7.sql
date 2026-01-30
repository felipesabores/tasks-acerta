-- Update the get_user_role function to prioritize god_mode
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'god_mode' THEN 0
      WHEN 'admin' THEN 1 
      WHEN 'task_editor' THEN 2 
      WHEN 'user' THEN 3 
    END
  LIMIT 1
$$;