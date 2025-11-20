import {
  LayoutDashboard,
  FileText,
  Plus,
  Building2,
  FileBarChart,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Gavel
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageType } from "@/App";
import { useState } from "react"; // Importação adicionada

interface SidebarProps {
  activePage: PageType;
  onPageChange: (page: PageType) => void;
}

const menuItems = [
  { id: 'overview' as PageType, label: 'Visão Geral', icon: LayoutDashboard, module: 'dashboard' },
  { id: 'contracts' as PageType, label: 'Consulta de Contratos', icon: FileText, module: 'contracts' },
  { id: 'contract-form' as PageType, label: 'Cadastro de Contratos', icon: Plus, module: 'contracts' },
  { id: 'managing-units' as PageType, label: 'Unidades Gestoras', icon: Building2, module: 'managing_units' },
  { id: 'reports' as PageType, label: 'Relatórios', icon: FileBarChart, module: 'reports' },
  { id: 'settings' as PageType, label: 'Configurações', icon: SettingsIcon, module: 'settings' },
  { id: 'municipality-management' as PageType, label: 'Órgãos Públicos', icon: Gavel, module: 'admin_only' },
];

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const { signOut, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  // Filtrar itens do menu com base no perfil do usuário
  const filteredMenuItems = menuItems.filter(item => {
    // Super Admin pode ver tudo
    if (user?.is_admin) return true;
    
    // Se for item de admin_only, bloquear para não-admins
    if (item.module === 'admin_only') return false;

    // Admin (role) pode ver tudo
    if (user?.role === 'admin') return true;
    
    // Visualizador só pode ver: Visão Geral, Contratos (pesquisa) e Relatórios
    if (user?.role === 'viewer') {
      return item.id === 'overview' || item.id === 'contracts' || item.id === 'reports';
    }
    
    // Gerente pode ver tudo exceto configurações
    if (user?.role === 'manager') {
      return item.id !== 'settings';
    }
    
    // Por padrão, não mostrar
    return false;
  });

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Menu hambúrguer para mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={handleMobileMenuToggle}
          className="p-2 rounded-lg bg-white shadow-lg border border-gray-200"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <div className={`hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-64 bg-blue-900 text-white shadow-lg z-40`}>
        <div className="flex-1">
          <div className="p-6 border-b border-blue-800">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-white mr-3" />
              <div>
                <h1 className="text-lg font-bold text-white">
                  Gerenciamento de Contratos
                </h1>
                <p className="text-sm text-blue-200">Prefeitura Municipal</p>
              </div>
            </div>
          </div>

          <nav className="mt-6">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold border-r-4 border-blue-300'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-blue-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-3 text-blue-200 hover:bg-blue-800 hover:text-white rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </div>

      {/* Sidebar Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleMobileMenuToggle}>
          <div 
            className="fixed left-0 top-0 h-full w-64 bg-blue-900 text-white shadow-lg z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-blue-800">
              <div className="flex items-center">
                <Building2 className="w-8 h-8 text-white mr-3" />
                <div>
                  <h1 className="text-lg font-bold text-white">
                    Gerenciamento de Contratos
                  </h1>
                  <p className="text-sm text-blue-200">Prefeitura Municipal</p>
                </div>
              </div>
            </div>

            <nav className="mt-6">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold border-r-4 border-blue-300'
                        : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-blue-800 mt-auto">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-3 text-blue-200 hover:bg-blue-800 hover:text-white rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
