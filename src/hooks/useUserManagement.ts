import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth
import { FileText, Building2, LayoutDashboard, FileBarChart } from 'lucide-react';

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
  { module: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { module: 'contracts', label: 'Contratos', icon: FileText },
  { module: 'managing-units', label: 'Unidades Gestoras', icon: Building2 },
  { module: 'reports', label: 'Relatórios', icon: FileBarChart },
  { module: 'settings', label: 'Configurações', icon: FileText }, // Adicionado settings
];

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Record<string, ModulePermission[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth(); // Usar o contexto de autenticação

  // Função para buscar todos os usuários e suas permissões
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      // Buscar permissões
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*');

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        throw permissionsError;
      }

      // Organizar permissões por usuário
      const permissionsByUser: Record<string, ModulePermission[]> = {};
      
      // Inicializa a estrutura de permissões para todos os módulos
      const initializePermissions = () => MODULES.map(mod => ({
        module: mod.module,
        label: mod.label,
        icon: mod.icon,
        can_view: false,
        can_edit: false,
        can_create: false,
        can_delete: false
      }));

      usersData?.forEach(userData => {
        const userId = userData.id;
        permissionsByUser[userId] = initializePermissions();
        
        // Preenche com as permissões existentes
        permissionsData?.filter(p => p.user_id === userId).forEach(permission => {
          const userPermission = permissionsByUser[userId].find(p => p.module === permission.module);
          if (userPermission) {
            userPermission.can_view = permission.can_view;
            userPermission.can_edit = permission.can_edit;
            userPermission.can_create = permission.can_create;
            userPermission.can_delete = permission.can_delete;
          }
        });
      });

      setUsers(usersData || []);
      setPermissions(permissionsByUser);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      const errorMessage = error instanceof Error ? error.message : 'Falha ao carregar usuários.';
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Função para criar um novo usuário
  const createUser = useCallback(async (userData: { username: string; password: string; role: string }) => {
    if (user?.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Somente administradores podem criar usuários.", variant: "destructive" });
      return null;
    }
    
    let newUser = null;
    
    try {
      // 1. Criar o usuário
      const { data: createdUser, error: userError } = await supabase
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
        const errorMessage = userError.message || 'Erro ao criar usuário.';
        throw new Error(errorMessage);
      }
      
      newUser = createdUser;
      console.log('User created successfully:', newUser);

      // 2. Criar permissões padrão para o novo usuário
      const defaultPermissions = MODULES.map(mod => ({
        user_id: newUser!.id,
        module: mod.module,
        // Permissões padrão: Visualizador tem acesso a tudo, exceto settings
        can_view: mod.module !== 'settings', 
        can_edit: false,
        can_create: false,
        can_delete: false
      }));

      console.log('Creating default permissions:', defaultPermissions);

      const { error: permissionsError } = await supabase
        .from('user_permissions')
        .insert(defaultPermissions);

      if (permissionsError) {
        console.error('Error creating permissions:', permissionsError);
        // Não lançamos o erro aqui, mas logamos. Se a inserção de permissões falhar,
        // o usuário ainda existe, mas sem permissões iniciais.
        // Vamos lançar um erro para que o catch seja acionado, mas sem deletar o usuário.
        throw new Error(`Usuário criado, mas falha ao definir permissões: ${permissionsError.message}`);
      }

      console.log('Permissions created successfully');
      await fetchUsers(); // Recarregar a lista
      toast({ title: "Sucesso", description: "Usuário criado com sucesso.", variant: "success" });
      return newUser;
    } catch (error) {
      console.error('Error in createUser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Falha ao criar usuário.';
      
      // Se o erro ocorreu após a criação do usuário (newUser existe), 
      // mas antes ou durante a criação das permissões, o usuário foi criado.
      // Se o erro for de duplicidade, o newUser será null.
      if (newUser && errorMessage.includes('falha ao definir permissões')) {
         // Se o usuário foi criado, mas as permissões falharam, mostramos um aviso, mas retornamos sucesso parcial.
         toast({ title: "Aviso", description: `Usuário ${newUser.username} criado, mas as permissões iniciais falharam. Edite as permissões manualmente.`, variant: "warning" });
         await fetchUsers();
         return newUser;
      }
      
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      return null;
    }
  }, [fetchUsers, toast, user?.role]);

  // Função para atualizar um usuário
  const updateUser = useCallback(async (userId: string, userData: { username?: string; password?: string; role?: string; is_active?: boolean }) => {
    if (user?.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Somente administradores podem atualizar usuários.", variant: "destructive" });
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        const errorMessage = error.message || 'Erro ao atualizar usuário.';
        throw new Error(errorMessage);
      }

      await fetchUsers(); // Recarregar a lista
      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar usuário.';
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast, user?.role]);

  // Função para excluir um usuário
  const deleteUser = useCallback(async (userId: string) => {
    if (user?.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Somente administradores podem excluir usuários.", variant: "destructive" });
      return false;
    }
    
    console.log('Attempting to delete user with ID:', userId);
    
    try {
      // Excluir usuário
      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user from Supabase:', error);
        throw new Error(error.message || 'Erro ao excluir usuário.');
      }

      console.log('User deleted successfully from Supabase:', data);
      
      // Atualizar a lista localmente
      await fetchUsers(); 
      console.log('User list refetched after deletion.');

      toast({ title: "Sucesso", description: "Usuário excluído com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      const errorMessage = error instanceof Error ? error.message : 'Falha ao excluir usuário.';
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast, user?.role]);

  // Função para atualizar permissões de um usuário
  const updateUserPermissions = useCallback(async (userId: string, userPermissions: ModulePermission[]) => {
    if (user?.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Somente administradores podem atualizar permissões.", variant: "destructive" });
      return false;
    }
    
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

      if (error) {
        const errorMessage = error.message || 'Erro ao atualizar permissões.';
        throw new Error(errorMessage);
      }

      await fetchUsers(); // Recarregar a lista
      toast({ title: "Sucesso", description: "Permissões atualizadas com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Error updating permissions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar permissões.';
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast, user?.role]);

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