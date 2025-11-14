import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Importando useAuth
import { Contract, ManagingUnit, Company, Program, Additive, Invoice } from '@/types/contract';

interface FiscalData {
  name: string;
  cpf: string;
  ordinance: string;
  prefeituraId: string;
}

interface Fiscal extends FiscalData {
  id: string;
}

interface UseContractManagement {
  saveContract: (contractData: Omit<Contract, 'id' | 'additives' | 'invoices'>) => Promise<Contract | null>;
  updateContract: (contract: Contract) => Promise<Contract | null>;
  deleteContract: (contractId: string) => Promise<boolean>;
  saveUnit: (unitData: Omit<ManagingUnit, 'programs'>, isEditing: boolean) => Promise<ManagingUnit | null>;
  deleteUnit: (unitId: string) => Promise<boolean>;
  saveProgram: (programData: Omit<Program, 'id'>, isEditing: boolean) => Promise<Program | null>;
  deleteProgram: (programId: string) => Promise<boolean>;
  saveCompany: (companyData: Omit<Company, 'id'>, isEditing: boolean) => Promise<Company | null>;
  deleteCompany: (companyId: string) => Promise<boolean>;
  saveAdditive: (additive: Omit<Additive, 'id'>, contractId: string, isEditing: boolean) => Promise<Additive | null>;
  deleteAdditive: (additiveId: string) => Promise<boolean>;
  saveInvoice: (invoice: Omit<Invoice, 'id'>, contractId: string, isEditing: boolean) => Promise<Invoice | null>;
  deleteInvoice: (invoiceId: string) => Promise<boolean>;
  saveFiscal: (fiscalData: FiscalData) => Promise<string | null>;
  updateFiscal: (fiscalId: string, fiscalData: FiscalData) => Promise<boolean>;
  deleteFiscal: (fiscalId: string) => Promise<boolean>;
  getAllFiscals: () => Promise<Fiscal[]>;
}

// Função auxiliar para converter nomes de campos de camelCase para snake_case (Supabase)
const toSnakeCase = (obj: any) => {
  if (!obj) return obj;
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = obj[key];
    }
  }
  return newObj;
};

// Função auxiliar para converter nomes de campos de snake_case para camelCase (Frontend)
const toCamelCase = (obj: any) => {
  if (!obj) return obj;
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/(_\w)/g, (m) => m[1].toUpperCase());
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
};


