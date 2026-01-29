-- Add whatsapp and cargo columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN whatsapp text,
ADD COLUMN cargo text;

-- Create criticality_points table for default scoring
CREATE TABLE public.criticality_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criticality text NOT NULL UNIQUE,
  default_points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.criticality_points ENABLE ROW LEVEL SECURITY;

-- Everyone can view criticality points
CREATE POLICY "Anyone can view criticality points"
ON public.criticality_points
FOR SELECT
USING (true);

-- Only admins can manage criticality points
CREATE POLICY "Admins can manage criticality points"
ON public.criticality_points
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default criticality points
INSERT INTO public.criticality_points (criticality, default_points) VALUES
('low', 5),
('medium', 10),
('high', 15),
('critical', 20);

-- Add trigger for updated_at
CREATE TRIGGER update_criticality_points_updated_at
BEFORE UPDATE ON public.criticality_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();