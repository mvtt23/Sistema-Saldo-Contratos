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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      console.log('Attempting login for user:', username);
      
      // Buscar o usuário pelo username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, role, is_active, password')
        .eq('username', username)
        .maybeSingle();

      if (userError) {
        console.error('Supabase error during user query:', userError);
        return { error: { message: `Erro ao buscar usuário: ${userError.message}` } };
      }

      if (!userData) {
        console.log('User not found:', username);
        return { error: { message: 'Usuário não encontrado. Verifique o nome de usuário.' } };
      }

      // Verificar se o usuário está ativo
      if (!userData.is_active) {
        console.log('User is inactive:', username);
        return { error: { message: 'Usuário inativo. Entre em contato com o administrador.' } };
      }

      // Verificar a senha (em um ambiente real, use hashing)
      if (userData.password !== password) {
        console.log('Password mismatch for user:', username);
        return { error: { message: 'Senha incorreta. Tente novamente.' } };
      }

      // Buscar permissões do usuário
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('module, can_view, can_edit, can_create, can_delete')
        .eq('user_id', userData.id);

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        return { error: { message: 'Erro ao carregar permissões do usuário.' } };
      }

      const userWithPermissions: User = {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        is_active: userData.is_active,
        permissions: permissionsData || [],
      };

      console.log('Login successful for user:', username);
      setUser(userWithPermissions);
      localStorage.setItem('user', JSON.stringify(userWithPermissions));
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during login:', error);
      return { error: { message: 'Ocorreu um erro inesperado. Tente novamente mais tarde.' } };
    }
  };

  const signOut = async () => {
    console.log('Signing out user:', user?.username);
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