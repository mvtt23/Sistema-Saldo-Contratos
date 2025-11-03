import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Contract, ManagingUnit, Company } from '@/types/contract';
import { useToast } from '@/hooks/use-toast';

interface SupabaseData {
  contracts: Contract[];
  managingUnits: ManagingUnit[];
  companies: Company[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Função auxiliar para converter datas de string (do Supabase) para Date objects
const parseDates = (data: any[]): any[] => {
  return data.map(item => ({
    ...item,
    startDate: item.start_date ? new Date(item.start_date) : undefined,
    endDate: item.end_date ? new Date(item.end_date) : undefined,
    additives: item.additives ? item.additives.map((a: any) => ({
      ...a,
      date: a.date ? new Date(a.date) : undefined,
    })) : [],
    invoices: item.invoices ? item.invoices.map((i: any) => ({
      ...i,
      date: i.date ? new Date(i.date) : undefined,
    })) : [],
  }));
};

export function useSupabaseData(): SupabaseData {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [managingUnits, setManagingUnits] = useState<ManagingUnit[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Contracts (incluindo aditivos e notas fiscais)
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          additives (*),
          invoices (*)
        `);

      if (contractsError) throw contractsError;
      
      // 2. Fetch Managing Units (incluindo programas)
      const { data: unitsData, error: unitsError } = await supabase
        .from('managing_units')
        .select(`
          *,
          programs (*)
        `);

      if (unitsError) throw unitsError;

      // 3. Fetch Companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*');

      if (companiesError) throw companiesError;

      // Mapear e converter dados
      const parsedContracts = parseDates(contractsData || []) as Contract[];
      const parsedUnits = (unitsData || []).map(unit => ({
        ...unit,
        programs: unit.programs || []
      })) as ManagingUnit[];
      const parsedCompanies = companiesData || [] as Company[];

      setContracts(parsedContracts);
      setManagingUnits(parsedUnits);
      setCompanies(parsedCompanies);

    } catch (err) {
      console.error("Erro ao buscar dados do Supabase:", err);
      setError("Falha ao carregar dados do servidor. Verifique a conexão e as permissões.");
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível carregar os dados iniciais do Supabase.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { contracts, managingUnits, companies, loading, error, refetch: fetchData };
}