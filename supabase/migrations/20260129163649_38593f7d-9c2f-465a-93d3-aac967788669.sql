-- Fix 1: Remove overly permissive policy on user_points that allows users to manipulate their own scores
DROP POLICY IF EXISTS "System can manage user points" ON public.user_points;

-- Create SELECT-only policy for users to view their own points and the leaderboard
-- Keep the existing "Anyone authenticated can view leaderboard" policy for viewing
-- Create admin-only policy for modifications
CREATE POLICY "Only admins can modify user points"
ON public.user_points
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict profiles table to only allow viewing own profile or profiles needed for tasks
-- First drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Create more restrictive SELECT policy:
-- Users can view their own profile
-- Admins can view all profiles
-- Users can view profiles of people assigned to tasks they can see (for leaderboard/task display)
CREATE POLICY "Users can view relevant profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'task_editor'::app_role)
  OR id IN (
    SELECT assigned_to FROM tasks WHERE assigned_to IS NOT NULL
  )
  OR id IN (
    SELECT profile_id FROM user_points
  )
);