import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Contract, ManagingUnit, Company, Additive, Invoice, Program } from '@/types/contract';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Importando useAuth

interface SupabaseData {
  contracts: Contract[];
  managingUnits: ManagingUnit[];
  companies: Company[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

type AnyObject = Record<string, unknown>;

const toCamelCase = (obj: unknown) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  const newObj: AnyObject = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/(_\w)/g, (m) => m[1].toUpperCase());
      newObj[camelKey] = (obj as AnyObject)[key];
    }
  }
  return newObj;
};

const parseDates = (data: AnyObject[]): AnyObject[] => {
  return data.map(item => {
    const camelCaseItem = toCamelCase(item) as AnyObject;
    
    // Conversão de datas no nível principal
    if (camelCaseItem.startDate) camelCaseItem.startDate = new Date(camelCaseItem.startDate);
    if (camelCaseItem.endDate) camelCaseItem.endDate = new Date(camelCaseItem.endDate);

    // Conversão de datas e estrutura para Aditivos
    if (camelCaseItem.additives && Array.isArray(camelCaseItem.additives)) {
      camelCaseItem.additives = (camelCaseItem.additives as unknown[]).map((a) => {
        const camelCaseAdditive = toCamelCase(a) as AnyObject;
        if (camelCaseAdditive.date) camelCaseAdditive.date = new Date(camelCaseAdditive.date);
        return camelCaseAdditive as Additive;
      });
    }

    // Conversão de datas e estrutura para Invoices
    if (camelCaseItem.invoices && Array.isArray(camelCaseItem.invoices)) {
      camelCaseItem.invoices = (camelCaseItem.invoices as unknown[]).map((i) => {
        const camelCaseInvoice = toCamelCase(i) as AnyObject;
        if (camelCaseInvoice.date) camelCaseInvoice.date = new Date(camelCaseInvoice.date);
        return camelCaseInvoice as Invoice;
      });
    }
    
    // Conversão de estrutura para Programs (dentro de ManagingUnit)
    if (camelCaseItem.programs && Array.isArray(camelCaseItem.programs)) {
      camelCaseItem.programs = (camelCaseItem.programs as unknown[]).map((p) => toCamelCase(p) as Program);
    }

    return camelCaseItem;
  });
};

