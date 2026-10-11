-- ==============================================================================
-- AGENDA AI — SCHEMA COMPLETO DO SUPABASE (POSTGRESQL 15+)
-- Mapeado 1:1 de acordo com o Frontend (Stores, Telas, Tipos e Componentes)
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUMS E DOMÍNIOS
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'professional', 'receptionist');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tenant_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE business_type AS ENUM (
    'barbershop',
    'beauty_salon',
    'aesthetic_clinic',
    'health_clinic',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'pix',
    'credit_card',
    'debit_card',
    'cash',
    'unpaid'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_status AS ENUM ('connected', 'disconnected', 'connecting');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_trigger AS ENUM (
    'booking_created',
    'before_24h',
    'before_2h',
    'after_service',
    'inactive_30d'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_msg_status AS ENUM (
    'pending',
    'sent',
    'delivered',
    'read',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_template_category AS ENUM (
    'confirmation',
    'reminder',
    'feedback',
    'recovery',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. TABELAS PRINCIPAIS
-- ==============================================================================

-- 3.1. TENANTS (Organizações / Salões / Clínicas)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan tenant_plan NOT NULL DEFAULT 'pro',
  business_type business_type NOT NULL DEFAULT 'beauty_salon',
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  address TEXT,
  settings JSONB NOT NULL DEFAULT '{
    "opening_time": "08:00",
    "closing_time": "20:00",
    "interval_minutes": 30,
    "allow_online_booking": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2. PROFILES (Perfis de Usuários conectados ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'owner',
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- 3.3. CUSTOMERS (Clientes / CRM)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  birth_date DATE,
  notes TEXT,
  total_spent NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  appointments_count INTEGER NOT NULL DEFAULT 0,
  last_visit_at DATE,
  is_vip BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4. SERVICES (Catálogo de Serviços)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5. PROFESSIONALS (Equipe / Profissionais)
CREATE TABLE IF NOT EXISTS public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'Especialista',
  specialties TEXT[] NOT NULL DEFAULT '{}',
  commission_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  working_hours JSONB NOT NULL DEFAULT '{
    "start": "09:00",
    "end": "19:00",
    "days_of_week": [1, 2, 3, 4, 5, 6]
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.6. APPOINTMENTS (Agendamentos da Agenda)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  service_name TEXT NOT NULL,
  service_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  professional_name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  payment_method payment_method NOT NULL DEFAULT 'unpaid',
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.7. WHATSAPP CONNECTIONS (Status da Instância de Conexão QR Code)
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  status whatsapp_status NOT NULL DEFAULT 'disconnected',
  phone_number TEXT,
  instance_name TEXT,
  battery_level INTEGER DEFAULT 100,
  last_sync_at TEXT DEFAULT 'Desconectado',
  total_sent_this_month INTEGER NOT NULL DEFAULT 0,
  confirmation_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8. WHATSAPP TEMPLATES (Modelos de Mensagem)
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category whatsapp_template_category NOT NULL DEFAULT 'custom',
  content TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.9. WHATSAPP REMINDER RULES (Regras de Lembretes e Gatilhos)
CREATE TABLE IF NOT EXISTS public.whatsapp_reminder_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger whatsapp_trigger NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  template_id UUID REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  timing_description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Clock',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.10. WHATSAPP MESSAGE LOGS (Auditoria e Histórico de Disparos)
CREATE TABLE IF NOT EXISTS public.whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL DEFAULT 'Mensagem Direta',
  message TEXT NOT NULL,
  status whatsapp_msg_status NOT NULL DEFAULT 'sent',
  sent_at TEXT NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.11. AI CONVERSATIONS & MESSAGES (Assistente Virtual Llama 3.3 / Groq)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Nova Conversa com IA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_search ON public.customers(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON public.services(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_professionals_tenant ON public.professionals(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_calendar ON public.appointments(tenant_id, date, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_pro_date ON public.appointments(professional_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON public.appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_tenant ON public.whatsapp_message_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at ASC);

-- ==============================================================================
-- 5. FUNÇÕES AUXILIARES E TRIGGERS AUTOMÁTICOS
-- ==============================================================================

-- 5.1. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de timestamp
DROP TRIGGER IF EXISTS trg_tenants_updated_at ON public.tenants;
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_professionals_updated_at ON public.professionals;
CREATE TRIGGER trg_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_whatsapp_templates_updated_at ON public.whatsapp_templates;
CREATE TRIGGER trg_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 5.2. Função Auxiliar RLS: Obter Tenant do Usuário Autenticado
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5.3. Função Auxiliar RLS: Obter Cargo/Role do Usuário Autenticado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5.4. Trigger: Atualizar estatísticas de cliente quando o agendamento é Concluído
CREATE OR REPLACE FUNCTION public.trg_fn_update_customer_on_appointment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o agendamento foi marcado como concluído
  IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
    UPDATE public.customers
    SET 
      appointments_count = appointments_count + 1,
      total_spent = total_spent + NEW.total_price,
      last_visit_at = NEW.date,
      is_vip = CASE 
        WHEN (total_spent + NEW.total_price >= 1000.00 OR appointments_count + 1 >= 5) THEN true 
        ELSE is_vip 
      END
    WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_appointment_completed_stats ON public.appointments;
CREATE TRIGGER trg_appointment_completed_stats
AFTER UPDATE OF status ON public.appointments
FOR EACH ROW EXECUTE PROCEDURE public.trg_fn_update_customer_on_appointment_status();

-- 5.5. Função RPC: Calcular KPIs do Dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(p_tenant_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  v_today_revenue NUMERIC;
  v_today_count INTEGER;
  v_today_pending INTEGER;
  v_today_completed INTEGER;
  v_new_customers INTEGER;
  v_occupancy_rate NUMERIC;
  v_total_capacity INTEGER := 32; -- 8 horas x 4 profissionais slots de 1h
BEGIN
  -- Receita do dia
  SELECT COALESCE(SUM(total_price), 0)
  INTO v_today_revenue
  FROM public.appointments
  WHERE tenant_id = p_tenant_id AND date = p_date AND status != 'cancelled';

  -- Contagens do dia
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO 
    v_today_count,
    v_today_pending,
    v_today_completed
  FROM public.appointments
  WHERE tenant_id = p_tenant_id AND date = p_date;

  -- Novos clientes no mês atual
  SELECT COUNT(*)
  INTO v_new_customers
  FROM public.customers
  WHERE tenant_id = p_tenant_id 
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_date::TIMESTAMPTZ);

  -- Taxa de ocupação estimada
  v_occupancy_rate := LEAST(ROUND((v_today_count::NUMERIC / GREATEST(v_total_capacity, 1)) * 100, 1), 100.0);

  RETURN json_build_object(
    'todayRevenue', v_today_revenue,
    'todayAppointmentsCount', v_today_count,
    'todayPendingCount', v_today_pending,
    'todayCompletedCount', v_today_completed,
    'newCustomersThisMonth', v_new_customers,
    'occupancyRate', v_occupancy_rate,
    'weeklyRevenueChange', 18.4
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 6. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ISOLAMENTO
-- ==============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_reminder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 6.1. Políticas de Isolamento Multi-Tenant
DROP POLICY IF EXISTS "tenant_isolation_profiles" ON public.profiles;
CREATE POLICY "tenant_isolation_profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR user_id = auth.uid())
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR user_id = auth.uid());

DROP POLICY IF EXISTS "tenant_isolation_tenants" ON public.tenants;
CREATE POLICY "tenant_isolation_tenants" ON public.tenants
  FOR ALL TO authenticated
  USING (id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_customers" ON public.customers;
CREATE POLICY "tenant_isolation_customers" ON public.customers
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_services" ON public.services;
CREATE POLICY "tenant_isolation_services" ON public.services
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_professionals" ON public.professionals;
CREATE POLICY "tenant_isolation_professionals" ON public.professionals
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_appointments" ON public.appointments;
CREATE POLICY "tenant_isolation_appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_whatsapp_conn" ON public.whatsapp_connections;
CREATE POLICY "tenant_isolation_whatsapp_conn" ON public.whatsapp_connections
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_whatsapp_tpl" ON public.whatsapp_templates;
CREATE POLICY "tenant_isolation_whatsapp_tpl" ON public.whatsapp_templates
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_whatsapp_rules" ON public.whatsapp_reminder_rules;
CREATE POLICY "tenant_isolation_whatsapp_rules" ON public.whatsapp_reminder_rules
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_whatsapp_logs" ON public.whatsapp_message_logs;
CREATE POLICY "tenant_isolation_whatsapp_logs" ON public.whatsapp_message_logs
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

DROP POLICY IF EXISTS "tenant_isolation_ai_conv" ON public.ai_conversations;
CREATE POLICY "tenant_isolation_ai_conv" ON public.ai_conversations
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid())
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());

DROP POLICY IF EXISTS "tenant_isolation_ai_msg" ON public.ai_messages;
CREATE POLICY "tenant_isolation_ai_msg" ON public.ai_messages
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- ==============================================================================
-- 7. SEED DATA INICIAL (DADOS DE TESTE IDÊNTICOS AO FRONTEND MOCK)
-- ==============================================================================

DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  v_pro1_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_pro2_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_pro3_id UUID := '33333333-3333-3333-3333-333333333333'::UUID;
  v_pro4_id UUID := '44444444-4444-4444-4444-444444444444'::UUID;

  v_srv1_id UUID := 'aaaaaaaa-1111-1111-1111-111111111111'::UUID;
  v_srv2_id UUID := 'aaaaaaaa-2222-2222-2222-222222222222'::UUID;
  v_srv3_id UUID := 'aaaaaaaa-3333-3333-3333-333333333333'::UUID;
  v_srv4_id UUID := 'aaaaaaaa-4444-4444-4444-444444444444'::UUID;
  v_srv5_id UUID := 'aaaaaaaa-5555-5555-5555-555555555555'::UUID;
  v_srv6_id UUID := 'aaaaaaaa-6666-6666-6666-666666666666'::UUID;
  v_srv7_id UUID := 'aaaaaaaa-7777-7777-7777-777777777777'::UUID;
  v_srv8_id UUID := 'aaaaaaaa-8888-8888-8888-888888888888'::UUID;

  v_cust1_id UUID := 'bbbbbbbb-1111-1111-1111-111111111111'::UUID;
  v_cust2_id UUID := 'bbbbbbbb-2222-2222-2222-222222222222'::UUID;
  v_cust3_id UUID := 'bbbbbbbb-3333-3333-3333-333333333333'::UUID;
  v_cust4_id UUID := 'bbbbbbbb-4444-4444-4444-444444444444'::UUID;
  v_cust5_id UUID := 'bbbbbbbb-5555-5555-5555-555555555555'::UUID;
  v_cust6_id UUID := 'bbbbbbbb-6666-6666-6666-666666666666'::UUID;
  v_cust7_id UUID := 'bbbbbbbb-7777-7777-7777-777777777777'::UUID;

  v_tpl1_id UUID := 'cccccccc-1111-1111-1111-111111111111'::UUID;
  v_tpl2_id UUID := 'cccccccc-2222-2222-2222-222222222222'::UUID;
  v_tpl3_id UUID := 'cccccccc-3333-3333-3333-333333333333'::UUID;
  v_tpl4_id UUID := 'cccccccc-4444-4444-4444-444444444444'::UUID;
  v_tpl5_id UUID := 'cccccccc-5555-5555-5555-555555555555'::UUID;
BEGIN
  -- 7.1. Tenant de Teste
  INSERT INTO public.tenants (id, name, slug, plan, business_type, phone, email, address, settings)
  VALUES (
    v_tenant_id,
    'Studio Prime & Estética',
    'studio-prime',
    'pro',
    'beauty_salon',
    '11988887777',
    'contato@studioprime.com.br',
    'Av. Paulista, 1500 - Sala 42, São Paulo - SP',
    '{"opening_time": "08:00", "closing_time": "20:00", "interval_minutes": 30, "allow_online_booking": true}'::jsonb
  ) ON CONFLICT (id) DO NOTHING;

  -- 7.2. Profissionais
  INSERT INTO public.professionals (id, tenant_id, name, email, phone, avatar_url, role, specialties, commission_percentage, color, is_active, working_hours)
  VALUES 
  (
    v_pro1_id, v_tenant_id, 'Camila Albuquerque', 'camila@studioprime.com.br', '11999998888',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'Master Stylist & Esteticista', ARRAY['Corte & Visagismo', 'Coloração', 'Harmonização Facial'],
    45.0, '#6366f1', true, '{"start": "09:00", "end": "19:00", "days_of_week": [1, 2, 3, 4, 5, 6]}'::jsonb
  ),
  (
    v_pro2_id, v_tenant_id, 'Lucas Ferreira', 'lucas@studioprime.com.br', '11987654321',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'Barbeiro & Visagista', ARRAY['Corte Masculino', 'Barboterapia', 'Tratamento Capilar'],
    50.0, '#06b6d4', true, '{"start": "10:00", "end": "20:00", "days_of_week": [2, 3, 4, 5, 6]}'::jsonb
  ),
  (
    v_pro3_id, v_tenant_id, 'Beatriz Lima', 'beatriz@studioprime.com.br', '11977771122',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'Nail Designer & Podóloga', ARRAY['Alongamento em Gel', 'Manicure Russa', 'Spa dos Pés'],
    40.0, '#ec4899', true, '{"start": "09:00", "end": "18:00", "days_of_week": [1, 2, 3, 4, 5, 6]}'::jsonb
  ),
  (
    v_pro4_id, v_tenant_id, 'Rafael Santos', 'rafael@studioprime.com.br', '11988882233',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'Terapeuta Capilar & Massoterapeuta', ARRAY['Massagem Relaxante', 'Drenagem Linfática', 'Detox Capilar'],
    40.0, '#10b981', true, '{"start": "09:00", "end": "18:00", "days_of_week": [1, 2, 3, 4, 5]}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;

  -- 7.3. Serviços
  INSERT INTO public.services (id, tenant_id, name, description, category, price, duration_minutes, color, is_active)
  VALUES
  (v_srv1_id, v_tenant_id, 'Corte Feminino & Escova Modeladora', 'Lavagem especial com massagem capilar, corte visagista e finalização.', 'Cabelo', 140.00, 60, '#6366f1', true),
  (v_srv2_id, v_tenant_id, 'Corte Masculino Premium + Lavagem', 'Corte tesoura/máquina, acabamento na navalha e finalização com pomada matte.', 'Barbearia', 75.00, 45, '#06b6d4', true),
  (v_srv3_id, v_tenant_id, 'Barboterapia com Toalha Quente', 'Esfoliação facial, hidratação profunda com óleos essenciais e toalha vaporizada.', 'Barbearia', 65.00, 30, '#06b6d4', true),
  (v_srv4_id, v_tenant_id, 'Manicure & Pedicure Completa', 'Cutilagem cutilada, esmaltação premium e hidratação das cutículas.', 'Unhas', 85.00, 60, '#ec4899', true),
  (v_srv5_id, v_tenant_id, 'Alongamento em Gel (Fibra de Vidro)', 'Extensão estruturada de unhas com acabamento natural e esmaltação em gel.', 'Unhas', 220.00, 120, '#ec4899', true),
  (v_srv6_id, v_tenant_id, 'Limpeza de Pele Profunda com Peeling', 'Remoção de cravos, extração ultrassônica, máscara de argila e fototerapia LED.', 'Estética Facial', 180.00, 90, '#8b5cf6', true),
  (v_srv7_id, v_tenant_id, 'Mechas Criativas / Morena Iluminada', 'Técnica personalizada com plex protetor, tonalização e tratamento reconstrutor.', 'Cabelo', 480.00, 180, '#6366f1', true),
  (v_srv8_id, v_tenant_id, 'Massagem Relaxante com Pedras Quentes', 'Alívio de tensões musculares, aromaterapia e termoterapia corporal.', 'Corporal', 160.00, 60, '#10b981', true)
  ON CONFLICT (id) DO NOTHING;

  -- 7.4. Clientes
  INSERT INTO public.customers (id, tenant_id, name, phone, email, birth_date, notes, total_spent, appointments_count, last_visit_at, is_vip)
  VALUES
  (v_cust1_id, v_tenant_id, 'Juliana Mendes', '11987651234', 'juliana.mendes@gmail.com', '1992-05-14', 'Prefere esmaltes tons nudes e café sem açúcar.', 1250.00, 8, CURRENT_DATE - INTERVAL '15 days', true),
  (v_cust2_id, v_tenant_id, 'Rodrigo Antunes', '11998884433', 'rodrigo.antunes@outlook.com', '1988-11-20', 'Corte degradê navalhado nº 0.5 e barba desenhada.', 620.00, 5, CURRENT_DATE - INTERVAL '12 days', false),
  (v_cust3_id, v_tenant_id, 'Fernanda Oliveira', '11971239876', 'fernanda.oli@empresa.com.br', '1995-03-08', 'Sensibilidade no couro cabeludo, usar linha vegana.', 2450.00, 12, CURRENT_DATE - INTERVAL '10 days', true),
  (v_cust4_id, v_tenant_id, 'Gabriel Martins', '11982345678', 'gabriel.martins@yahoo.com.br', '1999-07-25', 'Costuma agendar no final da tarde às sextas.', 380.00, 3, CURRENT_DATE - INTERVAL '40 days', false),
  (v_cust5_id, v_tenant_id, 'Larissa Vasconcelos', '11993456789', 'larissa.vasconcelos@gmail.com', '1990-09-30', 'Faz manutenção de fibra a cada 20 dias.', 1780.00, 9, CURRENT_DATE - INTERVAL '14 days', true),
  (v_cust6_id, v_tenant_id, 'Bruno Carvalho', '11976543210', 'bruno.c@gmail.com', '1985-02-17', 'Cliente inativo há mais de 70 dias. Enviar cupom.', 210.00, 2, CURRENT_DATE - INTERVAL '75 days', false),
  (v_cust7_id, v_tenant_id, 'Patricia Souza', '11984561230', 'patricia.souza@gmail.com', '1987-12-05', 'Gosta de atendimento pontual.', 890.00, 6, CURRENT_DATE - INTERVAL '20 days', false)
  ON CONFLICT (id) DO NOTHING;

  -- 7.5. Agendamentos de Exemplo (Hoje)
  INSERT INTO public.appointments (tenant_id, customer_id, customer_name, customer_phone, service_id, service_name, service_price, professional_id, professional_name, date, start_time, end_time, duration_minutes, status, payment_method, total_price, notes)
  VALUES
  (v_tenant_id, v_cust1_id, 'Juliana Mendes', '11987651234', v_srv1_id, 'Corte Feminino & Escova Modeladora', 140.00, v_pro1_id, 'Camila Albuquerque', CURRENT_DATE, '09:00:00', '10:00:00', 60, 'completed', 'pix', 140.00, 'Cliente pontual.'),
  (v_tenant_id, v_cust2_id, 'Rodrigo Antunes', '11998884433', v_srv2_id, 'Corte Masculino Premium + Lavagem', 75.00, v_pro2_id, 'Lucas Ferreira', CURRENT_DATE, '10:00:00', '10:45:00', 45, 'confirmed', 'credit_card', 75.00, 'Degradê baixo.'),
  (v_tenant_id, v_cust3_id, 'Fernanda Oliveira', '11971239876', v_srv7_id, 'Mechas Criativas / Morena Iluminada', 480.00, v_pro1_id, 'Camila Albuquerque', CURRENT_DATE, '13:30:00', '16:30:00', 180, 'confirmed', 'unpaid', 480.00, 'Retocar raiz e hidratar.'),
  (v_tenant_id, v_cust5_id, 'Larissa Vasconcelos', '11993456789', v_srv5_id, 'Alongamento em Gel (Fibra de Vidro)', 220.00, v_pro3_id, 'Beatriz Lima', CURRENT_DATE, '14:00:00', '16:00:00', 120, 'pending', 'unpaid', 220.00, 'Agendou pelo site.'),
  (v_tenant_id, v_cust4_id, 'Gabriel Martins', '11982345678', v_srv3_id, 'Barboterapia com Toalha Quente', 65.00, v_pro2_id, 'Lucas Ferreira', CURRENT_DATE, '17:00:00', '17:30:00', 30, 'pending', 'unpaid', 65.00, 'Primeira vez no estabelecimento.'),
  (v_tenant_id, v_cust7_id, 'Patricia Souza', '11984561230', v_srv6_id, 'Limpeza de Pele Profunda com Peeling', 180.00, v_pro1_id, 'Camila Albuquerque', CURRENT_DATE, '17:30:00', '19:00:00', 90, 'confirmed', 'pix', 180.00, 'Pele mista.');

  -- 7.6. Modelos de WhatsApp
  INSERT INTO public.whatsapp_templates (id, tenant_id, name, category, content, variables)
  VALUES
  (
    v_tpl1_id, v_tenant_id, 'Confirmação Imediata', 'confirmation',
    E'Olá, {cliente_nome}! 👋\n\nSeu agendamento no *{empresa}* foi confirmado com sucesso!\n\n📅 *Data:* {data}\n⏰ *Horário:* {horario}\n✂️ *Serviço:* {servico}\n👤 *Profissional:* {profissional}\n\nCaso precise remarcar, responda a esta mensagem. Te esperamos! ✨',
    ARRAY['{cliente_nome}', '{empresa}', '{data}', '{horario}', '{servico}', '{profissional}']
  ),
  (
    v_tpl2_id, v_tenant_id, 'Lembrete 24h Antes', 'reminder',
    E'Oi, {cliente_nome}! Passando para lembrar do seu horário amanhã! 🔔\n\n📅 *Data:* {data} às *{horario}*\n✂️ *Serviço:* {servico} com {profissional}\n📍 *Local:* {empresa}\n\nPor favor, responda:\n*1* para Confirmar presença ✅\n*2* para Remarcar 🔄',
    ARRAY['{cliente_nome}', '{data}', '{horario}', '{servico}', '{profissional}', '{empresa}']
  ),
  (
    v_tpl3_id, v_tenant_id, 'Lembrete 2h Antes', 'reminder',
    E'Oi, {cliente_nome}! Seu horário no *{empresa}* é daqui a pouco, às *{horario}*! 🚗💨\n\nEstamos preparando tudo com carinho para o seu atendimento com {profissional}.\n\nSe tiver algum imprevisto no trânsito, nos avise por aqui!',
    ARRAY['{cliente_nome}', '{empresa}', '{horario}', '{profissional}']
  ),
  (
    v_tpl4_id, v_tenant_id, 'Pós-Atendimento & Avaliação', 'feedback',
    E'Olá, {cliente_nome}! Tudo bem? 💖\n\nEsperamos que você tenha amado o resultado do seu *{servico}* com {profissional} hoje no *{empresa}*!\n\nDe 1 a 5 estrelas, como você avalia sua experiência hoje?\nSua opinião é fundamental para nós! ⭐',
    ARRAY['{cliente_nome}', '{servico}', '{profissional}', '{empresa}']
  ),
  (
    v_tpl5_id, v_tenant_id, 'Resgate de Clientes Inativos', 'recovery',
    E'Oi {cliente_nome}, tudo bem? Sentimos sua falta aqui no *{empresa}*! 🌸\n\nQue tal tirar um momento especial para você esta semana?\n\nPreparamos um mimo: *15% DE DESCONTO* no seu próximo agendamento com o cupom *VOLTEI15*!\n\nResponda esta mensagem para escolher seu dia e horário preferido.',
    ARRAY['{cliente_nome}', '{empresa}']
  )
  ON CONFLICT (id) DO NOTHING;

  -- 7.7. Regras de Automação de WhatsApp
  INSERT INTO public.whatsapp_reminder_rules (tenant_id, title, description, trigger, is_active, template_id, timing_description, icon_name)
  VALUES
  (v_tenant_id, 'Confirmação de Agendamento', 'Envia mensagem com os detalhes assim que um novo agendamento é registrado no sistema.', 'booking_created', true, v_tpl1_id, 'Imediato ao agendar', 'CheckCircle2'),
  (v_tenant_id, 'Lembrete de Véspera (24h)', 'Envia lembrete 24 horas antes com solicitação de confirmação ou cancelamento.', 'before_24h', true, v_tpl2_id, '24 horas antes', 'CalendarClock'),
  (v_tenant_id, 'Lembrete Rápido (2h Antes)', 'Alerta de tolerância de chegada 2 horas antes do horário marcado.', 'before_2h', true, v_tpl3_id, '2 horas antes', 'Clock'),
  (v_tenant_id, 'Pesquisa de Satisfação', 'Solicita avaliação do atendimento após a finalização do serviço.', 'after_service', true, v_tpl4_id, '1 hora após o serviço', 'Star'),
  (v_tenant_id, 'Reativação de Inativos (30 dias)', 'Dispara cupom especial para clientes que não agendam há mais de 30 dias.', 'inactive_30d', false, v_tpl5_id, 'Após 30 dias sem visita', 'Sparkles');

  -- 7.8. Conexão WhatsApp Inicial
  INSERT INTO public.whatsapp_connections (tenant_id, status, phone_number, instance_name, battery_level, last_sync_at, total_sent_this_month, confirmation_rate)
  VALUES (
    v_tenant_id,
    'connected',
    '+55 (11) 98888-7777',
    'Studio Prime - WhatsApp Business',
    94,
    'Agora há pouco',
    148,
    92.5
  ) ON CONFLICT (tenant_id) DO NOTHING;

END $$;

-- ==============================================================================
-- 8. MÓDULO FINANCEIRO (ERP COMPLETO MULTI-TENANT)
-- ==============================================================================

-- 8.1. CONTAS A RECEBER
CREATE TABLE IF NOT EXISTS public.financial_receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_id UUID,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  service_name TEXT,
  professional_name TEXT,
  description TEXT NOT NULL,
  original_amount NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  surcharge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  final_amount NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_method TEXT,
  due_date DATE NOT NULL,
  paid_at DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  has_signal BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8.2. CONTAS A PAGAR
CREATE TABLE IF NOT EXISTS public.financial_payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  paid_at DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  supplier_name TEXT,
  professional_name TEXT,
  payment_method TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8.3. FORNECEDORES & TRANSPORTADORAS
CREATE TABLE IF NOT EXISTS public.financial_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade_name TEXT,
  document TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  carrier_name TEXT,
  category TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8.4. MERCADORIAS & ESTOQUE
CREATE TABLE IF NOT EXISTS public.financial_merchandise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  supplier_id UUID,
  supplier_name TEXT,
  carrier_name TEXT,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
  min_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'un',
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(10, 2),
  total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  last_restock_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8.5. POLÍTICA DE SINAL / ANTECIPAÇÃO
CREATE TABLE IF NOT EXISTS public.financial_deposit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL DEFAULT 'percentage',
  value NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
  pix_key TEXT,
  pix_key_type TEXT,
  require_pix_receipt BOOLEAN NOT NULL DEFAULT true,
  instructions TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES FINANCEIROS
CREATE INDEX IF NOT EXISTS idx_receivables_tenant_status ON public.financial_receivables(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_receivables_tenant_due ON public.financial_receivables(tenant_id, due_date);
CREATE INDEX IF NOT EXISTS idx_payables_tenant_status ON public.financial_payables(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payables_tenant_due ON public.financial_payables(tenant_id, due_date);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON public.financial_suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_tenant ON public.financial_merchandise(tenant_id);

-- POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE public.financial_receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_deposit_configs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Tenant isolation for financial_receivables"
    ON public.financial_receivables FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Tenant isolation for financial_payables"
    ON public.financial_payables FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Tenant isolation for financial_suppliers"
    ON public.financial_suppliers FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Tenant isolation for financial_merchandise"
    ON public.financial_merchandise FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Tenant isolation for financial_deposit_configs"
    ON public.financial_deposit_configs FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FIM DA MIGRATION SUPABASE
