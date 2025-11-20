import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Municipio {
  id: string;
  name: string;
  slug: string; // Adicionado slug
}

export function useMunicipios() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMunicipios = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('municipios')
        .select('id, name, slug')
        .order('name', { ascending: true });

      if (error) {
        const msg = (error as Error)?.message || String(error);
        const fallback = [{ id: 'santa-quiteria', name: 'Prefeitura Municipal de Santa Quitéria', slug: 'santa-quiteria' }];
        if (msg.includes('Could not find the table') || msg.includes('schema cache') || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('rls')) {
          setMunicipios(fallback);
          return;
        }
        setMunicipios(fallback);
        return;
      }

      if (!data || data.length === 0) {
        setMunicipios([{ id: 'santa-quiteria', name: 'Prefeitura Municipal de Santa Quitéria', slug: 'santa-quiteria' }]);
      } else {
        setMunicipios(data);
      }
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      setMunicipios([{ id: 'santa-quiteria', name: 'Prefeitura Municipal de Santa Quitéria', slug: 'santa-quiteria' }]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMunicipios();
  }, [fetchMunicipios]);

  return { municipios, loading, fetchMunicipios };
}
