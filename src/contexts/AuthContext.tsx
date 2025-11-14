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
  is_admin: boolean; // Adicionado
  permissions: Permission[];
  prefeitura_id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (module: string, action: 'view' | 'edit' | 'create' | 'delete') => boolean;
  canAccessModule: (module: string) => boolean;
  
  // Novo estado para Super Admin
  selectedPrefeituraId: string | null;
  setPrefeituraSelecionada: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SELECTED_PREFEITURA_KEY = 'selected_prefeitura_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrefeituraId, setSelectedPrefeituraId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Se for admin, tenta carregar a prefeitura selecionada
        if (parsedUser.is_admin) {
          const storedPrefeitura = localStorage.getItem(SELECTED_PREFEITURA_KEY);
          setSelectedPrefeituraId(storedPrefeitura || parsedUser.prefeitura_id);
        } else {
          // Usuário normal usa o próprio ID
          setSelectedPrefeituraId(parsedUser.prefeitura_id);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const setPrefeituraSelecionada = (id: string) => {
    if (user?.is_admin) {
      setSelectedPrefeituraId(id);
      localStorage.setItem(SELECTED_PREFEITURA_KEY, id);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      console.log('Attempting login for user:', username);
      
      if (!supabase) {
        console.error('Supabase client not initialized');
        return { error: { message: 'Sistema de autenticação não configurado. Por favor, contate o administrador.' } };
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, role, is_active, password, prefeitura_id, is_admin')
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

      if (!userData.is_active) {
        console.log('User is inactive:', username);
        return { error: { message: 'Usuário inativo. Entre em contato com o administrador.' } };
      }

      if (userData.password !== password) {
        console.log('Password mismatch for user:', username);
        return { error: { message: 'Senha incorreta. Tente novamente.' } };
      }

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
        is_admin: userData.is_admin,
        permissions: permissionsData || [],
        prefeitura_id: userData.prefeitura_id,
      };

      // Configura a prefeitura selecionada após o login
      if (userWithPermissions.is_admin) {
        const storedPrefeitura = localStorage.getItem(SELECTED_PREFEITURA_KEY);
        setSelectedPrefeituraId(storedPrefeitura || userWithPermissions.prefeitura_id);
      } else {
        setSelectedPrefeituraId(userWithPermissions.prefeitura_id);
      }

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
    setSelectedPrefeituraId(null);
    localStorage.removeItem('user');
    localStorage.removeItem(SELECTED_PREFEITURA_KEY);
  };

  const hasPermission = (module: string, action: 'view' | 'edit' | 'create' | 'delete') => {
    if (!user) return false;
    if (user.is_admin) return true; 
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
    if (user.is_admin) return true;
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
    selectedPrefeituraId,
    setPrefeituraSelecionada,
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