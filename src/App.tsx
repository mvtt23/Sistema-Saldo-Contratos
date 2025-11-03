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
import { contracts as initialContracts } from "@/data/mockData";
import { Contract } from "@/types/contract";

export type PageType = 'overview' | 'contracts' | 'contract-form' | 'managing-units' | 'reports' | 'settings' | 'contract-details';

function App() {
  const { user, loading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activePage, setActivePage] = useState<PageType>("overview");
  const [contractFilters, setContractFilters] = useState<{
    status?: string;
    modality?: string;
    unit?: string;
  }>({});

  const handleContractSave = (newContract: Contract) => {
    setContracts(prev => [...prev, newContract]);
  };

  const handleContractUpdate = (updatedContract: Contract) => {
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
        return <ContractForm onContractSave={handleContractSave} />;
      case 'managing-units':
        return <ManagingUnits />;
      case 'reports':
        return <Reports contracts={contracts} onContractSelect={handleContractSelect} />;
      case 'settings':
        return <Settings />;
      case 'contract-details':
        return selectedContract ? <ContractDetails contract={selectedContract} onContractUpdate={handleContractUpdate} /> : <Dashboard onFilteredView={handleFilteredContractsView} contracts={contracts} onContractSelect={handleContractSelect} />;
      default:
        return <Dashboard onFilteredView={handleFilteredContractsView} contracts={contracts} onContractSelect={handleContractSelect} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
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