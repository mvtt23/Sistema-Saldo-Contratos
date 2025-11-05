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
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      // Etapa 1: Buscar o usuário pelo username, solicitando a senha para verificação.
      // Nota: A RLS deve permitir que o usuário 'anon' selecione esta linha.
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, role, is_active, password') // Solicitando a coluna 'password'
        .eq('username', username)
        .maybeSingle();

      if (userError) {
        console.error("Supabase Error during sign-in query:", userError);
        return { error: { message: `Erro do Supabase: ${userError.message}` } };
      }

      if (!userData) {
        console.log("Login failed: User not found.");
        return { error: { message: 'Credenciais inválidas. Verifique seu usuário e senha.' } };
      }
      
      // Etapa 2: Verificar a senha no frontend (necessário para login customizado sem auth.users)
      if (userData.password !== password) {
          console.log("Login failed: Password mismatch.");
          return { error: { message: 'Credenciais inválidas. Verifique seu usuário e senha.' } };
      }

      if (!userData.is_active) {
        return { error: { message: 'Usuário inativo. Entre em contato com o administrador.' } };
      }

      // Buscar permissões do usuário
      const { data: permissionsData } = await supabase
        .from('user_permissions')
        .select('module, can_view, can_edit, can_create, can_delete')
        .eq('user_id', userData.id);

      const userWithPermissions: User = {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        is_active: userData.is_active,
        permissions: permissionsData || [],
      };

      setUser(userWithPermissions);
      localStorage.setItem('user', JSON.stringify(userWithPermissions));
      return { error: null };
    } catch (error) {
      console.error("Supabase login error (Catch block):", error);
      return { error: { message: 'Erro ao tentar conectar ao servidor.' } };
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