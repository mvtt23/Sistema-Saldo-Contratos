-- Criar tabela users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela user_permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  UNIQUE(user_id, module)
);

-- Criar usuário admin (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN
    INSERT INTO users (username, password, role, is_active)
    VALUES ('admin', 'admin123', 'admin', true);
  END IF;
END $$;

-- Obter o ID do usuário admin
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
  
  IF admin_user_id IS NOT NULL THEN
    -- Atribuir permissões ao admin (se já não existirem)
    INSERT INTO user_permissions (user_id, module, can_view, can_edit, can_create, can_delete)
    SELECT admin_user_id, 'dashboard', true, true, true, true
    WHERE NOT EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = admin_user_id AND module = 'dashboard'
    );

    INSERT INTO user_permissions (user_id, module, can_view, can_edit, can_create, can_delete)
    SELECT admin_user_id, 'contracts', true, true, true, true
    WHERE NOT EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = admin_user_id AND module = 'contracts'
    );

    INSERT INTO user_permissions (user_id, module, can_view, can_edit, can_create, can_delete)
    SELECT admin_user_id, 'managing_units', true, true, true, true
    WHERE NOT EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = admin_user_id AND module = 'managing_units'
    );

    INSERT INTO user_permissions (user_id, module, can_view, can_edit, can_create, can_delete)
    SELECT admin_user_id, 'reports', true, true, true, true
    WHERE NOT EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = admin_user_id AND module = 'reports'
    );

    INSERT INTO user_permissions (user_id, module, can_view, can_edit, can_create, can_delete)
    SELECT admin_user_id, 'settings', true, true, true, true
    WHERE NOT EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = admin_user_id AND module = 'settings'
    );
  END IF;
END $$;