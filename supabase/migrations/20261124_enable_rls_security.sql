-- ==============================================================================
-- AGENDA AI — ATIVAÇÃO GLOBAL DE ROW LEVEL SECURITY (RLS)
-- Resolve o alerta "Table publicly accessible (rls_disabled_in_public)" no Supabase
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Percorre todas as tabelas do schema public e ativa Row Level Security
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
  END LOOP;
END $$;
