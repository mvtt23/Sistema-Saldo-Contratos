import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface Municipio {
  id: string;
  name: string;
  slug: string; // Adicionado slug
}

export function useMunicipios() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMunicipios = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('municipios')
        .select('id, name, slug')
        .order('name', { ascending: true });

      if (error) {
        const msg = (error as Error)?.message || String(error);
        if (msg.includes('Could not find the table') || msg.includes('schema cache')) {
          setMunicipios([{ id: 'santa-quiteria', name: 'Prefeitura Municipal de Santa Quitéria', slug: 'santa-quiteria' }]);
          return;
        }
        throw error;
      }

      setMunicipios(data || []);
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      const msg = (error as Error)?.message || String(error);
      if (msg.includes('Could not find the table') || msg.includes('schema cache')) {
        setMunicipios([{ id: 'santa-quiteria', name: 'Prefeitura Municipal de Santa Quitéria', slug: 'santa-quiteria' }]);
      } else {
        toast({
          title: "Erro de Dados",
          description: "Falha ao carregar a lista de prefeituras.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMunicipios();
  }, [fetchMunicipios]);

  return { municipios, loading, fetchMunicipios };
}
