-- Drop existing policies on user_roles that allow admin
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

-- Create new policies allowing only god_mode to manage roles
CREATE POLICY "Only god_mode can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'god_mode'::app_role));

CREATE POLICY "Only god_mode can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'god_mode'::app_role));

CREATE POLICY "Only god_mode can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'god_mode'::app_role));

-- Update profiles policies to allow god_mode to update any profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile or god_mode can update any"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'god_mode'::app_role));