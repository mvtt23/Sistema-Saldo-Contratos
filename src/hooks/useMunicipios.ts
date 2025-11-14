import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface Municipio {
  id: string;
  name: string;
}

export function useMunicipios() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMunicipios = useCallback(async () => {
    setLoading(true);
    try {
      // RLS policy 'Allow authenticated read access to municipalities' permite SELECT true
      const { data, error } = await supabase
        .from('municipios')
        .select('id, name')
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
  }, [toast]);

  useEffect(() => {
    fetchMunicipios();
  }, [fetchMunicipios]);

  return { municipios, loading, fetchMunicipios };
}