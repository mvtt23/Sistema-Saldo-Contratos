import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Importando useAuth

interface User {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
  prefeitura_id: string; // Adicionado
}


interface ModulePermission {
  module: string;
  label: string;
  icon: string;
  can_view: boolean;
  can_edit: boolean;
  can_create: boolean;
  can_delete: boolean;
}

export function useUserManagement() {
  const { user: currentUser, selectedPrefeituraId } = useAuth(); // Obter prefeitura selecionada
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Record<string, ModulePermission[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Determina o ID da prefeitura a ser usado para filtros explícitos (leitura/exclusão)
  const targetPrefeituraId = currentUser?.is_admin ? selectedPrefeituraId : currentUser?.prefeitura_id;

  // Módulos disponíveis no sistema
  const modules: ModulePermission[] = useMemo(() => ([
    { module: 'dashboard', label: 'Visão Geral', icon: 'LayoutDashboard', can_view: true, can_edit: false, can_create: false, can_delete: false },
    { module: 'contracts', label: 'Contratos', icon: 'FileText', can_view: true, can_edit: false, can_create: false, can_delete: false },
    { module: 'managing_units', label: 'Unidades Gestoras', icon: 'Building2', can_view: true, can_edit: false, can_create: false, can_delete: false },
    { module: 'reports', label: 'Relatórios', icon: 'FileBarChart', can_view: true, can_edit: false, can_create: false, can_delete: false },
    { module: 'settings', label: 'Configurações', icon: 'Settings', can_view: true, can_edit: false, can_create: false, can_delete: false },
  ]), []);

  // Função auxiliar para obter permissões padrão por perfil
  const getDefaultPermissions = useCallback((role: string): ModulePermission[] => {
    // Módulos que sempre devem ter visualização ativa
    const baseModules = modules.map(module => {
      if (module.module === 'dashboard' || module.module === 'reports') {
        return { ...module, can_view: true, can_edit: false, can_create: false, can_delete: false };
      }
      return module;
    });

    if (role === 'viewer') {
      return baseModules.map(module => {
        if (module.module === 'contracts') {
          return { ...module, can_view: true };
        }
        return module;
      });
    } else if (role === 'fiscal') {
      // Fiscal: Contratos, Unidades Gestoras, Relatórios (todos com CRUD, exceto settings)
      return baseModules.map(module => {
        if (module.module === 'contracts' || module.module === 'managing_units' || module.module === 'reports') {
          return { ...module, can_view: true, can_edit: true, can_create: true, can_delete: true };
        }
        return module;
      });
    } else if (role === 'manager') {
      // Gerente: Contratos, Unidades Gestoras, Relatórios (com visualização e edição/criação)
      return baseModules.map(module => {
        if (module.module === 'contracts' || module.module === 'managing_units') {
          return { ...module, can_view: true, can_edit: true, can_create: true };
        }
        return module;
      });
    } else if (role === 'admin') {
      return modules.map(module => ({ ...module, can_view: true, can_edit: true, can_create: true, can_delete: true }));
    }
    return baseModules;
  }, [modules]);

  // Buscar todos os usuários
  const fetchUsers = useCallback(async () => {
    if (!targetPrefeituraId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('prefeitura_id', targetPrefeituraId) // FILTRO
        .order('created_at', { ascending: false });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('Could not find the table') || msg.includes('schema cache')) {
          setUsers([]);
          setPermissions({});
          return;
        }
        throw error;
      }

      setUsers(data || []);
      
      // Buscar permissões para cada usuário
      const userPermissions: Record<string, ModulePermission[]> = {};
      
      for (const user of data || []) {
        const { data: userPerms } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('prefeitura_id', targetPrefeituraId); // FILTRO

        // Mapear permissões para o formato correto
        const userModulePerms = modules.map(module => {
          const perm = userPerms?.find(p => p.module === module.module);
          
          // Aplicar regras de visualização obrigatória para dashboard e reports
          let can_view = perm?.can_view || false;
          if (module.module === 'dashboard' || module.module === 'reports') {
            can_view = true;
          }

          return {
            ...module,
            can_view: can_view,
            can_edit: perm?.can_edit || false,
            can_create: perm?.can_create || false,
            can_delete: perm?.can_delete || false,
          };
        });

        userPermissions[user.id] = userModulePerms;
      }

      setPermissions(userPermissions);
    } catch (error) {
      const msg = (error as Error)?.message || String(error);
      if (msg.includes('Could not find the table') || msg.includes('schema cache')) {
        setUsers([]);
        setPermissions({});
      } else {
        console.error('Erro ao buscar usuários:', error);
        toast({ title: "Erro", description: "Falha ao carregar usuários", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, [toast, targetPrefeituraId, modules]);

  // Criar novo usuário
  const createUser = useCallback(async (userData: { username: string; password: string; role: string; prefeituraId?: string }) => {
    const finalPrefeituraId = currentUser?.is_admin ? (userData.prefeituraId || selectedPrefeituraId) : currentUser?.prefeitura_id;
    
    if (!finalPrefeituraId) {
      toast({ title: "Erro", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    try {
      const normalizedUsername = userData.username.trim().toLowerCase();
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: normalizedUsername,
          password: userData.password.trim(),
          role: userData.role,
          is_active: true,
          prefeitura_id: finalPrefeituraId, // USANDO ID DINÂMICO
        }])
        .select()
        .single();

      if (error) throw error;

      // Criar permissões padrão baseadas no perfil
      const defaultPermissions = getDefaultPermissions(userData.role);
      
      const permissionsToInsert = defaultPermissions.map(perm => ({
        user_id: data.id,
        module: perm.module,
        can_view: perm.can_view,
        can_edit: perm.can_edit,
        can_create: perm.can_create,
        can_delete: perm.can_delete,
        prefeitura_id: finalPrefeituraId, // USANDO ID DINÂMICO
      }));

      await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);

      // Criar usuário no Supabase Auth com email sintético, sem trocar sessão atual
      try {
        const { data: current } = await supabase.auth.getSession();
        const previousSession = current?.session || null;
        const syntheticEmail = normalizedUsername.includes('@') ? normalizedUsername : `${normalizedUsername}@gerenciamento.local`;

        const signUpRes = await supabase.auth.signUp({ email: syntheticEmail, password: userData.password.trim() });
        const signUpUser = signUpRes.data?.user;
        const signUpError = signUpRes.error;
        if (signUpError) {
          const msg = signUpError.message?.toLowerCase() || '';
          if (!msg.includes('already registered')) {
            console.error('Erro ao criar usuário de autenticação:', signUpError);
            toast({ title: "Atenção", description: "Não foi possível criar o usuário de autenticação.", variant: "destructive" });
          }
        }

        // Mapear app_users para o uid criado
        if (signUpUser) {
          await supabase
            .from('app_users')
            .upsert({ uid: signUpUser.id, username: normalizedUsername, role: userData.role, prefeitura_id: finalPrefeituraId })
            .select('uid')
            .maybeSingle();
        }

        // Restaurar sessão do administrador, caso tenha sido alterada
        if (previousSession) {
          await supabase.auth.setSession({ access_token: previousSession.access_token, refresh_token: previousSession.refresh_token });
        } else {
          // Como fallback, efetuar signOut para não manter sessão do novo usuário
          await supabase.auth.signOut();
        }
      } catch (authErr) {
        console.error('Falha no fluxo de criação de Auth user:', authErr);
      }

      await fetchUsers(); // Recarregar lista
      toast({ title: "Sucesso", description: "Usuário criado com sucesso", variant: "success" });
      return true;
    } catch (error) {
      const msg = (error as Error)?.message || String(error);
      if (msg.includes('Could not find the table') || msg.includes('schema cache')) {
        const devId = `dev-${Date.now()}`;
        const newUser: User = {
          id: devId,
          username: userData.username,
          role: userData.role,
          is_active: true,
          created_at: new Date().toISOString(),
          prefeitura_id: finalPrefeituraId || 'dev',
        };
        setUsers(prev => [newUser, ...prev]);
        const defaultPermissions = getDefaultPermissions(userData.role);
        setPermissions(prev => ({ ...prev, [devId]: defaultPermissions }));
        toast({ title: "Sucesso", description: "Usuário criado (modo desenvolvimento)", variant: "success" });
        return true;
      }
      console.error('Erro ao criar usuário:', error);
      toast({ title: "Erro", description: "Falha ao criar usuário", variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast, currentUser?.is_admin, currentUser?.prefeitura_id, selectedPrefeituraId, getDefaultPermissions]);

  // Atualizar usuário
  const updateUser = useCallback(async (userId: string, userData: { username?: string; password?: string; role?: string; is_active?: boolean; prefeituraId?: string }) => {
    const finalPrefeituraId = currentUser?.is_admin ? (userData.prefeituraId || selectedPrefeituraId) : currentUser?.prefeitura_id;
    
    if (!finalPrefeituraId) {
      toast({ title: "Erro", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    try {
      const updatePayloadSafe: Record<string, unknown> = { ...userData };
      if (currentUser?.is_admin && userData.prefeituraId) {
        (updatePayloadSafe as Record<string, unknown>)["prefeitura_id"] = userData.prefeituraId;
        delete (updatePayloadSafe as Record<string, unknown>)["prefeituraId"];
      } else {
        delete (updatePayloadSafe as Record<string, unknown>)["prefeituraId"];
      }

      const { error } = await supabase
        .from('users')
        .update(updatePayloadSafe)
        .eq('id', userId)
        .eq('prefeitura_id', targetPrefeituraId); // Filtrando pelo ID ativo

      if (error) throw error;

      // Se o perfil mudou, atualizar permissões
      if (userData.role) {
        // Remover permissões antigas
        await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', userId)
          .eq('prefeitura_id', targetPrefeituraId); // Filtrando pelo ID ativo

        // Adicionar novas permissões
        const defaultPermissions = getDefaultPermissions(userData.role);
        
        const permissionsToInsert = defaultPermissions.map(perm => ({
          user_id: userId,
          module: perm.module,
          can_view: perm.can_view,
          can_edit: perm.can_edit,
          can_create: perm.can_create,
          can_delete: perm.can_delete,
          prefeitura_id: finalPrefeituraId, // USANDO ID DINÂMICO
        }));

        await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);
      }

      await fetchUsers(); // Recarregar lista
      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso", variant: "success" });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({ title: "Erro", description: "Falha ao atualizar usuário", variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast, currentUser?.is_admin, currentUser?.prefeitura_id, targetPrefeituraId, getDefaultPermissions, selectedPrefeituraId]);

  // Excluir usuário
  const deleteUser = useCallback(async (userId: string) => {
    if (!targetPrefeituraId) {
      toast({ title: "Erro", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    try {
      // Excluir permissões primeiro
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('prefeitura_id', targetPrefeituraId); // Filtrando pelo ID ativo

      // Excluir usuário
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .eq('prefeitura_id', targetPrefeituraId); // Filtrando pelo ID ativo

      if (error) throw error;

      await fetchUsers(); // Recarregar lista
      toast({ title: "Sucesso", description: "Usuário excluído com sucesso", variant: "success" });
      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({ title: "Erro", description: "Falha ao excluir usuário", variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast, targetPrefeituraId]);

  // Atualizar permissões específicas de um usuário
  const updateUserPermissions = useCallback(async (userId: string, userPermissions: ModulePermission[]) => {
    if (!targetPrefeituraId) {
      toast({ title: "Erro", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    try {
      // Remover permissões antigas
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('prefeitura_id', targetPrefeituraId); // Filtrando pelo ID ativo

      // Adicionar novas permissões
      const permissionsToInsert = userPermissions.map(perm => ({
        user_id: userId,
        module: perm.module,
        can_view: perm.can_view,
        can_edit: perm.can_edit,
        can_create: perm.can_create,
        can_delete: perm.can_delete,
        prefeitura_id: targetPrefeituraId, // USANDO ID DINÂMICO
      }));

      await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);

      await fetchUsers(); // Recarregar lista
      toast({ title: "Sucesso", description: "Permissões atualizadas com sucesso", variant: "success" });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
      toast({ title: "Erro", description: "Falha ao atualizar permissões", variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast, targetPrefeituraId]);

  // Carregar dados iniciais
  useEffect(() => {
    if (targetPrefeituraId) {
      fetchUsers();
    }
  }, [fetchUsers, targetPrefeituraId]);

  return {
    users,
    permissions,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserPermissions,
  };
}
