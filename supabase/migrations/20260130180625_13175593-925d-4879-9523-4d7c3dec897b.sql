-- 1. Tabela de empresas
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Tabela de cargos por empresa
CREATE TABLE public.company_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(company_id, name)
);

-- 3. Adicionar company_id na tabela sectors
ALTER TABLE public.sectors 
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 4. Adicionar campos ao profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.company_positions(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- 5. Trigger para updated_at em companies
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS para companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view companies"
  ON public.companies FOR SELECT USING (true);

CREATE POLICY "God mode can manage companies"
  ON public.companies FOR ALL
  USING (has_role(auth.uid(), 'god_mode'::app_role))
  WITH CHECK (has_role(auth.uid(), 'god_mode'::app_role));

-- 7. RLS para company_positions
ALTER TABLE public.company_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view positions"
  ON public.company_positions FOR SELECT USING (true);

CREATE POLICY "God mode can manage positions"
  ON public.company_positions FOR ALL
  USING (has_role(auth.uid(), 'god_mode'::app_role))
  WITH CHECK (has_role(auth.uid(), 'god_mode'::app_role));

-- 8. Funcao para buscar email pelo username
CREATE OR REPLACE FUNCTION public.get_email_by_username(_username TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email
  FROM auth.users u
  JOIN public.profiles p ON p.user_id = u.id
  WHERE LOWER(p.username) = LOWER(_username)
  AND p.is_active = true
  LIMIT 1
$$;