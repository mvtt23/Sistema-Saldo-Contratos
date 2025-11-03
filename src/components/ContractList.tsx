import { useState } from "react";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContractCard } from "./ContractCard";
import { Contract } from "@/types/contract";
import { Search, Filter, Calendar } from "lucide-react";

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

export function ContractList({ contracts, onContractSelect, initialFilters = {} }: ContractListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters.status || "all");
  const [modalityFilter, setModalityFilter] = useState<string>(initialFilters.modality || "all");
  const [unitFilter, setUnitFilter] = useState<string>(initialFilters.unit || "all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  useEffect(() => {
    if (initialFilters.status) setStatusFilter(initialFilters.status);
    if (initialFilters.modality) setModalityFilter(initialFilters.modality);
    if (initialFilters.unit) setUnitFilter(initialFilters.unit);
  }, [initialFilters]);

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    const matchesModality = modalityFilter === "all" || contract.modality === modalityFilter;
    const matchesUnit = unitFilter === "all" || contract.managingUnit === unitFilter;
    
    const matchesDateRange = (() => {
      if (!startDateFilter && !endDateFilter) return true;
      
      const contractStart = contract.startDate;
      const contractEnd = contract.endDate;
      const filterStart = startDateFilter ? new Date(startDateFilter) : null;
      const filterEnd = endDateFilter ? new Date(endDateFilter) : null;
      
      if (filterStart && filterEnd) {
        // Contrato deve ter alguma sobreposição com o período filtrado
        return contractStart <= filterEnd && contractEnd >= filterStart;
      } else if (filterStart) {
        // Contrato deve terminar após a data inicial do filtro
        return contractEnd >= filterStart;
      } else if (filterEnd) {
        // Contrato deve começar antes da data final do filtro
        return contractStart <= filterEnd;
      }
      
      return true;
    })();

    return matchesSearch && matchesStatus && matchesModality && matchesUnit && matchesDateRange;
  });

  const uniqueUnits = Array.from(new Set(contracts.map(c => c.managingUnit)));
  const uniqueModalities = Array.from(new Set(contracts.map(c => c.modality)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Contratos</h2>
        <p className="text-gray-600">Gerencie e acompanhe todos os contratos da prefeitura</p>
      </div>

      {/* Filtros */}
      <div className="space-y-4">
        {/* Campo de busca em destaque */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por número, objeto ou contratada..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-base"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="expired">Vencido</SelectItem>
            <SelectItem value="suspended">Suspenso</SelectItem>
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
        
        {/* Filtro de Data de Vigência */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
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

      {/* Resultados */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Mostrando {filteredContracts.length} de {contracts.length} contratos
        </p>
      </div>

      {/* Lista de contratos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredContracts.map(contract => (
          <ContractCard
            key={contract.id}
            contract={contract}
            onClick={onContractSelect}
          />
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum contrato encontrado</p>
          <p className="text-gray-400 text-sm mt-2">
            Tente ajustar os filtros de busca
          </p>
        </div>
      )}
    </div>
  );
}