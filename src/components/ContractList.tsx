import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Contract } from "@/types/contract";
import { ContractCard } from "./ContractCard";
import { Search, Filter, Calendar, ChevronDown, ChevronUp } from "lucide-react";

interface ContractListProps {
  contracts: Contract[];
  onContractSelect: (contract: Contract) => void;
  initialFilters?: {
    status?: string;
    modality?: string;
    unit?: string;
  };
}

const modalityLabels = {
  'dispensa': 'Dispensa',
  'pregao-eletronico': 'Pregão Eletrônico',
  'concorrencia-publica': 'Concorrência Pública',
  'chamada-publica': 'Chamada Pública',
  'registro-preco': 'Registro de Preço'
};

//

export function ContractList({ contracts, onContractSelect, initialFilters = {} }: ContractListProps) {
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all');
  const [modalityFilter, setModalityFilter] = useState(initialFilters.modality || 'all');
  const [unitFilter, setUnitFilter] = useState(initialFilters.unit || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Extrair valores únicos para os filtros
  const uniqueModalities = useMemo(() => {
    return Array.from(new Set(contracts.map(contract => contract.modality)));
  }, [contracts]);

  const uniqueUnits = useMemo(() => {
    return Array.from(new Set(contracts.map(contract => contract.managingUnit)));
  }, [contracts]);

  // Filtrar contratos com base nos filtros
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      // Filtro de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          contract.number.toLowerCase().includes(searchLower) ||
          contract.object.toLowerCase().includes(searchLower) ||
          contract.contractor.toLowerCase().includes(searchLower) ||
          contract.managingUnit.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtro de status
      if (statusFilter !== 'all' && contract.status !== statusFilter) {
        return false;
      }

      // Filtro de modalidade
      if (modalityFilter !== 'all' && contract.modality !== modalityFilter) {
        return false;
      }

      // Filtro de unidade gestora
      if (unitFilter !== 'all' && contract.managingUnit !== unitFilter) {
        return false;
      }

      // Filtro de data de início
      if (startDateFilter) {
        const contractStartDate = contract.startDate.toISOString().split('T')[0];
        if (contractStartDate < startDateFilter) {
          return false;
        }
      }

      // Filtro de data de fim
      if (endDateFilter) {
        const contractEndDate = contract.endDate.toISOString().split('T')[0];
        if (contractEndDate > endDateFilter) {
          return false;
        }
      }

      return true;
    });
  }, [contracts, searchTerm, statusFilter, modalityFilter, unitFilter, startDateFilter, endDateFilter]);

  const clearFilters = () => {
    setStatusFilter('all');
    setModalityFilter('all');
    setUnitFilter('all');
    setSearchTerm('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Consulta de Contratos</h2>
        <p className="text-gray-600">Busque e visualize todos os contratos cadastrados</p>
      </div>

      {/* Barra de busca e filtros - Layout responsivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-2 text-blue-600" />
              Filtros de Busca
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
          {/* Barra de busca principal */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por número, objeto, contratada ou secretaria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros rápidos - Layout responsivo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modalityFilter} onValueChange={setModalityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Modalidades</SelectItem>
                {uniqueModalities.map(modality => (
                  <SelectItem key={modality} value={modality}>
                    {modalityLabels[modality as keyof typeof modalityLabels]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Unidade Gestora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Unidades</SelectItem>
                {uniqueUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtros avançados - Layout responsivo */}
          {showAdvancedFilters && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700">Filtros Avançados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDateFilter" className="text-sm font-medium text-gray-700 mb-2 block">
                    Data de Vigência - Início
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="startDateFilter"
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endDateFilter" className="text-sm font-medium text-gray-700 mb-2 block">
                    Data de Vigência - Fim
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="endDateFilter"
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botão de limpar filtros - Layout responsivo */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Mostrando {filteredContracts.length} de {contracts.length} contratos
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-gray-600"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de contratos - Layout responsivo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContracts.map(contract => (
          <ContractCard
            key={contract.id}
            contract={contract}
            onClick={onContractSelect}
          />
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <Card>
          <CardContent className="p-8 md:p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Tente ajustar os filtros de busca ou cadastre um novo contrato
            </p>
            <Button onClick={() => window.location.hash = '#/contract-form'}>
              Cadastrar Novo Contrato
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}