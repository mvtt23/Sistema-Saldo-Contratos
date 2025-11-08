import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';

interface User {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: string;
  user_id: string;
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

const MODULES = [
  { module: 'dashboard', label: 'Dashboard', icon: FileText },
  { module: 'contracts', label: 'Contratos', icon: FileText },
  { module: 'managing_units', label: 'Unidades Gestoras', icon: FileText },
  { module: 'reports', label: 'Relatórios', icon: FileText },
];

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Record<string, ModulePermission[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função para buscar todos os usuários e suas permissões
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Buscar permissões
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*');

      if (permissionsError) throw permissionsError;

      // Organizar permissões por usuário
      const permissionsByUser: Record<string, ModulePermission[]> = {};
      permissionsData?.forEach(permission => {
        if (!permissionsByUser[permission.user_id]) {
          permissionsByUser[permission.user_id] = MODULES.map(mod => ({
            module: mod.module,
            label: mod.label,
            icon: mod.icon,
            can_view: false,
            can_edit: false,
            can_create: false,
            can_delete: false
          }));
        }
        const userPermission = permissionsByUser[permission.user_id].find(p => p.module === permission.module);
        if (userPermission) {
          userPermission.can_view = permission.can_view;
          userPermission.can_edit = permission.can_edit;
          userPermission.can_create = permission.can_create;
          userPermission.can_delete = permission.can_delete;
        }
      });

      setUsers(usersData || []);
      setPermissions(permissionsByUser);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: "Erro", description: "Falha ao carregar usuários.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Função para criar um novo usuário
  const createUser = useCallback(async (userData: { username: string; password: string; role: string }) => {
    try {
      // Primeiro, criar o usuário
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          username: userData.username,
          password: userData.password,
          role: userData.role,
          is_active: true
        }])
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        throw userError;
      }

      // Criar permissões padrão para o novo usuário
      const defaultPermissions = MODULES.map(mod => ({
        user_id: newUser.id,
        module: mod.module,
        can_view: true,
        can_edit: false,
        can_create: false,
        can_delete: false
      }));

      const { error: permissionsError } = await supabase
        .from('user_permissions')
        .insert(defaultPermissions);

      if (permissionsError) {
        console.error('Error creating permissions:', permissionsError);
        // Se falhar ao criar permissões, exclua o usuário para manter consistência
        await supabase
          .from('users')
          .delete()
          .eq('id', newUser.id);
        throw permissionsError;
      }

      await fetchUsers(); // Recarregar a lista
      toast({ title: "Sucesso", description: "Usuário criado com sucesso.", variant: "success" });
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      toast({ title: "Erro", description: "Falha ao criar usuário.", variant: "destructive" });
      return null;
    }
  }, [fetchUsers, toast]);

  // Função para atualizar um usuário
  const updateUser = useCallback(async (userId: string, userData: { username?: string; password?: string; role?: string; is_active?: boolean }) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers(); // Recarregar a lista
      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      toast({ title: "Erro", description: "Falha ao atualizar usuário.", variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast]);

  // Função para excluir um usuário
  const deleteUser = useCallback(async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return false;

    try {
      // Excluir permissões primeiro
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      // Excluir usuário
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers(); // Recarregar a lista
      toast({ title: "Sucesso", description: "Usuário excluído com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: "Erro", description: "Falha ao excluir usuário.", variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast]);

  // Função para atualizar permissões de um usuário
  const updateUserPermissions = useCallback(async (userId: string, userPermissions: ModulePermission[]) => {
    try {
      // Preparar dados para atualização
      const permissionsToUpdate = userPermissions.map(perm => ({
        user_id: userId,
        module: perm.module,
        can_view: perm.can_view,
        can_edit: perm.can_edit,
        can_create: perm.can_create,
        can_delete: perm.can_delete
      }));

      // Deletar permissões existentes
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      // Inserir novas permissões
      const { error } = await supabase
        .from('user_permissions')
        .insert(permissionsToUpdate);

      if (error) throw error;

      await fetchUsers(); // Recarregar a lista
      toast({ title: "Sucesso", description: "Permissões atualizadas com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({ title: "Erro", description: "Falha ao atualizar permissões.", variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast]);

  return {
    users,
    permissions,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserPermissions
  };
}