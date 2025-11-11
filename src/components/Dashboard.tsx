import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Clock,
  XCircle,
  Filter,
  Building2
} from "lucide-react";
import { Contract, ManagingUnit } from "@/types/contract";

interface DashboardProps {
  onFilteredView: (filters: { status?: string; modality?: string; unit?: string }) => void;
  contracts: Contract[];
  managingUnits: ManagingUnit[];
  onContractSelect?: (contract: Contract) => void;
}

const modalityLabels = {
  'dispensa': 'Dispensa',
  'pregao-eletronico': 'Pregão Eletrônico',
  'concorrencia-publica': 'Concorrência Pública',
  'chamada-publica': 'Chamada Pública',
  'registro-preco': 'Registro de Preço'
};

// Paleta de cores institucionais moderna
const COLORS = ['#2563EB', '#16A34A', '#F97316', '#7C3AED', '#0891B2', '#DC2626'];

export function Dashboard({ onFilteredView, contracts, managingUnits, onContractSelect }: DashboardProps) {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  // Filtrar contratos por secretaria selecionada
  const filteredContracts = selectedUnit === 'all' 
    ? contracts 
    : contracts.filter(contract => contract.managingUnit === selectedUnit);

  const totalContracts = filteredContracts.length;
  const activeContracts = filteredContracts.filter(c => c.status === 'active').length;
  const expiredContracts = filteredContracts.filter(c => c.status === 'expired').length;
  const completedContracts = filteredContracts.filter(c => c.status === 'completed').length;
  const rescindedContracts = filteredContracts.filter(c => c.status === 'suspended').length;
  
  const totalUsed = filteredContracts.reduce((sum, contract) => sum + contract.usedValue, 0);
  const totalValue = filteredContracts.reduce((sum, contract) => sum + contract.currentValue, 0);
  
  // Contratos próximos ao vencimento (30 dias)
  const contractsNearExpiry = filteredContracts.filter(contract => {
    if (contract.status !== 'active') return false;
    const daysRemaining = Math.ceil((contract.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 30 && daysRemaining > 0;
  });

  // Contratos com saldo baixo (menos de 10%)
  const contractsLowBalance = filteredContracts.filter(contract => {
    if (contract.status !== 'active') return false;
    const remainingPercentage = (contract.remainingBalance / contract.currentValue) * 100;
    return remainingPercentage < 10;
  });

  // Dados para o gráfico de pizza por modalidade
  const activeContractsByModality = filteredContracts
    .filter(c => c.status === 'active')
    .reduce((acc, contract) => {
      const modality = contract.modality;
      acc[modality] = (acc[modality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = Object.entries(activeContractsByModality).map(([modality, count]) => ({
    name: modalityLabels[modality as keyof typeof modalityLabels],
    value: count,
    modality: modality
  }));

  const handlePieClick = (data: any) => {
    const filters: any = { status: 'active', modality: data.modality };
    if (selectedUnit !== 'all') {
      filters.unit = selectedUnit;
    }
    onFilteredView(filters);
  };

  const handleContractClick = (contractNumber: string) => {
    const contract = filteredContracts.find(c => c.number === contractNumber);
    if (contract && onContractSelect) {
      onContractSelect(contract);
    }
  };

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleMouseEnter = (data: any, index: number) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Visão Geral</h2>
          <p className="text-gray-600">Visão geral dos contratos da prefeitura municipal</p>
        </div>
        
        {/* Filtro por Secretaria - Layout responsivo */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <Select value={selectedUnit} onValueChange={setSelectedUnit} className="w-full">
              <SelectTrigger className="w-full">
                <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <SelectValue placeholder="Filtrar por secretaria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Secretarias</SelectItem>
                {managingUnits.map(unit => (
                  <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas principais - Layout responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-green-50 to-white" 
          onClick={() => {
            const filters: any = { status: 'active' };
            if (selectedUnit !== 'all') filters.unit = selectedUnit;
            onFilteredView(filters);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Contratos Ativos
            </CardTitle>
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-4xl font-bold text-green-700 mb-2">{activeContracts}</div>
            <p className="text-sm text-gray-500 mb-3">
              de {totalContracts} contratos totais
            </p>
            <div className="space-y-1">
              {Object.entries(activeContractsByModality).slice(0, 2).map(([modality, count]) => (
                <div 
                  key={modality}
                  className="flex justify-between text-xs font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 cursor-pointer px-2 py-1 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const filters: any = { status: 'active', modality };
                    if (selectedUnit !== 'all') filters.unit = selectedUnit;
                    onFilteredView(filters);
                  }}
                >
                  <span className="font-semibold">{modalityLabels[modality as keyof typeof modalityLabels]}</span>
                  <span className="font-bold text-green-600">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-orange-500 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-white"
          onClick={() => {
            const filters: any = { status: 'active' };
            if (selectedUnit !== 'all') filters.unit = selectedUnit;
            onFilteredView(filters);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Próximos ao Vencimento
            </CardTitle>
            <div className="p-2 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-4xl font-bold text-orange-700 mb-2">{contractsNearExpiry.length}</div>
            <p className="text-sm text-gray-500 mb-3">
              vencem em até 30 dias
            </p>
            {contractsNearExpiry.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {contractsNearExpiry.slice(0, 3).map((contract, index) => {
                  const daysRemaining = Math.ceil((contract.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div 
                      key={contract.id}
                      className="flex justify-between items-center text-xs hover:bg-orange-50 cursor-pointer px-2 py-1 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContractClick(contract.number);
                      }}
                    >
                      <span className="font-semibold text-orange-800 hover:underline truncate">{contract.number}</span>
                      <span className="text-orange-600">{daysRemaining}d</span>
                    </div>
                  );
                })}
                {contractsNearExpiry.length > 3 && (
                  <div className="text-xs text-orange-600 text-center py-1 cursor-pointer hover:bg-orange-50 rounded">
                    ...ver mais {contractsNearExpiry.length - 3}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-red-500 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-red-50 to-white"
          onClick={() => {
            const filters: any = { status: 'active' };
            if (selectedUnit !== 'all') filters.unit = selectedUnit;
            onFilteredView(filters);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Saldo Baixo
            </CardTitle>
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-4xl font-bold text-red-700 mb-2">{contractsLowBalance.length}</div>
            <p className="text-sm text-gray-500 mb-3">
              contratos com saldo baixo
            </p>
            {contractsLowBalance.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {contractsLowBalance.slice(0, 3).map((contract) => {
                  const remainingPercentage = (contract.remainingBalance / contract.currentValue) * 100;
                  return (
                    <div 
                      key={contract.id}
                      className="flex justify-between items-center text-xs hover:bg-red-50 cursor-pointer px-2 py-1 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContractClick(contract.number);
                      }}
                    >
                      <span className="font-semibold text-red-800 hover:underline truncate">{contract.number}</span>
                      <span className="text-red-600">{remainingPercentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
                {contractsLowBalance.length > 3 && (
                  <div className="text-xs text-red-600 text-center py-1 cursor-pointer hover:bg-red-50 rounded">
                    ...ver mais {contractsLowBalance.length - 3}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-gray-500 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-gray-50 to-white"
          onClick={() => {
            const filters: any = { status: 'suspended' };
            if (selectedUnit !== 'all') filters.unit = selectedUnit;
            onFilteredView(filters);
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Contratos Rescindidos
            </CardTitle>
            <div className="p-2 bg-gray-100 rounded-full">
              <XCircle className="h-6 w-6 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-4xl font-bold text-gray-700 mb-2">{rescindedContracts}</div>
            <p className="text-sm text-gray-500">
              contratos rescindidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Contratos Ativos por Modalidade - Layout responsivo */}
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-xl md:text-3xl font-bold text-gray-800 mb-4">
            Contratos Ativos por Modalidade
          </CardTitle>
          <p className="text-gray-600 text-base md:text-lg">
            Distribuição dos {activeContracts} contratos ativos por tipo de licitação
            {selectedUnit !== 'all' && (
              <span className="block text-blue-600 font-semibold mt-1">
                Filtrado por: {selectedUnit}
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          {pieChartData.length > 0 ? (
            <div className="flex flex-col xl:flex-row items-center justify-center gap-8 py-8">
              {/* Donut Chart - Layout responsivo */}
              <div className="h-[300px] w-[300px] flex-shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius="85%"
                      innerRadius="45%"
                      fill="#8884d8"
                      dataKey="value"
                      onClick={handlePieClick}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      className="cursor-pointer"
                      stroke="#ffffff"
                      strokeWidth={4}
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          style={{
                            filter: hoveredIndex === index ? 'brightness(1.15) drop-shadow(0 6px 12px rgba(0,0,0,0.25))' : 'none',
                            transform: hoveredIndex === index ? 'scale(1.08)' : 'scale(1)',
                            transformOrigin: 'center',
                            transition: 'all 0.3s ease-in-out'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const total = pieChartData.reduce((sum, entry) => sum + entry.value, 0);
                          const percent = ((data.value / total) * 100).toFixed(1);
                          return (
                            <div className="bg-white p-4 border-0 rounded-2xl shadow-2xl border border-gray-100 backdrop-blur-sm">
                              <div className="flex items-center mb-3">
                                <div 
                                  className="w-4 h-4 rounded-full mr-3 shadow-sm"
                                  style={{ backgroundColor: COLORS[pieChartData.findIndex(item => item.name === data.payload.name) % COLORS.length] }}
                                />
                                <p className="font-bold text-gray-800 text-lg">{data.payload.name}</p>
                              </div>
                              <p className="text-2xl font-bold text-blue-600 mb-2">
                                {data.value} contratos
                              </p>
                              <p className="text-base text-gray-600 font-medium">
                                {percent}% do total
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      position={{ x: 0, y: 0 }}
                      allowEscapeViewBox={{ x: false, y: false }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Centro do donut com informação total */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-4xl md:text-6xl font-bold text-gray-800 mb-2">
                      {activeContracts}
                    </p>
                    <p className="text-lg md:text-xl text-gray-600 font-semibold">
                      Contratos Ativos
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Legenda Melhorada - Layout responsivo */}
              <div className="flex flex-col space-y-4 xl:ml-8 w-full xl:w-auto max-w-md">
                <h4 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 text-center xl:text-left">
                  Modalidades de Licitação
                </h4>
                {pieChartData.map((entry, index) => {
                  const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
                  const percent = ((entry.value / total) * 100).toFixed(1);
                  return (
                    <div 
                      key={entry.name}
                      className={`flex items-center space-x-4 cursor-pointer p-4 rounded-2xl transition-all duration-300 border-2 ${
                        hoveredIndex === index 
                          ? 'bg-blue-50 border-blue-200 shadow-xl transform scale-105' 
                          : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:shadow-lg'
                      }`}
                      onClick={() => handlePieClick(entry)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-lg leading-tight mb-1">
                          {entry.name}
                        </p>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-2xl md:text-4xl font-bold text-blue-600">
                            {entry.value}
                          </span>
                          <span className="text-sm md:text-base text-gray-500 font-medium">
                            contratos ({percent}%)
                          </span>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-gray-400 font-medium">
                          Clique para filtrar
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Nenhum contrato ativo encontrado
                {selectedUnit !== 'all' && ` para ${selectedUnit}`}
              </p>
            </div>
          )}
          
          {/* Estatísticas resumidas - Layout responsivo */}
          {pieChartData.length > 0 && (
            <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-blue-50 p-4 rounded-xl shadow-sm">
                  <p className="text-2xl md:text-4xl font-bold text-blue-600 mb-2">{activeContracts}</p>
                  <p className="text-base text-gray-600 font-semibold">Total Ativo</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl shadow-sm">
                  <p className="text-xl md:text-2xl font-bold text-orange-600 mb-2">
                    {activeContracts > 0 ? Math.round(filteredContracts.filter(c => c.status === 'active').reduce((sum, c) => sum + ((c.usedValue / c.currentValue) * 100), 0) / activeContracts) : 0}%
                  </p>
                  <p className="text-base text-gray-600 font-semibold">Execução Média</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl shadow-sm">
                  <p className="text-lg md:text-2xl font-bold text-green-600 mb-2">
                    {formatCurrency(filteredContracts.filter(c => c.status === 'active').reduce((sum, c) => sum + c.currentValue, 0))}
                  </p>
                  <p className="text-base text-gray-600 font-semibold">Valor Total</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl shadow-sm">
                  <p className="text-2xl md:text-4xl font-bold text-purple-600 mb-2">{pieChartData.length}</p>
                  <p className="text-base text-gray-600 font-semibold">Modalidades</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}