import { useState, useEffect } from 'react';
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
import { useMunicipios } from '@/hooks/useMunicipios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export type PageType = 'overview' | 'contracts' | 'contract-form' | 'managing-units' | 'reports' | 'settings' | 'contract-details' | 'municipality-management';

function App() {
  console.log("App component started rendering."); // Adicionado para depuração
  const { user, loading: authLoading, setPrefeituraSelecionada } = useAuth();
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
  const { municipios, loading: municipiosLoading } = useMunicipios();
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isAdminRoute = path.startsWith('/admin');
  const slug = !isAdminRoute && path !== '/' ? path.slice(1) : null;
  
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activePage, setActivePage] = useState<PageType>("overview");
  const [contractFilters, setContractFilters] = useState<{
    status?: string;
    modality?: string;
    unit?: string;
  }>({});
  const [backendDown, setBackendDown] = useState(false);
  const checkBackend = async () => {
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${baseUrl}/auth/v1/.well-known/jwks.json`, { method: 'GET' });
      setBackendDown(!res.ok);
    } catch {
      setBackendDown(true);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  useEffect(() => {
    if (slug) {
      setPrefeituraSelecionada(slug);
    }
  }, [slug, setPrefeituraSelecionada]);

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

  // Seleção de município na raiz (sem exigir login)
  if (path === '/') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <Building2 className="w-14 h-14 text-blue-700 mb-3" />
              <h1 className="text-3xl font-extrabold text-gray-900">Gerenciador de saldo de contratos</h1>
              <p className="text-gray-600 mt-2">Selecione o órgão público</p>
            </div>
            {municipiosLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-600">Carregando órgãos públicos...</div>
            ) : (
              <div className="space-y-3">
                {(municipios.length ? municipios : [{ id: 'santa-quiteria', name: 'Prefeitura Municipal de Santa Quitéria', slug: 'santa-quiteria' }]).map(m => {
                  const logo = (typeof window !== 'undefined') ? localStorage.getItem(`ORG_LOGO_${m.id}`) || '' : '';
                  return (
                    <div key={m.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {logo ? (
                          <img src={logo} alt={m.name} className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                        <p className="font-semibold text-gray-900">{m.name}</p>
                      </div>
                      <Button onClick={() => {
                        setPrefeituraSelecionada(m.id);
                        window.location.assign(`/${m.slug}`);
                      }} className="bg-blue-600 hover:bg-blue-700">
                        Entrar
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }


  if ((authLoading && !user) || (dataLoading && !!user)) {
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
          {backendDown && (
            <div className="mb-4 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800">
              <div className="font-semibold">Serviço indisponível</div>
              <div className="text-sm">Não foi possível conectar ao servidor. Algumas funções podem ficar indisponíveis. Você pode navegar com dados em cache.</div>
              <div className="mt-2">
                <Button onClick={checkBackend} className="bg-red-600 hover:bg-red-700">Tentar novamente</Button>
              </div>
            </div>
          )}
          {user?.is_admin && <MunicipalitySelector />}
          {renderContent()}
        </div>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
