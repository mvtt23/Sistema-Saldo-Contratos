import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Permission {
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_create: boolean;
  can_delete: boolean;
}

interface User {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  permissions: Permission[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (module: string, action: 'view' | 'edit' | 'create' | 'delete') => boolean;
  canAccessModule: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuário Admin Mockado para desenvolvimento
const MOCK_ADMIN_USER: User = {
  id: 'admin-mock-id',
  username: 'admin',
  role: 'admin',
  is_active: true,
  permissions: [
    { module: 'dashboard', can_view: true, can_edit: true, can_create: true, can_delete: true, id: '1', user_id: 'admin-mock-id' },
    { module: 'contracts', can_view: true, can_edit: true, can_create: true, can_delete: true, id: '2', user_id: 'admin-mock-id' },
    { module: 'managing_units', can_view: true, can_edit: true, can_create: true, can_delete: true, id: '3', user_id: 'admin-mock-id' },
    { module: 'reports', can_view: true, can_edit: true, can_create: true, can_delete: true, id: '4', user_id: 'admin-mock-id' },
    { module: 'settings', can_view: true, can_edit: true, can_create: true, can_delete: true, id: '5', user_id: 'admin-mock-id' },
  ],
};


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    // Lógica de login mockado para o admin padrão
    if (username === 'admin' && password === 'admin123') {
      setUser(MOCK_ADMIN_USER);
      localStorage.setItem('user', JSON.stringify(MOCK_ADMIN_USER));
      return { error: null };
    }
    
    // Lógica de login real (Supabase)
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, role, is_active')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();

      if (userError || !userData) {
        return { error: { message: 'Credenciais inválidas' } };
      }

      if (!userData.is_active) {
        return { error: { message: 'Usuário inativo. Entre em contato com o administrador.' } };
      }

      const { data: permissionsData } = await supabase
        .from('user_permissions')
        .select('module, can_view, can_edit, can_create, can_delete')
        .eq('user_id', userData.id);

      const userWithPermissions = {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        is_active: userData.is_active,
        permissions: permissionsData || [],
      };

      setUser(userWithPermissions as User);
      localStorage.setItem('user', JSON.stringify(userWithPermissions));
      return { error: null };
    } catch (error) {
      console.error("Supabase login error:", error);
      return { error };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasPermission = (module: string, action: 'view' | 'edit' | 'create' | 'delete') => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    const permission = user.permissions.find(p => p.module === module);
    if (!permission) return false;

    const actionMap = {
      view: permission.can_view,
      edit: permission.can_edit,
      create: permission.can_create,
      delete: permission.can_delete,
    };

    return actionMap[action];
  };

  const canAccessModule = (module: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    const permission = user.permissions.find(p => p.module === module);
    return permission ? permission.can_view : false;
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    hasPermission,
    canAccessModule,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}