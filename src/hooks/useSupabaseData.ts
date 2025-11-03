import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Contract, ManagingUnit, Company, Additive, Invoice } from '@/types/contract';
import { useToast } from '@/hooks/use-toast';

interface SupabaseData {
  contracts: Contract[];
  managingUnits: ManagingUnit[];
  companies: Company[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Função auxiliar para converter nomes de campos de snake_case para camelCase (Frontend)
const toCamelCase = (obj: any) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/(_\w)/g, (m) => m[1].toUpperCase());
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
};

// Função auxiliar para converter datas de string (do Supabase) para Date objects e aplicar camelCase
const parseDates = (data: any[]): any[] => {
  return data.map(item => {
    const camelCaseItem = toCamelCase(item);
    
    // Conversão de datas no nível principal
    if (camelCaseItem.startDate) camelCaseItem.startDate = new Date(camelCaseItem.startDate);
    if (camelCaseItem.endDate) camelCaseItem.endDate = new Date(camelCaseItem.endDate);

    // Conversão de datas e estrutura para Aditivos
    if (camelCaseItem.additives && Array.isArray(camelCaseItem.additives)) {
      camelCaseItem.additives = camelCaseItem.additives.map((a: any) => {
        const camelCaseAdditive = toCamelCase(a);
        if (camelCaseAdditive.date) camelCaseAdditive.date = new Date(camelCaseAdditive.date);
        return camelCaseAdditive as Additive;
      });
    }

    // Conversão de datas e estrutura para Invoices
    if (camelCaseItem.invoices && Array.isArray(camelCaseItem.invoices)) {
      camelCaseItem.invoices = camelCaseItem.invoices.map((i: any) => {
        const camelCaseInvoice = toCamelCase(i);
        if (camelCaseInvoice.date) camelCaseInvoice.date = new Date(camelCaseInvoice.date);
        return camelCaseInvoice as Invoice;
      });
    }
    
    // Conversão de estrutura para Programs (dentro de ManagingUnit)
    if (camelCaseItem.programs && Array.isArray(camelCaseItem.programs)) {
      camelCaseItem.programs = camelCaseItem.programs.map((p: any) => toCamelCase(p) as Program);
    }

    return camelCaseItem;
  });
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
      const parsedUnits = parseDates(unitsData || []) as ManagingUnit[];
      const parsedCompanies = parseDates(companiesData || []) as Company[];

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