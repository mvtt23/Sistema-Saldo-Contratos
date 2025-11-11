import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Contract, ManagingUnit } from "@/types/contract";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  FileText, 
  Download, 
  Calendar, 
  Building2, 
  DollarSign, 
  BarChart3,
  PieChart,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ReportsProps {
  contracts: Contract[];
  onContractSelect: (contract: Contract) => void;
  managingUnits: ManagingUnit[];
}

export function Reports({ contracts, onContractSelect, managingUnits }: ReportsProps) {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('summary');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtrar contratos por unidade selecionada
  const filteredContracts = selectedUnit === 'all' 
    ? contracts 
    : contracts.filter(contract => contract.managingUnit === selectedUnit);

  // Filtrar por data
  const dateFilteredContracts = filteredContracts.filter(contract => {
    if (!startDate && !endDate) return true;
    
    const contractDate = contract.startDate;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && contractDate < start) return false;
    if (end && contractDate > end) return false;
    
    return true;
  });

  // Calcular totais
  const totalContracts = dateFilteredContracts.length;
  const totalValue = dateFilteredContracts.reduce((sum, contract) => sum + contract.currentValue, 0);
  const totalUsed = dateFilteredContracts.reduce((sum, contract) => sum + contract.usedValue, 0);
  const totalRemaining = dateFilteredContracts.reduce((sum, contract) => sum + contract.remainingBalance, 0);

  // Contratos por status
  const contractsByStatus = dateFilteredContracts.reduce((acc, contract) => {
    acc[contract.status] = (acc[contract.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Contratos por modalidade
  const contractsByModality = dateFilteredContracts.reduce((acc, contract) => {
    acc[contract.modality] = (acc[contract.modality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const modalityLabels = {
    'dispensa': 'Dispensa',
    'pregao-eletronico': 'Pregão Eletrônico',
    'concorrencia-publica': 'Concorrência Pública',
    'chamada-publica': 'Chamada Pública',
    'registro-preco': 'Registro de Preço'
  };

  const statusLabels = {
    'active': 'Ativo',
    'expired': 'Vencido',
    'suspended': 'Suspenso',
    'completed': 'Concluído'
  };

  const handleGenerateReport = () => {
    // Lógica para gerar relatório
    console.log('Gerando relatório:', {
      selectedUnit,
      selectedType,
      selectedFormat,
      startDate,
      endDate,
      totalContracts,
      totalValue,
      totalUsed,
      totalRemaining
    });
    
    // Aqui você implementaria a lógica de geração de PDF ou exportação
    alert('Relatório gerado com sucesso! (Implementação futura)');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Relatórios</h2>
        <p className="text-gray-600">Gere relatórios detalhados sobre contratos e gestão</p>
      </div>

      {/* Filtros do relatório - Layout responsivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-2 text-blue-600" />
              Filtros do Relatório
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="md:hidden"
            >
              {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros principais - Layout responsivo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="unitFilter">Unidade Gestora</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Unidades</SelectItem>
                  {managingUnits.map(unit => (
                    <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reportType">Tipo de Relatório</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Resumo Geral</SelectItem>
                  <SelectItem value="detailed">Detalhado</SelectItem>
                  <SelectItem value="byStatus">Por Status</SelectItem>
                  <SelectItem value="byModality">Por Modalidade</SelectItem>
                  <SelectItem value="byUnit">Por Unidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reportFormat">Formato</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros avançados - Layout responsivo */}
          {showAdvancedFilters && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700">Filtros Avançados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data Inicial</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endDate">Data Final</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botão de geração - Layout responsivo */}
          <div className="flex justify-end">
            <Button onClick={handleGenerateReport} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos dados - Layout responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-500 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Total de Contratos</p>
                <p className="text-2xl font-bold text-gray-900">{totalContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="w-6 h-6 text-green-500 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 text-orange-500 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Valor Utilizado</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalUsed)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="w-6 h-6 text-purple-500 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Saldo Restante</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRemaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e tabelas - Layout responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contratos por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Contratos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(contractsByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{statusLabels[status as keyof typeof statusLabels]}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / totalContracts) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contratos por Modalidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-600" />
              Contratos por Modalidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(contractsByModality).map(([modality, count]) => (
                <div key={modality} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{modalityLabels[modality as keyof typeof modalityLabels]}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(count / totalContracts) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada - Layout responsivo */}
      {selectedType === 'detailed' && (
        <Card>
          <CardHeader>
            <CardTitle>Contratos Detalhados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Número</th>
                    <th className="text-left p-2">Secretaria</th>
                    <th className="text-left p-2">Contratada</th>
                    <th className="text-left p-2">Valor</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Vigência</th>
                  </tr>
                </thead>
                <tbody>
                  {dateFilteredContracts.map(contract => (
                    <tr key={contract.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onContractSelect(contract)}>
                      <td className="p-2 font-medium">{contract.number}</td>
                      <td className="p-2">{contract.managingUnit}</td>
                      <td className="p-2">{contract.contractor}</td>
                      <td className="p-2">{formatCurrency(contract.currentValue)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          contract.status === 'active' ? 'bg-green-100 text-green-800' :
                          contract.status === 'expired' ? 'bg-red-100 text-red-800' :
                          contract.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {statusLabels[contract.status]}
                        </span>
                      </td>
                      <td className="p-2">
                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há contratos - Layout responsivo */}
      {totalContracts === 0 && (
        <Card>
          <CardContent className="p-8 md:p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Ajuste os filtros para encontrar contratos ou cadastre novos contratos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}