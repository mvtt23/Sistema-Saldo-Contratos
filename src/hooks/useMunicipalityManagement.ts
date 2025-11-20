import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface MunicipalityData {
  id: string;
  name: string;
  slug: string;
}

export function useMunicipalityManagement(refetchMunicipios: () => void) {
  const { toast } = useToast();

  const createMunicipality = useCallback(async (data: MunicipalityData) => {
    try {
      const { error } = await supabase
        .from('municipios')
        .insert([{ id: data.id, name: data.name, slug: data.slug }]);

      if (error) throw error;

      refetchMunicipios();
      toast({ title: "Sucesso", description: `Prefeitura "${data.name}" criada.`, variant: "success" });
      return true;
    } catch (error: unknown) {
      console.error('Erro ao criar órgão público:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ 
        title: "Erro ao criar órgão público", 
        description: message.includes('unique_slug') ? "O slug (identificador) já está em uso." : message, 
        variant: "destructive" 
      });
      return false;
    }
  }, [refetchMunicipios, toast]);

  const updateMunicipality = useCallback(async (id: string, data: Partial<MunicipalityData>) => {
    try {
      const { error } = await supabase
        .from('municipios')
        .update({ name: data.name, slug: data.slug })
        .eq('id', id);

      if (error) throw error;

      refetchMunicipios();
      toast({ title: "Sucesso", description: `Prefeitura "${data.name}" atualizada.`, variant: "success" });
      return true;
    } catch (error: unknown) {
      console.error('Erro ao atualizar órgão público:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ 
        title: "Erro ao atualizar órgão público", 
        description: message.includes('unique_slug') ? "O slug (identificador) já está em uso." : message, 
        variant: "destructive" 
      });
      return false;
    }
  }, [refetchMunicipios, toast]);

  const deleteMunicipality = useCallback(async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o órgão público "${name}"? Esta ação é irreversível e pode afetar dados vinculados.`)) {
      return false;
    }
    
    try {
      // Primeiro tenta via função administrativa (se criada no banco)
      const rpc = await supabase.rpc('admin_delete_municipality', { mid: id });
      let error = rpc.error;
      if (error) {
        // Se a função não existir, tenta via DELETE direto
        if ((error.message || '').toLowerCase().includes('function') || (error.message || '').toLowerCase().includes('does not exist')) {
          const res = await supabase
            .from('municipios')
            .delete()
            .eq('id', id)
            .select('id');
          error = res.error || null;
        }
      }

      if (error) {
        const msg = error.message || '';
        if (msg.includes('Could not find the table') || msg.includes('schema cache')) {
          // Ambiente sem tabela: atualizar visual e seguir
          refetchMunicipios();
          toast({ title: "Sucesso", description: `Prefeitura "${name}" removida (modo desenvolvimento).`, variant: "success" });
          return true;
        }
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('rls')) {
          toast({ title: "Permissão negada", description: "Regras de segurança do Supabase estão bloqueando a exclusão.", variant: "destructive" });
          return false;
        }
        if (msg.toLowerCase().includes('foreign key')) {
          toast({ title: "Dependências encontradas", description: "Existem registros vinculados a este órgão público. Remova-os antes.", variant: "destructive" });
          return false;
        }
        throw error;
      }

      // Verificar se realmente foi excluída
      const verify = await supabase
        .from('municipios')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (!verify.error && verify.data) {
        // Ainda existe: não afirmar sucesso
        refetchMunicipios();
        toast({ title: "Falha ao excluir", description: `O órgão público "${name}" ainda está presente no banco. Verifique permissões/RLS.`, variant: "destructive" });
        return false;
      }

      refetchMunicipios();
      toast({ title: "Sucesso", description: `Prefeitura "${name}" excluída.`, variant: "success" });
      return true;
    } catch (error: unknown) {
      console.error('Erro ao excluir órgão público:', error);
      toast({ 
        title: "Erro ao excluir órgão público", 
        description: "Falha ao excluir. Verifique permissões e dependências.", 
        variant: "destructive" 
      });
      return false;
    }
  }, [refetchMunicipios, toast]);

  const cleanMunicipalities = useCallback(async () => {
    try {
      const rpc = await supabase.rpc('admin_clean_municipalities');
      if (rpc.error) {
        const msg = rpc.error.message || '';
        if (msg.toLowerCase().includes('function') || msg.toLowerCase().includes('does not exist')) {
          toast({ title: "Função ausente", description: "Execute o setup.sql no Supabase para habilitar limpeza administrativa.", variant: "destructive" });
          return false;
        }
        throw rpc.error;
      }
      refetchMunicipios();
      toast({ title: "Sucesso", description: "Prefeituras atualizadas. Mantida apenas Santa Quitéria.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Erro ao limpar órgãos públicos:', error);
      toast({ title: "Erro", description: "Falha ao atualizar órgãos públicos", variant: "destructive" });
      return false;
    }
  }, [refetchMunicipios, toast]);

  return {
    createMunicipality,
    updateMunicipality,
    deleteMunicipality,
    cleanMunicipalities,
  };
}
