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
import { Contract, ManagingUnit, Company } from "@/types/contract";
import { useSupabaseData } from '@/hooks/useSupabaseData';

export type PageType = 'overview' | 'contracts' | 'contract-form' | 'managing-units' | 'reports' | 'settings' | 'contract-details';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { contracts, managingUnits, companies, loading: dataLoading, refetch } = useSupabaseData();
  
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activePage, setActivePage] = useState<PageType>("overview");
  const [contractFilters, setContractFilters] = useState<{
    status?: string;
    modality?: string;
    unit?: string;
  }>({});

  const handleContractSave = (newContract: Contract) => {
    // Em uma implementação real, esta função faria um INSERT no Supabase e chamaria refetch.
    // Por enquanto, apenas adicionamos localmente para simulação.
    // TODO: Implementar INSERT real no Supabase
    setContracts(prev => [...prev, newContract]);
  };

  const handleContractUpdate = (updatedContract: Contract) => {
    // Em uma implementação real, esta função faria um UPDATE no Supabase e chamaria refetch.
    // TODO: Implementar UPDATE real no Supabase
    setContracts(prev => prev.map(contract => 
      contract.id === updatedContract.id ? updatedContract : contract
    ));
    if (selectedContract && selectedContract.id === updatedContract.id) {
      setSelectedContract(updatedContract);
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
        return <Dashboard onFilteredView={handleFilteredContractsView} contracts={contracts} onContractSelect={handleContractSelect} />;
      case 'contracts':
        return <ContractList contracts={contracts} onContractSelect={handleContractSelect} initialFilters={contractFilters} />;
      case 'contract-form':
        return <ContractForm onContractSave={handleContractSave} managingUnits={managingUnits} companies={companies} />;
      case 'managing-units':
        return <ManagingUnits initialUnits={managingUnits} refetchData={refetch} />;
      case 'reports':
        return <Reports contracts={contracts} onContractSelect={handleContractSelect} managingUnits={managingUnits} />;
      case 'settings':
        return <Settings managingUnits={managingUnits} />;
      case 'contract-details':
        return selectedContract ? <ContractDetails contract={selectedContract} onContractUpdate={handleContractUpdate} /> : <Dashboard onFilteredView={handleFilteredContractsView} contracts={contracts} onContractSelect={handleContractSelect} />;
      default:
        return <Dashboard onFilteredView={handleFilteredContractsView} contracts={contracts} onContractSelect={handleContractSelect} />;
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
      
      <main className="flex-1 ml-64">
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
      <Toaster />
    </div>
  );
}

export default App;