export function useContractManagement(refetchData: () => void): UseContractManagement {
  const { toast } = useToast();
  const { user, selectedPrefeituraId } = useAuth();
  const isSuperAdmin = user?.is_admin;

  // Determina o ID da prefeitura a ser usado para filtros explícitos (leitura/exclusão)
  const currentPrefeituraId = isSuperAdmin ? selectedPrefeituraId : user?.prefeitura_id;

  // --- Contratos ---

  const saveContract = useCallback(async (contractData: Omit<Contract, 'id' | 'additives' | 'invoices'>) => {
    // Se não for Super Admin, usa o ID do usuário logado. Se for Super Admin, usa o ID do formulário.
    const finalPrefeituraId = isSuperAdmin ? contractData.prefeituraId : user?.prefeitura_id;
    
    if (!finalPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return null;
    }
    
    const payload = toSnakeCase({
      ...contractData,
      prefeituraId: finalPrefeituraId, // Usando o ID final
      originalValue: contractData.originalValue,
      currentValue: contractData.currentValue,
      usedValue: contractData.usedValue,
      remainingBalance: contractData.remainingBalance,
      startDate: contractData.startDate.toISOString().split('T')[0],
      endDate: contractData.endDate.toISOString().split('T')[0],
    });

    const { data, error } = await supabase
      .from('contracts')
      .insert([payload])
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao salvar contrato", description: error.message, variant: "destructive" });
      return null;
    }

    refetchData();
    return toCamelCase(data) as Contract;
  }, [refetchData, toast, user?.prefeitura_id, isSuperAdmin]);

  const updateContract = useCallback(async (contract: Contract) => {
    const finalPrefeituraId = isSuperAdmin ? contract.prefeituraId : user?.prefeitura_id;
    
    if (!finalPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return null;
    }
    
    const payload = toSnakeCase({
      ...contract,
      prefeituraId: finalPrefeituraId,
      startDate: contract.startDate.toISOString().split('T')[0],
      endDate: contract.endDate.toISOString().split('T')[0],
    });

    const { data, error } = await supabase
      .from('contracts')
      .update(payload)
      .eq('id', contract.id)
      .eq('prefeitura_id', finalPrefeituraId) // Adicionando filtro de segurança
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao atualizar contrato", description: error.message, variant: "destructive" });
      return null;
    }

    refetchData();
    return toCamelCase(data) as Contract;
  }, [refetchData, toast, user?.prefeitura_id, isSuperAdmin]);

  const deleteContract = useCallback(async (contractId: string) => {
    if (!currentPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId)
      .eq('prefeitura_id', currentPrefeituraId); // Filtrando pelo ID ativo

    if (error) {
      toast({ title: "Erro ao excluir contrato", description: error.message, variant: "destructive" });
      return false;
    }

    refetchData();
    toast({ title: "Sucesso", description: "Contrato excluído com sucesso.", variant: "success" });
    return true;
  }, [refetchData, toast, currentPrefeituraId]);

  // --- Unidades Gestoras ---

  const saveUnit = useCallback(async (unitData: Omit<ManagingUnit, 'programs'>, isEditing: boolean) => {
    const finalPrefeituraId = isSuperAdmin ? unitData.prefeituraId : user?.prefeitura_id;
    
    if (!finalPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return null;
    }
    
    const payload = toSnakeCase({ ...unitData, prefeituraId: finalPrefeituraId }); 
    
    let query = supabase.from('managing_units');
    
    if (isEditing && unitData.id) {
      query = query.update(payload).eq('id', unitData.id).eq('prefeitura_id', finalPrefeituraId);
    } else {
      query = query.insert([payload]);
    }

    const { data, error } = await query.select().single();

    if (error) {
      toast({ title: `Erro ao ${isEditing ? 'atualizar' : 'salvar'} unidade`, description: error.message, variant: "destructive" });
      return null;
    }

    refetchData();
    toast({ title: "Sucesso", description: `Unidade ${isEditing ? 'atualizada' : 'salva'} com sucesso.`, variant: "success" });
    return toCamelCase(data) as ManagingUnit;
  }, [refetchData, toast, user?.prefeitura_id, isSuperAdmin]);

  const deleteUnit = useCallback(async (unitId: string) => {
    if (!currentPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    const { error } = await supabase
      .from('managing_units')
      .delete()
      .eq('id', unitId)
      .eq('prefeitura_id', currentPrefeituraId); 

    if (error) {
      toast({ title: "Erro ao excluir unidade", description: error.message, variant: "destructive" });
      return false;
    }

    refetchData();
    toast({ title: "Sucesso", description: "Unidade gestora excluída com sucesso.", variant: "success" });
    return true;
  }, [refetchData, toast, currentPrefeituraId]);

  // --- Programas ---

  const saveProgram = useCallback(async (programData: Omit<Program, 'id'>, isEditing: boolean) => {
    const finalPrefeituraId = isSuperAdmin ? programData.prefeituraId : user?.prefeitura_id;
    
    if (!finalPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return null;
    }
    
    const payload = toSnakeCase({ ...programData, prefeituraId: finalPrefeituraId }); 
    
    let query = supabase.from('programs');
    
    if (isEditing && (programData as Program).id) {
      query = query.update(payload).eq('id', (programData as Program).id).eq('prefeitura_id', finalPrefeituraId);
    } else {
      query = query.insert([payload]);
    }

    const { data, error } = await query.select().single();

    if (error) {
      toast({ title: `Erro ao ${isEditing ? 'atualizar' : 'salvar'} programa`, description: error.message, variant: "destructive" });
      return null;
    }

    refetchData();
    toast({ title: "Sucesso", description: `Programa ${isEditing ? 'atualizado' : 'salvo'} com sucesso.`, variant: "success" });
    return toCamelCase(data) as Program;
  }, [refetchData, toast, user?.prefeitura_id, isSuperAdmin]);

  const deleteProgram = useCallback(async (programId: string) => {
    if (!currentPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId)
      .eq('prefeitura_id', currentPrefeituraId); 

    if (error) {
      toast({ title: "Erro ao excluir programa", description: error.message, variant: "destructive" });
      return false;
    }

    refetchData();
    toast({ title: "Sucesso", description: "Programa excluído com sucesso.", variant: "success" });
    return true;
  }, [refetchData, toast, currentPrefeituraId]);

  // --- Empresas (Companies) ---

  const saveCompany = useCallback(async (companyData: Omit<Company, 'id'>, isEditing: boolean) => {
    const finalPrefeituraId = isSuperAdmin ? companyData.prefeituraId : user?.prefeitura_id;
    
    if (!finalPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return null;
    }
    
    const payload = toSnakeCase({ ...companyData, prefeituraId: finalPrefeituraId }); 
    
    let query = supabase.from('companies');
    
    if (isEditing && (companyData as Company).id) {
      query = query.update(payload).eq('id', (companyData as Company).id).eq('prefeitura_id', finalPrefeituraId);
    } else {
      query = query.insert([payload]);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Erro ao salvar empresa:', error);
      toast({ title: `Erro ao ${isEditing ? 'atualizar' : 'salvar'} empresa`, description: error.message, variant: "destructive" });
      return null;
    }

    toast({ title: "Sucesso", description: `Empresa ${isEditing ? 'atualizada' : 'salva'} com sucesso.`, variant: "success" });
    return toCamelCase(data) as Company;
  }, [toast, user?.prefeitura_id, isSuperAdmin]);

  const deleteCompany = useCallback(async (companyId: string) => {
    if (!currentPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId)
      .eq('prefeitura_id', currentPrefeituraId); 

    if (error) {
      toast({ title: "Erro ao excluir empresa", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [toast, currentPrefeituraId]);

  // --- Aditivos e Notas Fiscais (Sub-tabelas) ---
  
  const saveAdditive = useCallback(async (additive: Omit<Additive, 'id'>, contractId: string, isEditing: boolean) => {
    const finalPrefeituraId = isSuperAdmin ? additive.prefeituraId : user?.prefeitura_id;
    
    if (!finalPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return null;
    }
    
    const payload = toSnakeCase({
      ...additive,
      prefeituraId: finalPrefeituraId, 
      contractId,
      date: additive.date.toISOString().split('T')[0],
    });

    let query = supabase.from('additives');
    
    if (isEditing && (additive as Additive).id) {
      query = query.update(payload).eq('id', (additive as Additive).id).eq('prefeitura_id', finalPrefeituraId);
    } else {
      query = query.insert([payload]);
    }

    const { data, error } = await query.select().single();

    if (error) {
      toast({ title: `Erro ao ${isEditing ? 'atualizar' : 'salvar'} aditivo`, description: error.message, variant: "destructive" });
      return null;
    }

    return toCamelCase(data) as Additive;
  }, [toast, user?.prefeitura_id, isSuperAdmin]);

  const deleteAdditive = useCallback(async (additiveId: string) => {
    if (!currentPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    const { error } = await supabase
      .from('additives')
      .delete()
      .eq('id', additiveId)
      .eq('prefeitura_id', currentPrefeituraId); 

    if (error) {
      toast({ title: "Erro ao excluir aditivo", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [toast, currentPrefeituraId]);

  const saveInvoice = useCallback(async (invoice: Omit<Invoice, 'id'>, contractId: string, isEditing: boolean) => {
    const finalPrefeituraId = isSuperAdmin ? invoice.prefeituraId : user?.prefeitura_id;
    
    if (!finalPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return null;
    }
    
    const payload = toSnakeCase({
      ...invoice,
      prefeituraId: finalPrefeituraId, 
      contractId,
      date: invoice.date.toISOString().split('T')[0],
    });

    let query = supabase.from('invoices');
    
    if (isEditing && (invoice as Invoice).id) {
      query = query.update(payload).eq('id', (invoice as Invoice).id).eq('prefeitura_id', finalPrefeituraId);
    } else {
      query = query.insert([payload]);
    }

    const { data, error } = await query.select().single();

    if (error) {
      toast({ title: `Erro ao ${isEditing ? 'atualizar' : 'salvar'} nota fiscal`, description: error.message, variant: "destructive" });
      return null;
    }

    return toCamelCase(data) as Invoice;
  }, [toast, user?.prefeitura_id, isSuperAdmin]);

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    if (!currentPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('prefeitura_id', currentPrefeituraId); 

    if (error) {
      toast({ title: "Erro ao excluir nota fiscal", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [toast, currentPrefeituraId]);

  // --- Fiscais de Contratos ---

  const saveFiscal = useCallback(async (fiscalData: FiscalData) => {
    const finalPrefeituraId = isSuperAdmin ? fiscalData.prefeituraId : user?.prefeitura_id;
    
    if (!finalPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return null;
    }
    
    try {
      const payload = toSnakeCase({ ...fiscalData, prefeituraId: finalPrefeituraId }); 
      
      const { data, error } = await supabase
        .from('fiscals')
        .insert([payload])
        .select()
        .single();

      if (error) {
        toast({ title: "Erro ao salvar fiscal", description: error.message, variant: "destructive" });
        return null;
      }

      toast({ title: "Sucesso", description: "Fiscal salvo com sucesso.", variant: "success" });
      return data.id;
    } catch (error) {
      console.error('Erro ao salvar fiscal:', error);
      toast({ title: "Erro", description: "Falha ao salvar fiscal.", variant: "destructive" });
      return null;
    }
  }, [toast, user?.prefeitura_id, isSuperAdmin]);

  const updateFiscal = useCallback(async (fiscalId: string, fiscalData: FiscalData) => {
    const finalPrefeituraId = isSuperAdmin ? fiscalData.prefeituraId : user?.prefeitura_id;
    
    if (!finalPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    try {
      const payload = toSnakeCase(fiscalData);
      
      const { error } = await supabase
        .from('fiscals')
        .update(payload)
        .eq('id', fiscalId)
        .eq('prefeitura_id', finalPrefeituraId); 

      if (error) {
        toast({ title: "Erro ao atualizar fiscal", description: error.message, variant: "destructive" });
        return false;
      }

      toast({ title: "Sucesso", description: "Fiscal atualizado com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar fiscal:', error);
      toast({ title: "Erro", description: "Falha ao atualizar fiscal.", variant: "destructive" });
      return false;
    }
  }, [toast, user?.prefeitura_id, isSuperAdmin]);

  const deleteFiscal = useCallback(async (fiscalId: string) => {
    if (!currentPrefeituraId) {
      toast({ title: "Erro de Autenticação", description: "ID da prefeitura não encontrado. Faça login novamente.", variant: "destructive" });
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('fiscals')
        .delete()
        .eq('id', fiscalId)
        .eq('prefeitura_id', currentPrefeituraId); 

      if (error) {
        toast({ title: "Erro ao excluir fiscal", description: error.message, variant: "destructive" });
        return false;
      }

      toast({ title: "Sucesso", description: "Fiscal excluído com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Erro ao excluir fiscal:', error);
      toast({ title: "Erro", description: "Falha ao excluir fiscal.", variant: "destructive" });
      return false;
    }
  }, [toast, currentPrefeituraId]);

  const getAllFiscals = useCallback(async () => {
    if (!currentPrefeituraId) return [];
    
    try {
      let query = supabase
        .from('fiscals')
        .select('*')
        .order('name');
        
      // Se não for Super Admin, ou se for Super Admin e tiver uma prefeitura selecionada, filtramos.
      if (!isSuperAdmin || currentPrefeituraId) {
        query = query.eq('prefeitura_id', currentPrefeituraId);
      }

      const { data, error } = await query;

      if (error) {
        toast({ title: "Erro ao buscar fiscais", description: error.message, variant: "destructive" });
        return [];
      }

      return (data || []).map(fiscal => toCamelCase(fiscal));
    } catch (error) {
      console.error('Erro ao buscar fiscais:', error);
      toast({ title: "Erro", description: "Falha ao buscar fiscais.", variant: "destructive" });
      return [];
    }
  }, [toast, currentPrefeituraId, isSuperAdmin]);

  return {
    saveContract,
    updateContract,
    deleteContract,
    saveUnit,
    deleteUnit,
    saveProgram,
    deleteProgram,
    saveCompany,
    deleteCompany,
    saveAdditive,
    deleteAdditive,
    saveInvoice,
    deleteInvoice,
    saveFiscal,
    updateFiscal,
    deleteFiscal,
    getAllFiscals,
  };
}