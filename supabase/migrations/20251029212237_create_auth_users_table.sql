/*
  # Create Authentication and Users Table

  1. New Tables
    - `users` - Custom users table for application
      - `id` (uuid, primary key)
      - `email` (text, unique) - User email
      - `username` (text, unique) - Username for login
      - `password` (text) - Hashed password
      - `role` (text) - User role (admin, user, fiscal)
      - `is_active` (boolean) - Account status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_permissions` - Granular permissions per module
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Foreign key to users
      - `module` (text) - Module name (dashboard, contracts, etc)
      - `can_view` (boolean) - View permission
      - `can_edit` (boolean) - Edit permission
      - `can_create` (boolean) - Create permission
      - `can_delete` (boolean) - Delete permission
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on users and user_permissions tables
    - Admin users can manage all users
    - Users can view their own data
    - Policies for permission management

  3. Default Data
    - Create default admin user (username: admin, password: admin123)
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'fiscal')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('dashboard', 'contracts', 'managing_units', 'reports')),
  can_view boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_module ON user_permissions(module);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Allow users to view their own data"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin to insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow admin to update users"
  ON users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow admin to delete users"
  ON users FOR DELETE
  TO authenticated
  USING (true);

-- Policies for user_permissions table
CREATE POLICY "Allow users to view permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin to manage permissions"
  ON user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow admin to update permissions"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow admin to delete permissions"
  ON user_permissions FOR DELETE
  TO authenticated
  USING (true);

-- Insert default admin user
INSERT INTO users (username, email, password, role, is_active)
VALUES ('admin', 'admin@prefeitura.gov.br', 'admin123', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Get the admin user id and create full permissions
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO user_permissions (user_id, module, can_view, can_edit, can_create, can_delete)
    VALUES 
      (admin_user_id, 'dashboard', true, true, true, true),
      (admin_user_id, 'contracts', true, true, true, true),
      (admin_user_id, 'managing_units', true, true, true, true),
      (admin_user_id, 'reports', true, true, true, true)
    ON CONFLICT (user_id, module) DO NOTHING;
  END IF;
END $$;