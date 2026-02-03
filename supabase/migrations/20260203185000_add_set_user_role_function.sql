-- Function to safely set a user's role (replaces existing)
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id UUID, new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the executor has permission (God Mode or Admin)
  IF NOT (
    has_role(auth.uid(), 'god_mode') OR 
    has_role(auth.uid(), 'admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Delete existing roles for the user
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Insert the new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role);
END;
$$;
