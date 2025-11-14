import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Login } from '@/components/Login';
import { Toaster } from "@/components/Toaster";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { ContractList } from "@/components/ContractList";
import { ContractDetails } from "@/components/ContractDetails";
import { ContractForm } from "@/components/ContractForm";
import { ManagingUnits } from "@/components/ManagingUnits";
import { Reports } from "@/components/Reports";
import { Settings } from "@/components/Settings";
import { MunicipalitySelector } from "@/components/MunicipalitySelector"; // Importado
import { MunicipalityManagement } from "@/components/MunicipalityManagement"; // Importado
import { Contract } from "@/types/contract";
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useContractManagement } from '@/hooks/useContractManagement';

export type PageType = 'overview' | 'contracts' | 'contract-form' | 'managing-units' | 'reports' | 'settings' | 'contract-details' | 'municipality-management';

function App() {
  console.log("App component started rendering."); // Adicionado para depuração
  const { user, loading: authLoading } = useAuth();
  const { contracts, managingUnits, companies, loading: dataLoading, refetch } = useSupabaseData();
  const { 
    saveContract, 
    updateContract, 
    saveUnit, 
    deleteUnit, 
    saveProgram, 
    deleteProgram, 
    saveCompany, 
    deleteCompany,
    saveAdditive,
    deleteAdditive,
    saveInvoice,
    deleteInvoice
  } = useContractManagement(refetch);
  
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activePage, setActivePage] = useState<PageType>("overview");
  const [contractFilters, setContractFilters] = useState<{
    status?: string;
    modality?: string;
    unit?: string;
  }>({});

  const handleContractSave = async (contractData: Omit<Contract, 'id' | 'additives' | 'invoices'>) => {
    const newContract = await saveContract(contractData);
    if (newContract) {
      // Após salvar no banco, o refetch atualiza a lista global.
      // Podemos redirecionar para os detalhes do novo contrato.
      setSelectedContract(newContract);
      setActivePage('contract-details');
    }
  };

  const handleContractUpdate = async (updatedContract: Contract) => {
    const result = await updateContract(updatedContract);
    if (result) {
      // Atualiza o estado local para refletir a mudança imediatamente
      setSelectedContract(result);
    }
  };
  
  const handleContractSelect = (contract: Contract) => {
    setSelectedContract(contract);
    setActivePage("contract-details");
  };

  const handlePageChange = (page: PageType) => {
    setActivePage(page);
    if (page !== 'contract-details') {
      setSelectedContract(null);
    }
    if (page !== 'contracts') {
      setContractFilters({});
    }
  };

  const handleFilteredContractsView = (filters: { status?: string; modality?: string; unit?: string }) => {
    setContractFilters(filters);
    setActivePage('contracts');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return <Dashboard 
          onFilteredView={handleFilteredContractsView} 
          contracts={contracts} 
          managingUnits={managingUnits} // Passando managingUnits
          onContractSelect={handleContractSelect} 
        />;
      case 'contracts':
        return <ContractList contracts={contracts} onContractSelect={handleContractSelect} initialFilters={contractFilters} />;
      case 'contract-form':
        return <ContractForm 
          onContractSave={handleContractSave} 
          managingUnits={managingUnits} 
          companies={companies} 
          saveCompany={saveCompany}
          deleteCompany={deleteCompany}
        />;
      case 'managing-units':
        return <ManagingUnits 
          initialUnits={managingUnits} 
          refetchData={refetch} 
          saveUnit={saveUnit}
          deleteUnit={deleteUnit}
          saveProgram={saveProgram}
          deleteProgram={deleteProgram}
        />;
      case 'reports':
        return <Reports contracts={contracts} onContractSelect={handleContractSelect} managingUnits={managingUnits} />;
      case 'settings':
        return <Settings managingUnits={managingUnits} />;
      case 'contract-details':
        return selectedContract ? (
          <ContractDetails 
            contract={selectedContract} 
            onContractUpdate={handleContractUpdate} 
            saveAdditive={saveAdditive}
            deleteAdditive={deleteAdditive}
            saveInvoice={saveInvoice}
            deleteInvoice={deleteInvoice}
          />
        ) : <Dashboard onFilteredView={handleFilteredContractsView} contracts={contracts} managingUnits={managingUnits} onContractSelect={handleContractSelect} />;
      case 'municipality-management':
        return <MunicipalityManagement />;
      default:
        return <Dashboard onFilteredView={handleFilteredContractsView} contracts={contracts} managingUnits={managingUnits} onContractSelect={handleContractSelect} />;
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activePage={activePage} onPageChange={handlePageChange} />
      
      <main className="flex-1 ml-0 md:ml-64">
        <div className="p-4 md:p-8">
          {user.is_admin && <MunicipalitySelector />}
          {renderContent()}
        </div>
      </main>
      <Toaster />
    </div>
  );
}

export default App;