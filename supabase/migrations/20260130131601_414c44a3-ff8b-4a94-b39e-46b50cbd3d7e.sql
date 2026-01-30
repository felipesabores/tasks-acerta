-- 1. Add new roles to the enum (separate transaction)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor_setor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor_geral';