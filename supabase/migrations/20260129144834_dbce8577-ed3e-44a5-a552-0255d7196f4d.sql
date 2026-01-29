-- Fix overly permissive RLS policy for admin_alerts INSERT
DROP POLICY IF EXISTS "System can create alerts" ON public.admin_alerts;

-- Only allow the trigger/system to create alerts (via the function which runs as SECURITY DEFINER)
-- Users authenticated can only create their own alerts
CREATE POLICY "Users can create their own alerts"
ON public.admin_alerts
FOR INSERT
WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));