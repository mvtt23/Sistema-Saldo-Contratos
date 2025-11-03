import {
  LayoutDashboard,
  FileText,
  Plus,
  Building2,
  FileBarChart,
  Settings as SettingsIcon,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageType } from "@/App";

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
];

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const { signOut, user, canAccessModule } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-blue-900 text-white shadow-lg flex flex-col">
      <div className="flex-1">
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-white mr-3" />
            <div>
              <h1 className="text-lg font-bold text-white">
                Sistema de Contratos
              </h1>
              <p className="text-sm text-blue-200">Prefeitura Municipal</p>
            </div>
          </div>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            if (user?.role !== 'admin' && item.module === 'settings') {
              return null;
            }

            if (user?.role !== 'admin' && !canAccessModule(item.module)) {
              return null;
            }

            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
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
  );
}