import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

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
  signIn: (username: string, password: string) => Promise<{ error: { message: string } | null }>;
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
  const checkSupabaseAuthReachable = async () => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${baseUrl}/auth/v1/.well-known/jwks.json`, { signal: controller.signal });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        if (parsedUser.is_admin) {
          const storedPrefeitura = localStorage.getItem(SELECTED_PREFEITURA_KEY);
          setSelectedPrefeituraId(storedPrefeitura || null);
        } else {
          setSelectedPrefeituraId(parsedUser.prefeitura_id);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    } else {
      const storedPrefeitura = localStorage.getItem(SELECTED_PREFEITURA_KEY);
      if (storedPrefeitura) {
        setSelectedPrefeituraId(storedPrefeitura);
      }
    }
    setLoading(false);
  }, []);

  const setPrefeituraSelecionada = (id: string) => {
    setSelectedPrefeituraId(id);
    localStorage.setItem(SELECTED_PREFEITURA_KEY, id);
  };

  const signIn = async (username: string, password: string) => {
    try {
      const normalizedUsername = username.trim().toLowerCase();
      const normalizedPassword = password.trim();
      console.log('Attempting login for user:', normalizedUsername);
      
      if (!supabase) {
        console.error('Supabase client not initialized');
        return { error: { message: 'Sistema de autenticação não configurado. Por favor, contate o administrador.' } };
      }
      
      const loginEmail = normalizedUsername.includes('@') ? normalizedUsername : `${normalizedUsername}@gerenciamento.local`;
      const reachable = await checkSupabaseAuthReachable();
      if (!reachable && import.meta.env.DEV) {
        const isAdminAlias = normalizedUsername === 'admin' || normalizedUsername === 'admin@gerenciamento.local';
        if (isAdminAlias) {
          const userWithPermissions = {
            id: 'dev-admin',
            username: 'admin',
            role: 'superadmin',
            is_admin: true,
            is_active: true,
            prefeitura_id: 'santa-quiteria',
            permissions: []
          };
          setUser(userWithPermissions);
          setSelectedPrefeituraId('santa-quiteria');
          localStorage.setItem('user', JSON.stringify(userWithPermissions));
          return { error: null };
        }
      }
      const signInRes = await supabase.auth.signInWithPassword({ email: loginEmail, password: normalizedPassword });
      const authError = signInRes.error;
      const authData = signInRes.data as unknown as { user: { id: string } | null; session: Session | null };

      if (authError) {
        const msg = authError.message || '';
        const lower = msg.toLowerCase();
        if (lower.includes('user not found')) {
          const signUpRes = await supabase.auth.signUp({ email: loginEmail, password: normalizedPassword });
          const signUpUser = signUpRes.data?.user;
          const signUpError = signUpRes.error;
          if (signUpError) {
            // Se já houver usuário, não tente cadastrar novamente
            if (signUpError.message.toLowerCase().includes('already registered')) {
              return { error: { message: 'Usuário já existente. Verifique suas credenciais.' } };
            }
            return { error: { message: signUpError.message } };
          }
          if (!signUpUser) {
            return { error: { message: 'Cadastro realizado, mas sessão não foi criada. Desative verificação de email no Supabase Auth para login imediato.' } };
          }
          await supabase
            .from('app_users')
            .upsert({ uid: signUpUser.id, username: normalizedUsername, role: 'viewer', prefeitura_id: null })
            .select('uid')
            .maybeSingle();
          const retry = await supabase.auth.signInWithPassword({ email: loginEmail, password: normalizedPassword });
          const retryData = retry.data as unknown as { user: { id: string } | null; session: Session | null };
          if (retry.error) {
            return { error: { message: retry.error.message } };
          }
          authData.user = retryData.user;
          authData.session = retryData.session;
        } else if (lower.includes('invalid login credentials')) {
          return { error: { message: 'Credenciais inválidas. Verifique seu usuário e senha.' } };
        } else if (lower.includes('email logins are disabled')) {
          return { error: { message: 'Login por email desabilitado no Supabase Auth. Ative Email + Password.' } };
        } else {
          return { error: { message: msg } };
        }
      }

      const authUser = authData?.user;
      if (!authUser) {
        return { error: { message: 'Falha na autenticação. Verifique suas credenciais.' } };
      }

      // Delega o carregamento de perfil e permissões para o onAuthStateChange;
      // retorna imediatamente para não travar o botão de login.
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during login:', error);
      return { error: { message: 'Ocorreu um erro inesperado. Tente novamente mais tarde.' } };
    }
  };

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const authUser = session.user;

        let { data: appUserData } = await supabase
          .from('app_users')
          .select('uid, username, role, prefeitura_id')
          .eq('uid', authUser.id)
          .maybeSingle();

        if (!appUserData) {
          const adminEmail = (authUser.email ?? '').toLowerCase();
          if (adminEmail === 'admin@gerenciamento.local') {
            const upsertRes = await supabase
              .from('app_users')
              .upsert({ uid: authUser.id, username: 'admin', role: 'superadmin', prefeitura_id: 'santa-quiteria' })
              .select('uid, username, role, prefeitura_id')
              .maybeSingle();
            appUserData = upsertRes.data ?? null;
          }
        }

        const effectiveRole = appUserData?.role || 'viewer';
        const effectiveIsAdmin = ['admin','superadmin'].includes(effectiveRole);
        const effectivePrefeituraId = appUserData?.prefeitura_id || null;

        const { data: localUserData } = await supabase
          .from('users')
          .select('id, username, role, is_active, prefeitura_id')
          .eq('username', appUserData?.username ?? authUser.email ?? '')
          .maybeSingle();

        const localUserId = localUserData?.id || authUser.id;

        const { data: permissionsData } = await supabase
          .from('user_permissions')
          .select('module, can_view, can_edit, can_create, can_delete')
          .eq('user_id', localUserId);

        const userWithPermissions = {
          id: localUserId,
          username: appUserData?.username ?? authUser.email ?? '',
          role: effectiveRole,
          is_admin: effectiveIsAdmin,
          is_active: true,
          prefeitura_id: effectivePrefeituraId,
          permissions: permissionsData || []
        };

        setUser(userWithPermissions);

        if (userWithPermissions.is_admin) {
          const storedPrefeitura = localStorage.getItem(SELECTED_PREFEITURA_KEY);
          setSelectedPrefeituraId(storedPrefeitura || null);
        } else {
          setSelectedPrefeituraId(userWithPermissions.prefeitura_id);
        }

        localStorage.setItem('user', JSON.stringify(userWithPermissions));
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSelectedPrefeituraId(null);
        localStorage.removeItem('user');
        localStorage.removeItem(SELECTED_PREFEITURA_KEY);
      }
    });

    return () => {
      subscription.subscription?.unsubscribe();
    };
  }, []);

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
