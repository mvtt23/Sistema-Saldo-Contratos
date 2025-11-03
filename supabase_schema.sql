-- =====================================================
-- SCHEMA COMPLETO DO BANCO DE DADOS SUPABASE
-- Sistema de Gestão de Contratos Públicos
-- =====================================================

-- =====================================================
-- 1. TABELA DE USUÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- 2. TABELA DE PERMISSÕES DE USUÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module text NOT NULL,
  can_view boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_module ON user_permissions(module);

-- =====================================================
-- 3. TABELA DE EMPRESAS/CONTRATADAS
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document text UNIQUE NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_document ON companies(document);

-- =====================================================
-- 4. TABELA DE UNIDADES GESTORAS
-- =====================================================
CREATE TABLE IF NOT EXISTS managing_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  responsible text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  fiscal_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_managing_units_code ON managing_units(code);

-- =====================================================
-- 5. TABELA DE PROGRAMAS
-- =====================================================
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit_id uuid NOT NULL REFERENCES managing_units(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_programs_unit_id ON programs(unit_id);

-- =====================================================
-- 6. TABELA DE CONTRATOS
-- =====================================================
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  modality text NOT NULL,
  is_carona boolean DEFAULT false,
  object text NOT NULL,
  contractor text NOT NULL,
  managing_unit text NOT NULL,
  original_value numeric NOT NULL,
  current_value numeric NOT NULL,
  used_value numeric DEFAULT 0,
  remaining_balance numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contracts_number ON contracts(number);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_managing_unit ON contracts(managing_unit);
CREATE INDEX IF NOT EXISTS idx_contracts_modality ON contracts(modality);

-- =====================================================
-- 7. TABELA DE ADITIVOS CONTRATUAIS
-- =====================================================
CREATE TABLE IF NOT EXISTS additives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL,
  value_change numeric DEFAULT 0,
  term_change integer DEFAULT 0,
  date date NOT NULL,
  justification text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_additives_contract_id ON additives(contract_id);
CREATE INDEX IF NOT EXISTS idx_additives_date ON additives(date);

-- =====================================================
-- 8. TABELA DE NOTAS FISCAIS
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  number text NOT NULL,
  value numeric NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);

-- =====================================================
-- DADOS INICIAIS (SEED)
-- =====================================================

