import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Municipio } from './useMunicipios';

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
    } catch (error: any) {
      console.error('Erro ao criar prefeitura:', error);
      toast({ 
        title: "Erro ao criar prefeitura", 
        description: error.message.includes('unique_slug') ? "O slug (identificador) já está em uso." : error.message, 
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
    } catch (error: any) {
      console.error('Erro ao atualizar prefeitura:', error);
      toast({ 
        title: "Erro ao atualizar prefeitura", 
        description: error.message.includes('unique_slug') ? "O slug (identificador) já está em uso." : error.message, 
        variant: "destructive" 
      });
      return false;
    }
  }, [refetchMunicipios, toast]);

  const deleteMunicipality = useCallback(async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a prefeitura "${name}"? Esta ação é irreversível e pode afetar dados vinculados.`)) {
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('municipios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      refetchMunicipios();
      toast({ title: "Sucesso", description: `Prefeitura "${name}" excluída.`, variant: "success" });
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir prefeitura:', error);
      toast({ 
        title: "Erro ao excluir prefeitura", 
        description: "Falha ao excluir. Verifique se há contratos ou usuários vinculados.", 
        variant: "destructive" 
      });
      return false;
    }
  }, [refetchMunicipios, toast]);

  return {
    createMunicipality,
    updateMunicipality,
    deleteMunicipality,
  };
}