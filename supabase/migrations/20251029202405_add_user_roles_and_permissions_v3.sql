/*
  # Sistema de Gerenciamento de Usuários e Permissões

  1. Alterações na Tabela Users
    - Adiciona coluna `role` (tipo de usuário: admin ou user)
    - Adiciona coluna `is_active` (status do usuário)
    - Adiciona coluna `updated_at` (data de última atualização)
  
  2. Nova Tabela: user_permissions
    - `id` (uuid, chave primária)
    - `user_id` (uuid, referência para users)
    - `module` (text, nome do módulo/aba)
    - `can_view` (boolean, permissão de visualização)
    - `can_edit` (boolean, permissão de edição)
    - `can_create` (boolean, permissão de criação)
    - `can_delete` (boolean, permissão de exclusão)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)
  
  3. Segurança
    - Mantém RLS habilitado na tabela users
    - Habilita RLS na tabela user_permissions
    - Permite leitura pública para ambas as tabelas (autenticação será gerenciada pela aplicação)
  
  4. Notas Importantes
    - Usuários com role 'admin' têm acesso total a todas as funcionalidades
    - Permissões granulares são definidas por módulo para usuários comuns
    - Módulos disponíveis: dashboard, contracts, managing_units, reports, settings
*/

-- Adiciona novas colunas à tabela public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Atualiza o usuário Admin para ter role admin
UPDATE public.users SET role = 'admin', is_active = true WHERE username = 'Admin';

-- Cria tabela de permissões de usuários
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  can_view boolean DEFAULT false NOT NULL,
  can_edit boolean DEFAULT false NOT NULL,
  can_create boolean DEFAULT false NOT NULL,
  can_delete boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module)
);

-- Habilita RLS na tabela user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Policy para permitir leitura pública da tabela user_permissions
CREATE POLICY "Permitir leitura de permissões"
  ON public.user_permissions
  FOR SELECT
  TO public
  USING (true);

-- Policy para permitir inserção na tabela user_permissions
CREATE POLICY "Permitir criação de permissões"
  ON public.user_permissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy para permitir atualização na tabela user_permissions
CREATE POLICY "Permitir atualização de permissões"
  ON public.user_permissions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy para permitir exclusão na tabela user_permissions
CREATE POLICY "Permitir exclusão de permissões"
  ON public.user_permissions
  FOR DELETE
  TO public
  USING (true);

-- Adiciona policies para permitir INSERT, UPDATE e DELETE na tabela users
CREATE POLICY "Permitir criação de usuários"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de usuários"
  ON public.users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de usuários"
  ON public.users
  FOR DELETE
  TO public
  USING (true);

-- Cria índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_module ON public.user_permissions(module);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);