export function useSupabaseData(): SupabaseData {
  const { user, selectedPrefeituraId } = useAuth(); // Obter usuário logado e prefeitura selecionada
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [managingUnits, setManagingUnits] = useState<ManagingUnit[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    // Determina o ID da prefeitura a ser usado para filtros explícitos
    const targetPrefeituraId = user?.is_admin ? selectedPrefeituraId : user?.prefeitura_id;

    if (!targetPrefeituraId) {
      // Se for Super Admin e selectedPrefeituraId for null, ou se for usuário normal sem prefeitura_id, paramos.
      // Se o user for null, o App.tsx já está mostrando o Login.
      if (user) {
        setError("ID da prefeitura não encontrado. Selecione uma prefeitura ou faça login novamente.");
      }
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Contracts (incluindo aditivos e notas fiscais)
      let contractsQuery = supabase
        .from('contracts')
        .select(`
          *,
          additives (*),
          invoices (*)
        `);
        
      // Se não for Super Admin, ou se for Super Admin e tiver uma prefeitura selecionada, filtramos.
      if (!user?.is_admin || targetPrefeituraId) {
        contractsQuery = contractsQuery.eq('prefeitura_id', targetPrefeituraId);
      }

      const { data: contractsData, error: contractsError } = await contractsQuery;
      if (contractsError) {
        const msg = contractsError.message || '';
        if (msg.includes('Could not find the table') || msg.includes('schema cache')) {
          setContracts([]);
          setManagingUnits([]);
          setCompanies([]);
          setError(null);
          return;
        }
        throw contractsError;
      }
      
      // 2. Fetch Managing Units (incluindo programas)
      let unitsQuery = supabase
        .from('managing_units')
        .select(`
          *,
          programs (*)
        `);
        
      if (!user?.is_admin || targetPrefeituraId) {
        unitsQuery = unitsQuery.eq('prefeitura_id', targetPrefeituraId);
      }

      const { data: unitsData, error: unitsError } = await unitsQuery;
      if (unitsError) {
        const msg = unitsError.message || '';
        if (msg.includes('Could not find the table') || msg.includes('schema cache')) {
          setContracts([]);
          setManagingUnits([]);
          setCompanies([]);
          setError(null);
          return;
        }
        throw unitsError;
      }

      // 3. Fetch Companies
      let companiesQuery = supabase
        .from('companies')
        .select('*');
        
      if (!user?.is_admin || targetPrefeituraId) {
        companiesQuery = companiesQuery.eq('prefeitura_id', targetPrefeituraId);
      }

      const { data: companiesData, error: companiesError } = await companiesQuery;
      if (companiesError) {
        const msg = companiesError.message || '';
        if (msg.includes('Could not find the table') || msg.includes('schema cache')) {
          setContracts([]);
          setManagingUnits([]);
          setCompanies([]);
          setError(null);
          return;
        }
        throw companiesError;
      }

      // Mapear e converter dados
      const parsedContracts = parseDates(contractsData || []) as Contract[];
      const parsedUnits = parseDates(unitsData || []) as ManagingUnit[];
      const parsedCompanies = parseDates(companiesData || []) as Company[];

      setContracts(parsedContracts);
      setManagingUnits(parsedUnits);
      setCompanies(parsedCompanies);

      try {
        localStorage.setItem('CACHE_CONTRACTS', JSON.stringify(parsedContracts));
        localStorage.setItem('CACHE_MANAGING_UNITS', JSON.stringify(parsedUnits));
        localStorage.setItem('CACHE_COMPANIES', JSON.stringify(parsedCompanies));
        localStorage.setItem('CACHE_TS', String(Date.now()));
      } catch { void 0; }

    } catch (err) {
      console.error("Erro ao buscar dados do Supabase:", err);
      const msg = (err as Error)?.message || String(err);
      if (msg.includes('Could not find the table') || msg.includes('schema cache')) {
        setContracts([]);
        setManagingUnits([]);
        setCompanies([]);
        setError(null);
      } else {
        try {
          const cachedContracts = JSON.parse(localStorage.getItem('CACHE_CONTRACTS') || '[]');
          const cachedUnits = JSON.parse(localStorage.getItem('CACHE_MANAGING_UNITS') || '[]');
          const cachedCompanies = JSON.parse(localStorage.getItem('CACHE_COMPANIES') || '[]');
          if (Array.isArray(cachedContracts) || Array.isArray(cachedUnits) || Array.isArray(cachedCompanies)) {
            setContracts(cachedContracts as Contract[]);
            setManagingUnits(cachedUnits as ManagingUnit[]);
            setCompanies(cachedCompanies as Company[]);
            setError("Servidor indisponível. Exibindo dados em modo offline.");
            toast({
              title: "Modo Offline",
              description: "Servidor indisponível. Exibindo dados em cache.",
              variant: "destructive",
            });
          } else {
            setError("Falha ao carregar dados do servidor. Verifique a conexão e as permissões.");
            toast({
              title: "Erro de Conexão",
              description: "Não foi possível carregar os dados iniciais do Supabase.",
              variant: "destructive",
            });
          }
        } catch {
          setError("Falha ao carregar dados do servidor. Verifique a conexão e as permissões.");
          toast({
            title: "Erro de Conexão",
            description: "Não foi possível carregar os dados iniciais do Supabase.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [toast, user, selectedPrefeituraId]);

  useEffect(() => {
    // Refetch sempre que o usuário ou a prefeitura selecionada mudar
    if (user?.prefeitura_id || user?.is_admin) {
      fetchData();
    } else {
      // Sem usuário autenticado: não buscamos dados e garantimos que loading esteja falso
      setLoading(false);
    }
  }, [fetchData, user?.prefeitura_id, user?.is_admin, selectedPrefeituraId]);

  return { contracts, managingUnits, companies, loading, error, refetch: fetchData };
}
