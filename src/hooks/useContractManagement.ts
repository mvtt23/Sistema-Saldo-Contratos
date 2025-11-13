import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Contract, ManagingUnit, Company, Program, Additive, Invoice } from '@/types/contract';

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
  saveFiscal: (fiscalData: { name: string; cpf: string; ordinance: string }) => Promise<string | null>;
  updateFiscal: (fiscalId: string, fiscalData: { name: string; cpf: string; ordinance: string }) => Promise<boolean>;
  deleteFiscal: (fiscalId: string) => Promise<boolean>;
  getAllFiscals: () => Promise<Array<{ id: string; name: string; cpf: string; ordinance: string }>>;
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

  // --- Contratos ---

  const saveContract = useCallback(async (contractData: Omit<Contract, 'id' | 'additives' | 'invoices'>) => {
    const payload = toSnakeCase({
      ...contractData,
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
  }, [refetchData, toast]);

  const updateContract = useCallback(async (contract: Contract) => {
    const payload = toSnakeCase({
      ...contract,
      startDate: contract.startDate.toISOString().split('T')[0],
      endDate: contract.endDate.toISOString().split('T')[0],
    });

    const { data, error } = await supabase
      .from('contracts')
      .update(payload)
      .eq('id', contract.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao atualizar contrato", description: error.message, variant: "destructive" });
      return null;
    }

    refetchData();
    return toCamelCase(data) as Contract;
  }, [refetchData, toast]);

  const deleteContract = useCallback(async (contractId: string) => {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId);

    if (error) {
      toast({ title: "Erro ao excluir contrato", description: error.message, variant: "destructive" });
      return false;
    }

    refetchData();
    toast({ title: "Sucesso", description: "Contrato excluído com sucesso.", variant: "success" });
    return true;
  }, [refetchData, toast]);

  // --- Unidades Gestoras ---

  const saveUnit = useCallback(async (unitData: Omit<ManagingUnit, 'programs'>, isEditing: boolean) => {
    const payload = toSnakeCase(unitData);
    
    let query = supabase.from('managing_units');
    
    if (isEditing && unitData.id) {
      query = query.update(payload).eq('id', unitData.id);
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
  }, [refetchData, toast]);

  const deleteUnit = useCallback(async (unitId: string) => {
    const { error } = await supabase
      .from('managing_units')
      .delete()
      .eq('id', unitId);

    if (error) {
      toast({ title: "Erro ao excluir unidade", description: error.message, variant: "destructive" });
      return false;
    }

    refetchData();
    toast({ title: "Sucesso", description: "Unidade gestora excluída com sucesso.", variant: "success" });
    return true;
  }, [refetchData, toast]);

  // --- Programas ---

  const saveProgram = useCallback(async (programData: Omit<Program, 'id'>, isEditing: boolean) => {
    const payload = toSnakeCase(programData);
    
    let query = supabase.from('programs');
    
    if (isEditing && (programData as Program).id) {
      query = query.update(payload).eq('id', (programData as Program).id);
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
  }, [refetchData, toast]);

  const deleteProgram = useCallback(async (programId: string) => {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) {
      toast({ title: "Erro ao excluir programa", description: error.message, variant: "destructive" });
      return false;
    }

    refetchData();
    toast({ title: "Sucesso", description: "Programa excluído com sucesso.", variant: "success" });
    return true;
  }, [refetchData, toast]);

  // --- Empresas (Companies) ---

  const saveCompany = useCallback(async (companyData: Omit<Company, 'id'>, isEditing: boolean) => {
    const payload = toSnakeCase(companyData);
    
    let query = supabase.from('companies');
    
    if (isEditing && (companyData as Company).id) {
      query = query.update(payload).eq('id', (companyData as Company).id);
    } else {
      query = query.insert([payload]);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Erro ao salvar empresa:', error);
      toast({ title: `Erro ao ${isEditing ? 'atualizar' : 'salvar'} empresa`, description: error.message, variant: "destructive" });
      return null;
    }

    refetchData();
    toast({ title: "Sucesso", description: `Empresa ${isEditing ? 'atualizada' : 'salva'} com sucesso.`, variant: "success" });
    return toCamelCase(data) as Company;
  }, [refetchData, toast]);

  const deleteCompany = useCallback(async (companyId: string) => {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      toast({ title: "Erro ao excluir empresa", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [refetchData, toast]);

  // --- Aditivos e Notas Fiscais (Sub-tabelas) ---
  
  const saveAdditive = useCallback(async (additive: Omit<Additive, 'id'>, contractId: string, isEditing: boolean) => {
    const payload = toSnakeCase({
      ...additive,
      contractId,
      date: additive.date.toISOString().split('T')[0],
    });

    let query = supabase.from('additives');
    
    if (isEditing && (additive as Additive).id) {
      query = query.update(payload).eq('id', (additive as Additive).id);
    } else {
      query = query.insert([payload]);
    }

    const { data, error } = await query.select().single();

    if (error) {
      toast({ title: `Erro ao ${isEditing ? 'atualizar' : 'salvar'} aditivo`, description: error.message, variant: "destructive" });
      return null;
    }

    // Não chamamos refetchData aqui, pois a atualização do contrato pai (que contém o aditivo)
    // deve ser feita separadamente no componente ContractDetails para recalcular os valores.
    return toCamelCase(data) as Additive;
  }, [toast]);

  const deleteAdditive = useCallback(async (additiveId: string) => {
    const { error } = await supabase
      .from('additives')
      .delete()
      .eq('id', additiveId);

    if (error) {
      toast({ title: "Erro ao excluir aditivo", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [toast]);

  const saveInvoice = useCallback(async (invoice: Omit<Invoice, 'id'>, contractId: string, isEditing: boolean) => {
    const payload = toSnakeCase({
      ...invoice,
      contractId,
      date: invoice.date.toISOString().split('T')[0],
    });

    let query = supabase.from('invoices');
    
    if (isEditing && (invoice as Invoice).id) {
      query = query.update(payload).eq('id', (invoice as Invoice).id);
    } else {
      query = query.insert([payload]);
    }

    const { data, error } = await query.select().single();

    if (error) {
      toast({ title: `Erro ao ${isEditing ? 'atualizar' : 'salvar'} nota fiscal`, description: error.message, variant: "destructive" });
      return null;
    }

    // Não chamamos refetchData aqui, pois a atualização do contrato pai (que contém a nota)
    // deve ser feita separadamente no componente ContractDetails para recalcular os valores.
    return toCamelCase(data) as Invoice;
  }, [toast]);

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      toast({ title: "Erro ao excluir nota fiscal", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [toast]);

  // --- Fiscais de Contratos ---

  const saveFiscal = useCallback(async (fiscalData: { name: string; cpf: string; ordinance: string }) => {
    try {
      const payload = toSnakeCase(fiscalData);
      
      const { data, error } = await supabase
        .from('fiscals')
        .insert([payload])
        .select()
        .single();

      if (error) {
        toast({ title: "Erro ao salvar fiscal", description: error.message, variant: "destructive" });
        return null;
      }

      refetchData();
      toast({ title: "Sucesso", description: "Fiscal salvo com sucesso.", variant: "success" });
      return data.id;
    } catch (error) {
      console.error('Erro ao salvar fiscal:', error);
      toast({ title: "Erro", description: "Falha ao salvar fiscal.", variant: "destructive" });
      return null;
    }
  }, [refetchData, toast]);

  const updateFiscal = useCallback(async (fiscalId: string, fiscalData: { name: string; cpf: string; ordinance: string }) => {
    try {
      const payload = toSnakeCase(fiscalData);
      
      const { error } = await supabase
        .from('fiscals')
        .update(payload)
        .eq('id', fiscalId);

      if (error) {
        toast({ title: "Erro ao atualizar fiscal", description: error.message, variant: "destructive" });
        return false;
      }

      refetchData();
      toast({ title: "Sucesso", description: "Fiscal atualizado com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar fiscal:', error);
      toast({ title: "Erro", description: "Falha ao atualizar fiscal.", variant: "destructive" });
      return false;
    }
  }, [refetchData, toast]);

  const deleteFiscal = useCallback(async (fiscalId: string) => {
    try {
      const { error } = await supabase
        .from('fiscals')
        .delete()
        .eq('id', fiscalId);

      if (error) {
        toast({ title: "Erro ao excluir fiscal", description: error.message, variant: "destructive" });
        return false;
      }

      refetchData();
      toast({ title: "Sucesso", description: "Fiscal excluído com sucesso.", variant: "success" });
      return true;
    } catch (error) {
      console.error('Erro ao excluir fiscal:', error);
      toast({ title: "Erro", description: "Falha ao excluir fiscal.", variant: "destructive" });
      return false;
    }
  }, [refetchData, toast]);

  const getAllFiscals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('fiscals')
        .select('*')
        .order('name');

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
  }, [toast]);

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