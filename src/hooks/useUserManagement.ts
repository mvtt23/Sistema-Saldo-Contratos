import { useState, useCallback, useEffect } from 'react';
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

interface Permission {
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_create: boolean;
  can_delete: boolean;
}

interface ModulePermission {
  module: string;
  label: string;
  icon: any;
  can_view: boolean;
  can_edit: boolean;
  can_create: boolean;
  can_delete: boolean;
}

export function useUserManagement() {
  const { user: currentUser } = useAuth(); // Obter usuário logado para o prefeitura_id
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Record<string, ModulePermission[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const prefeituraId = currentUser?.prefeitura_id || 'default_municipality';

  // Módulos disponíveis no sistema
  const modules: ModulePermission[] = [
    { module: 'dashboard', label: 'Visão Geral', icon: 'LayoutDashboard', can_view: true, can_edit: false, can_create: false, can_delete: false },
    { module: 'contracts', label: 'Contratos', icon: 'FileText', can_view: true, can_edit: false, can_create: false, can_delete: false },
    { module: 'managing_units', label: 'Unidades Gestoras', icon: 'Building2', can_view: true, can_edit: false, can_create: false, can_delete: false },
    { module: 'reports', label: 'Relatórios', icon: 'FileBarChart', can_view: true, can_edit: false, can_create: false, can_delete: false },
    { module: 'settings', label: 'Configurações', icon: 'Settings', can_view: true, can_edit: false, can_create: false, can_delete: false },
  ];

  // Função auxiliar para obter permissões padrão por perfil
  const getDefaultPermissions = (role: string): ModulePermission[] => {
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
  };

  // Buscar todos os usuários
  const fetchUsers = useCallback(async () => {
    if (!prefeituraId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('prefeitura_id', prefeituraId) // FILTRO
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      
      // Buscar permissões para cada usuário
      const userPermissions: Record<string, ModulePermission[]> = {};
      
      for (const user of data || []) {
        const { data: userPerms } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('prefeitura_id', prefeituraId); // FILTRO

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
      console.error('Erro ao buscar usuários:', error);
      toast({ title: "Erro", description: "Falha ao carregar usuários", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, prefeituraId]);

  // Criar novo usuário
  const createUser = useCallback(async (userData: { username: string; password: string; role: string }) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: userData.username,
          password: userData.password,
          role: userData.role,
          is_active: true,
          prefeitura_id: prefeituraId, // INSERINDO prefeitura_id
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
        prefeitura_id: prefeituraId, // INSERINDO prefeitura_id
      }));

      await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);

      await fetchUsers(); // Recarregar lista
      toast({ title: "Sucesso", description: "Usuário criado com sucesso", variant: "success" });
      return true;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({ title: "Erro", description: "Falha ao criar usuário", variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast, prefeituraId]);

  // Atualizar usuário
  const updateUser = useCallback(async (userId: string, userData: { username?: string; password?: string; role?: string; is_active?: boolean }) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .eq('prefeitura_id', prefeituraId); // Filtrando por prefeitura_id

      if (error) throw error;

      // Se o perfil mudou, atualizar permissões
      if (userData.role) {
        // Remover permissões antigas
        await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', userId)
          .eq('prefeitura_id', prefeituraId); // Filtrando por prefeitura_id

        // Adicionar novas permissões
        const defaultPermissions = getDefaultPermissions(userData.role);
        
        const permissionsToInsert = defaultPermissions.map(perm => ({
          user_id: userId,
          module: perm.module,
          can_view: perm.can_view,
          can_edit: perm.can_edit,
          can_create: perm.can_create,
          can_delete: perm.can_delete,
          prefeitura_id: prefeituraId, // INSERINDO prefeitura_id
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
  }, [fetchUsers, toast, prefeituraId]);

  // Excluir usuário
  const deleteUser = useCallback(async (userId: string) => {
    try {
      // Excluir permissões primeiro
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('prefeitura_id', prefeituraId); // Filtrando por prefeitura_id

      // Excluir usuário
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .eq('prefeitura_id', prefeituraId); // Filtrando por prefeitura_id

      if (error) throw error;

      await fetchUsers(); // Recarregar lista
      toast({ title: "Sucesso", description: "Usuário excluído com sucesso", variant: "success" });
      return true;
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({ title: "Erro", description: "Falha ao excluir usuário", variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast, prefeituraId]);

  // Atualizar permissões específicas de um usuário
  const updateUserPermissions = useCallback(async (userId: string, userPermissions: ModulePermission[]) => {
    try {
      // Remover permissões antigas
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('prefeitura_id', prefeituraId); // Filtrando por prefeitura_id

      // Adicionar novas permissões
      const permissionsToInsert = userPermissions.map(perm => ({
        user_id: userId,
        module: perm.module,
        can_view: perm.can_view,
        can_edit: perm.can_edit,
        can_create: perm.can_create,
        can_delete: perm.can_delete,
        prefeitura_id: prefeituraId, // INSERINDO prefeitura_id
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
  }, [fetchUsers, toast, prefeituraId]);

  // Carregar dados iniciais
  useEffect(() => {
    if (currentUser?.prefeitura_id) {
      fetchUsers();
    }
  }, [fetchUsers, currentUser?.prefeitura_id]);

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