-- Inserir usuário admin
INSERT INTO users (username, password, role, is_active) VALUES
('admin', 'admin123', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Inserir empresas
INSERT INTO companies (name, document, city, state) VALUES
('Papelaria Educacional Ltda', '12.345.678/0001-90', 'São Paulo', 'SP'),
('Limpeza Total Serviços Ltda', '98.765.432/0001-10', 'São Paulo', 'SP'),
('Construtora Cidade Nova Ltda', '11.222.333/0001-44', 'São Paulo', 'SP'),
('Auto Mecânica Central Ltda', '55.666.777/0001-88', 'São Paulo', 'SP'),
('Distribuidora Farmacêutica São Paulo Ltda', '99.888.777/0001-66', 'São Paulo', 'SP')
ON CONFLICT (document) DO NOTHING;

-- Inserir unidades gestoras
INSERT INTO managing_units (id, name, code, responsible, email, phone, fiscal_id) VALUES
('11111111-1111-1111-1111-111111111111', 'Secretaria de Educação', 'SEMED', 'Maria Silva', 'maria.silva@prefeitura.gov.br', '(11) 3333-1111', '1'),
('22222222-2222-2222-2222-222222222222', 'Secretaria de Saúde', 'SESAU', 'João Santos', 'joao.santos@prefeitura.gov.br', '(11) 3333-2222', '2'),
('33333333-3333-3333-3333-333333333333', 'Secretaria de Obras', 'SEOBR', 'Ana Costa', 'ana.costa@prefeitura.gov.br', '(11) 3333-3333', '3'),
('44444444-4444-4444-4444-444444444444', 'Secretaria de Transporte', 'SETRANS', 'Carlos Lima', 'carlos.lima@prefeitura.gov.br', '(11) 3333-4444', '1')
ON CONFLICT (id) DO NOTHING;

-- Inserir programas
INSERT INTO programs (name, unit_id) VALUES
('Programa de Educação Básica', '11111111-1111-1111-1111-111111111111'),
('Programa de Educação Infantil', '11111111-1111-1111-1111-111111111111'),
('Programa de Atenção Básica', '22222222-2222-2222-2222-222222222222'),
('Programa de Saúde da Família', '22222222-2222-2222-2222-222222222222'),
('Programa de Infraestrutura', '33333333-3333-3333-3333-333333333333'),
('Programa de Mobilidade Urbana', '44444444-4444-4444-4444-444444444444');

-- Inserir contratos
INSERT INTO contracts (id, number, modality, is_carona, object, contractor, managing_unit, original_value, current_value, used_value, remaining_balance, start_date, end_date, status) VALUES
('c1111111-1111-1111-1111-111111111111', '001/2024', 'pregao-eletronico', false, 'Fornecimento de material escolar para rede municipal de ensino', 'Papelaria Educacional Ltda', 'Secretaria de Educação', 150000, 180000, 95000, 85000, '2024-01-15', '2024-12-31', 'active'),
('c2222222-2222-2222-2222-222222222222', '002/2024', 'concorrencia-publica', false, 'Serviços de limpeza e conservação de unidades de saúde', 'Limpeza Total Serviços Ltda', 'Secretaria de Saúde', 240000, 240000, 160000, 80000, '2024-02-01', '2025-01-31', 'active'),
('c3333333-3333-3333-3333-333333333333', '003/2024', 'concorrencia-publica', false, 'Reforma e ampliação da Escola Municipal João da Silva', 'Construtora Cidade Nova Ltda', 'Secretaria de Obras', 500000, 650000, 325000, 325000, '2024-03-01', '2024-11-30', 'active'),
('c4444444-4444-4444-4444-444444444444', '004/2024', 'registro-preco', false, 'Manutenção preventiva e corretiva da frota municipal', 'Auto Mecânica Central Ltda', 'Secretaria de Transporte', 120000, 120000, 45000, 75000, '2024-01-01', '2024-12-31', 'active'),
('c5555555-5555-5555-5555-555555555555', '005/2024', 'dispensa', false, 'Fornecimento de medicamentos para farmácia básica', 'Distribuidora Farmacêutica São Paulo Ltda', 'Secretaria de Saúde', 300000, 300000, 300000, 0, '2024-01-01', '2024-06-30', 'completed')
ON CONFLICT (id) DO NOTHING;

-- Inserir aditivos
INSERT INTO additives (contract_id, type, description, value_change, term_change, date, justification) VALUES
('c1111111-1111-1111-1111-111111111111', 'value', 'Aditivo para aumento de valor devido à demanda adicional', 30000, 0, '2024-06-15', 'Aumento do número de alunos matriculados'),
('c3333333-3333-3333-3333-333333333333', 'both', 'Aditivo para ampliação do projeto e extensão de prazo', 150000, 60, '2024-07-15', 'Necessidade de ampliação da área construída conforme demanda da comunidade');

-- Inserir notas fiscais
INSERT INTO invoices (contract_id, number, value, date) VALUES
('c1111111-1111-1111-1111-111111111111', 'NF-001', 25000, '2024-02-01'),
('c1111111-1111-1111-1111-111111111111', 'NF-002', 35000, '2024-03-01'),
('c1111111-1111-1111-1111-111111111111', 'NF-003', 35000, '2024-04-01'),
('c2222222-2222-2222-2222-222222222222', 'NF-101', 40000, '2024-02-28'),
('c2222222-2222-2222-2222-222222222222', 'NF-102', 40000, '2024-03-31'),
('c2222222-2222-2222-2222-222222222222', 'NF-103', 40000, '2024-04-30'),
('c2222222-2222-2222-2222-222222222222', 'NF-104', 40000, '2024-05-31'),
('c3333333-3333-3333-3333-333333333333', 'NF-201', 125000, '2024-04-15'),
('c3333333-3333-3333-3333-333333333333', 'NF-202', 200000, '2024-06-15'),
('c4444444-4444-4444-4444-444444444444', 'NF-301', 15000, '2024-02-05'),
('c4444444-4444-4444-4444-444444444444', 'NF-302', 18000, '2024-03-05'),
('c4444444-4444-4444-4444-444444444444', 'NF-303', 12000, '2024-04-05'),
('c5555555-5555-5555-5555-555555555555', 'NF-401', 100000, '2024-02-15'),
('c5555555-5555-5555-5555-555555555555', 'NF-402', 100000, '2024-04-15'),
('c5555555-5555-5555-5555-555555555555', 'NF-403', 100000, '2024-06-15');

-- =====================================================
-- RESUMO DAS TABELAS
-- =====================================================
-- 1. users - Usuários do sistema
-- 2. user_permissions - Permissões dos usuários por módulo
-- 3. companies - Empresas contratadas
-- 4. managing_units - Unidades gestoras (secretarias)
-- 5. programs - Programas vinculados às unidades
-- 6. contracts - Contratos principais
-- 7. additives - Aditivos contratuais
-- 8. invoices - Notas fiscais dos contratos
