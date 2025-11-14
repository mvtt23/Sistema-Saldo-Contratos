import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Importando useAuth

export interface Municipio {
  id: string;
  name: string;
  slug: string; // Adicionado slug
}

export function useMunicipios() {
  const { user, loading: authLoading } = useAuth();
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMunicipios = useCallback(async () => {
    if (authLoading || !user?.is_admin) {
      // Se não for admin ou o auth ainda estiver carregando, não tenta buscar (RLS bloquearia)
      if (!user?.is_admin && !authLoading) {
        setMunicipios([]);
        setLoading(false);
      }
      return;
    }
    
    setLoading(true);
    try {
      // Apenas Super Admins podem ler esta tabela agora (devido ao RLS)
      const { data, error } = await supabase
        .from('municipios')
        .select('id, name, slug')
        .order('name', { ascending: true });

      if (error) throw error;

      setMunicipios(data || []);
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      toast({
        title: "Erro de Dados",
        description: "Falha ao carregar a lista de prefeituras.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.is_admin, authLoading]);

  useEffect(() => {
    // Só executa a busca se o estado de autenticação estiver resolvido
    if (!authLoading) {
      fetchMunicipios();
    }
  }, [fetchMunicipios, authLoading]);

  return { municipios, loading, fetchMunicipios };
}