const updateUser = useCallback(async (userId: string, userData: { username?: string; password?: string; role?: string; is_active?: boolean }) => {
    if (user?.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Somente administradores podem atualizar usuários.", variant: "destructive" });
      return false;
    }
    
    try {
      console.log('Updating user:', userId, 'with data:', userData);
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user:', error);
        const errorMessage = error.message || 'Erro ao atualizar usuário.';
        throw new Error(errorMessage);
      }

      console.log('User updated successfully:', userId);
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

  const deleteUser = useCallback(async (userId: string) => {
    if (user?.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Somente administradores podem excluir usuários.", variant: "destructive" });
      return false;
    }
    
    try {
      console.log('Deleting user:', userId);
      // Excluir usuário
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        const errorMessage = error.message || 'Erro ao excluir usuário.';
        throw new Error(errorMessage);
      }

      console.log('User deleted successfully:', userId);
      await fetchUsers(); // Recarregar a lista
      toast({ title: "Sucesso", description: "Usuário excluído com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Falha ao excluir usuário.';
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
      return false;
    }
  }, [fetchUsers, toast, user?.role]);