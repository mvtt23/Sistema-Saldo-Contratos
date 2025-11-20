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
  signIn: (username: string, password: string) => Promise<{ error: { message: string; raw?: string } | null }>;
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
      
      const signInRes = await supabase.auth.signInWithPassword({ email: loginEmail, password: normalizedPassword });
      const authError = signInRes.error;
      const authData = signInRes.data as unknown as { user: { id: string } | null; session: Session | null };

      if (authError) {
        const msg = authError.message || '';
        const status = (authError as unknown as { status?: number }).status ?? 0;
        console.debug('Auth error', { status, msg });
        const isAdminAlias = loginEmail.toLowerCase() === 'admin@gerenciamento.local';
        if (isAdminAlias) {
          const signUpRes = await supabase.auth.signUp({ email: loginEmail, password: normalizedPassword });
          if (signUpRes.error && !signUpRes.error.message.toLowerCase().includes('already registered')) {
            return { error: { message: 'Falha ao criar usuário admin.', raw: signUpRes.error.message } };
          }
          const retry = await supabase.auth.signInWithPassword({ email: loginEmail, password: normalizedPassword });
          if (retry.error) {
            return { error: { message: 'Falha ao autenticar após cadastro.', raw: retry.error.message } };
          }
          return { error: null };
        }
        if (status === 400) {
          return { error: { message: 'Credenciais inválidas. Verifique seu usuário e senha.', raw: msg } };
        }
        if (status === 403) {
          return { error: { message: 'Login por email desabilitado no Supabase Auth. Ative Email + Password.', raw: msg } };
        }
        if (status === 0 || status >= 500) {
          return { error: { message: 'Servidor indisponível ou conexão lenta. Tente novamente.', raw: msg } };
        }
        return { error: { message: msg, raw: msg } };
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
      const raw = (error as Error)?.message || 'unknown';
      return { error: { message: 'Ocorreu um erro inesperado. Tente novamente mais tarde.', raw } };
    }
  };

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const authUser = session.user;

        const { data: initialAppUserData, error: appUsersError } = await supabase
          .from('app_users')
          .select('uid, username, role, prefeitura_id')
          .eq('uid', authUser.id)
          .maybeSingle();
        let appUserData = initialAppUserData;

        const adminEmail = (authUser.email ?? '').toLowerCase();
        if ((!appUserData || appUsersError) && adminEmail === 'admin@gerenciamento.local') {
          const upsertRes = await supabase
            .from('app_users')
            .upsert({ uid: authUser.id, username: 'admin', role: 'superadmin', prefeitura_id: 'santa-quiteria' })
            .select('uid, username, role, prefeitura_id')
            .maybeSingle();
          appUserData = upsertRes.data ?? null;
        } else if (appUserData && adminEmail === 'admin@gerenciamento.local' && appUserData.role !== 'superadmin') {
          const upsertRes = await supabase
            .from('app_users')
            .upsert({ uid: authUser.id, username: 'admin', role: 'superadmin', prefeitura_id: 'santa-quiteria' })
            .select('uid, username, role, prefeitura_id')
            .maybeSingle();
          appUserData = upsertRes.data ?? appUserData;
        }

        const effectiveRole = appUserData?.role || ((adminEmail === 'admin@gerenciamento.local') ? 'superadmin' : 'viewer');
        const effectiveIsAdmin = ['admin','superadmin'].includes(effectiveRole);
        const effectivePrefeituraId = appUserData?.prefeitura_id || ((adminEmail === 'admin@gerenciamento.local') ? 'santa-quiteria' : null);

        const userWithPermissions = {
          id: authUser.id,
          username: appUserData?.username ?? authUser.email ?? '',
          role: effectiveRole,
          is_admin: effectiveIsAdmin,
          is_active: true,
          prefeitura_id: effectivePrefeituraId,
          permissions: []
        };

        setUser(userWithPermissions);

        if (userWithPermissions.is_admin) {
          const storedPrefeitura = localStorage.getItem(SELECTED_PREFEITURA_KEY);
          const effectiveSelected = storedPrefeitura || userWithPermissions.prefeitura_id || null;
          setSelectedPrefeituraId(effectiveSelected);
        } else {
          setSelectedPrefeituraId(userWithPermissions.prefeitura_id);
        }

        localStorage.setItem('user', JSON.stringify(userWithPermissions));
        setLoading(false);
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSelectedPrefeituraId(null);
        localStorage.removeItem('user');
        localStorage.removeItem(SELECTED_PREFEITURA_KEY);
        setLoading(false);
      }
    });

    return () => {
      subscription.subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('Signing out user:', user?.username);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erro ao encerrar sessão', e);
    }
    setUser(null);
    setSelectedPrefeituraId(null);
    localStorage.removeItem('user');
    localStorage.removeItem(SELECTED_PREFEITURA_KEY);
  };

  const hasPermission = (module: string, action: 'view' | 'edit' | 'create' | 'delete') => {
    if (!user) return false;
    if (user.is_admin || user.role === 'admin' || user.role === 'superadmin') return true;

    if (user.role === 'viewer') {
      if (action !== 'view') return false;
      return ['dashboard','contracts','reports'].includes(module);
    }

    if (user.role === 'manager') {
      if (action === 'view') return ['dashboard','contracts','reports','managing_units','settings'].includes(module);
      if (action === 'edit' || action === 'create') return ['contracts','managing_units'].includes(module);
      if (action === 'delete') return false;
      return false;
    }

    if (user.role === 'fiscal') {
      if (action === 'view') return ['dashboard','contracts','reports','managing_units'].includes(module);
      if (action === 'edit' || action === 'create' || action === 'delete') return ['contracts','managing_units','reports'].includes(module);
      return false;
    }

    return false;
  };

  const canAccessModule = (module: string) => {
    return hasPermission(module, 'view');
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
