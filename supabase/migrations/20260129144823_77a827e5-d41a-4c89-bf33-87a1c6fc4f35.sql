-- Create enum for daily completion status
CREATE TYPE public.daily_completion_status AS ENUM ('completed', 'not_completed', 'no_demand');

-- Create table for daily task completions
CREATE TABLE public.daily_task_completions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status daily_completion_status NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(task_id, profile_id, completion_date)
);

-- Create table for user total points (cached for performance)
CREATE TABLE public.user_points (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER NOT NULL DEFAULT 0,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    tasks_not_completed INTEGER NOT NULL DEFAULT 0,
    tasks_no_demand INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for admin alerts (incomplete tasks)
CREATE TABLE public.admin_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(task_id, profile_id, alert_date)
);

-- Enable RLS
ALTER TABLE public.daily_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_task_completions
CREATE POLICY "Users can view their own completions"
ON public.daily_task_completions
FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'task_editor'));

CREATE POLICY "Users can insert their own completions"
ON public.daily_task_completions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own completions"
ON public.daily_task_completions
FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for user_points
CREATE POLICY "Anyone authenticated can view leaderboard"
ON public.user_points
FOR SELECT
USING (true);

CREATE POLICY "System can manage user points"
ON public.user_points
FOR ALL
USING (has_role(auth.uid(), 'admin') OR profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for admin_alerts
CREATE POLICY "Admins can view all alerts"
ON public.admin_alerts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create alerts"
ON public.admin_alerts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update alerts"
ON public.admin_alerts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete alerts"
ON public.admin_alerts
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_daily_task_completions_updated_at
BEFORE UPDATE ON public.daily_task_completions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update user points when a completion is made
CREATE OR REPLACE FUNCTION public.update_user_points_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_task_points INTEGER;
    v_points_change INTEGER;
BEGIN
    -- Get task points
    SELECT COALESCE(points, 0) INTO v_task_points FROM tasks WHERE id = NEW.task_id;
    
    -- Calculate points change based on status
    CASE NEW.status
        WHEN 'completed' THEN v_points_change := v_task_points;
        WHEN 'not_completed' THEN v_points_change := -v_task_points;
        WHEN 'no_demand' THEN v_points_change := 0;
    END CASE;
    
    -- Update points earned in the completion record
    NEW.points_earned := v_points_change;
    
    -- Upsert user_points
    INSERT INTO user_points (profile_id, total_points, tasks_completed, tasks_not_completed, tasks_no_demand)
    VALUES (
        NEW.profile_id,
        GREATEST(0, v_points_change),
        CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'not_completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'no_demand' THEN 1 ELSE 0 END
    )
    ON CONFLICT (profile_id) DO UPDATE SET
        total_points = GREATEST(0, user_points.total_points + v_points_change),
        tasks_completed = user_points.tasks_completed + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        tasks_not_completed = user_points.tasks_not_completed + CASE WHEN NEW.status = 'not_completed' THEN 1 ELSE 0 END,
        tasks_no_demand = user_points.tasks_no_demand + CASE WHEN NEW.status = 'no_demand' THEN 1 ELSE 0 END,
        updated_at = now();
    
    -- Create alert for admin if task is not completed
    IF NEW.status = 'not_completed' THEN
        INSERT INTO admin_alerts (task_id, profile_id, alert_date, message)
        SELECT 
            NEW.task_id, 
            NEW.profile_id, 
            NEW.completion_date,
            (SELECT name FROM profiles WHERE id = NEW.profile_id) || ' não concluiu a tarefa: ' || (SELECT title FROM tasks WHERE id = NEW.task_id)
        ON CONFLICT (task_id, profile_id, alert_date) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger to update points on completion
CREATE TRIGGER on_daily_completion_insert
BEFORE INSERT ON public.daily_task_completions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_points_on_completion();

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_points;