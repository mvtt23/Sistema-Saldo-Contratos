import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ManagingUnit, Program } from "@/types/contract";
import { Building2, Plus, CreditCard as Edit, Trash2, BookOpen, User, Search, X } from "lucide-react";

interface Fiscal {
  id: string;
  name: string;
  cpf: string;
  ordinance: string;
}

// Mock data for fiscals (Fiscais não estão no Supabase, mantendo mock localmente)
const mockFiscals: Fiscal[] = [
  {
    id: '1',
    name: 'João Silva Santos',
    cpf: '123.456.789-00',
    ordinance: 'Portaria nº 001/2024'
  },
  {
    id: '2',
    name: 'Maria Oliveira Costa',
    cpf: '987.654.321-00',
    ordinance: 'Portaria nº 002/2024'
  },
  {
    id: '3',
    name: 'Carlos Eduardo Lima',
    cpf: '456.789.123-00',
    ordinance: 'Portaria nº 003/2024'
  }
];

interface ManagingUnitsProps {
  initialUnits: ManagingUnit[];
  refetchData: () => void;
}

export function ManagingUnits({ initialUnits, refetchData }: ManagingUnitsProps) {
  const [units, setUnits] = useState<ManagingUnit[]>(initialUnits);
  const [fiscals, setFiscals] = useState<Fiscal[]>(mockFiscals);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ManagingUnit | null>(null);
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [selectedUnitForProgram, setSelectedUnitForProgram] = useState<string>('');
  const [selectedFiscal, setSelectedFiscal] = useState<Fiscal | null>(null);
  const [fiscalSearchTerm, setFiscalSearchTerm] = useState('');
  const [showFiscalForm, setShowFiscalForm] = useState(false);
  const [showFiscalSearch, setShowFiscalSearch] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    responsible: '',
    code: '',
    fiscalId: ''
  });
  const [programFormData, setProgramFormData] = useState({
    name: '',
    unitId: ''
  });
  const [fiscalFormData, setFiscalFormData] = useState({
    name: '',
    cpf: '',
    ordinance: ''
  });

  // Atualiza o estado local quando a prop initialUnits muda (dados do Supabase)
  useState(() => {
    setUnits(initialUnits);
  }, [initialUnits]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProgramInputChange = (field: string, value: string) => {
    setProgramFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFiscalInputChange = (field: string, value: string) => {
    setFiscalFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredFiscals = fiscals.filter(fiscal =>
    fiscal.name.toLowerCase().includes(fiscalSearchTerm.toLowerCase())
  );

  const handleFiscalSelect = (fiscal: Fiscal) => {
    setSelectedFiscal(fiscal);
    setFiscalSearchTerm(fiscal.name);
    setFormData(prev => ({ ...prev, fiscalId: fiscal.id }));
    setShowFiscalSearch(false);
  };

  const handleNewFiscal = () => {
    setShowFiscalForm(true);
    setShowFiscalSearch(false);
  };

  const handleSaveFiscal = () => {
    const newFiscal: Fiscal = {
      id: Date.now().toString(),
      ...fiscalFormData
    };
    
    setFiscals(prev => [...prev, newFiscal]);
    setSelectedFiscal(newFiscal);
    setFiscalSearchTerm(newFiscal.name);
    setFormData(prev => ({ ...prev, fiscalId: newFiscal.id }));
    
    setFiscalFormData({ name: '', cpf: '', ordinance: '' });
    setShowFiscalForm(false);
    setShowFiscalSearch(false);
  };

  const handleClearFiscal = () => {
    setSelectedFiscal(null);
    setFiscalSearchTerm('');
    setFormData(prev => ({ ...prev, fiscalId: '' }));
    setShowFiscalSearch(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // NOTE: Em uma implementação real, esta função faria um INSERT/UPDATE no Supabase.
    // Após a operação, você chamaria refetchData().
    
    if (editingUnit) {
      // Editar unidade existente
      setUnits(prev => prev.map(unit => 
        unit.id === editingUnit.id 
          ? { ...unit, ...formData, programs: unit.programs, email: `${formData.name.toLowerCase().replace(/\s+/g, '.')}@prefeitura.gov.br` }
          : unit
      ));
    } else {
      // Criar nova unidade
      const newUnit: ManagingUnit = {
        id: Date.now().toString(),
        name: formData.name,
        responsible: formData.responsible,
        code: formData.code || formData.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase(),
        fiscalId: formData.fiscalId,
        email: `${formData.name.toLowerCase().replace(/\s+/g, '.')}@prefeitura.gov.br`,
        phone: '(11) 3333-0000', // Default phone
        programs: []
      };
      setUnits(prev => [...prev, newUnit]);
    }

    // Reset form
    setFormData({ name: '', responsible: '', code: '', fiscalId: '' });
    setSelectedFiscal(null);
    setFiscalSearchTerm('');
    setIsFormOpen(false);
    setEditingUnit(null);
    
    // refetchData(); // Chamar refetch para atualizar o estado global
  };

  const handleProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // NOTE: Em uma implementação real, esta função faria um INSERT/UPDATE no Supabase.
    
    if (editingProgram) {
      // Editar programa existente
      setUnits(prev => prev.map(unit => ({
        ...unit,
        programs: unit.programs.map(program => 
          program.id === editingProgram.id 
            ? { ...program, ...programFormData }
            : program
        )
      })));
    } else {
      // Criar novo programa
      const newProgram: Program = {
        id: Date.now().toString(),
        name: programFormData.name,
        unitId: programFormData.unitId
      };
      
      // Adicionar à unidade correspondente
      setUnits(prev => prev.map(unit => 
        unit.id === programFormData.unitId 
          ? { ...unit, programs: [...unit.programs, newProgram] }
          : unit
      ));
    }

    // Reset form
    setProgramFormData({ name: '', unitId: '' });
    setIsProgramFormOpen(false);
    setEditingProgram(null);
    setSelectedUnitForProgram('');
    // refetchData(); // Chamar refetch para atualizar o estado global
  };

  const handleEdit = (unit: ManagingUnit) => {
    setEditingUnit(unit);
    const unitFiscal = fiscals.find(f => f.id === unit.fiscalId);
    if (unitFiscal) {
      setSelectedFiscal(unitFiscal);
      setFiscalSearchTerm(unitFiscal.name);
    } else {
      setSelectedFiscal(null);
      setFiscalSearchTerm('');
    }
    setFormData({
      name: unit.name,
      responsible: unit.responsible,
      code: unit.code,
      fiscalId: unit.fiscalId || ''
    });
    setIsFormOpen(true);
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setProgramFormData({
      name: program.name,
      unitId: program.unitId
    });
    setIsProgramFormOpen(true);
  };

  const handleDeleteProgram = (programId: string) => {
    if (confirm('Tem certeza que deseja excluir este programa?')) {
      // NOTE: Em uma implementação real, esta função faria um DELETE no Supabase.
      setUnits(prev => prev.map(unit => ({
        ...unit,
        programs: unit.programs.filter(program => program.id !== programId)
      })));
      // refetchData(); // Chamar refetch para atualizar o estado global
    }
  };

  const handleAddProgram = (unitId: string) => {
    setSelectedUnitForProgram(unitId);
    setProgramFormData({ name: '', unitId });
    setIsProgramFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta unidade gestora?')) {
      // NOTE: Em uma implementação real, esta função faria um DELETE no Supabase.
      setUnits(prev => prev.filter(unit => unit.id !== id));
      // refetchData(); // Chamar refetch para atualizar o estado global
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', responsible: '', code: '', fiscalId: '' });
    setSelectedFiscal(null);
    setFiscalSearchTerm('');
    setShowFiscalSearch(false);
    setShowFiscalForm(false);
    setIsFormOpen(false);
    setEditingUnit(null);
  };

  const handleCancelProgram = () => {
    setProgramFormData({ name: '', unitId: '' });
    setIsProgramFormOpen(false);
    setEditingProgram(null);
    setSelectedUnitForProgram('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Unidades Gestoras</h2>
          <p className="text-gray-600">Gerencie as secretarias e programas da prefeitura</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      {/* Formulário */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-600" />
              {editingUnit ? 'Editar Unidade Gestora' : 'Nova Unidade Gestora'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Secretaria *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Secretaria de Educação"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="responsible">Secretário(a) *</Label>
                  <Input
                    id="responsible"
                    value={formData.responsible}
                    onChange={(e) => handleInputChange('responsible', e.target.value)}
                    placeholder="Nome do(a) secretário(a)"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="code">Código (Opcional)</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    placeholder="Ex: SEMED (será gerado automaticamente se vazio)"
                  />
                </div>
              </div>

              {/* Seleção/Cadastro do Fiscal */}
              <div>
                <Label>Fiscal *</Label>
                {selectedFiscal ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-green-800">{selectedFiscal.name}</h4>
                        <p className="text-sm text-green-600">CPF: {selectedFiscal.cpf}</p>
                        <p className="text-sm text-green-600">{selectedFiscal.ordinance}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearFiscal}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Alterar
                      </Button>
                    </div>
                  </div>
                ) : showFiscalForm ? (
                  <div className="space-y-4 border border-blue-200 rounded-lg p-4 bg-blue-50 mt-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-blue-800">Cadastrar Novo Fiscal</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowFiscalForm(false);
                          setShowFiscalSearch(true);
                          setFiscalFormData({ name: '', cpf: '', ordinance: '' });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fiscalName">Nome Completo *</Label>
                        <Input
                          id="fiscalName"
                          value={fiscalFormData.name}
                          onChange={(e) => handleFiscalInputChange('name', e.target.value)}
                          placeholder="Nome completo do fiscal"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="fiscalCpf">CPF *</Label>
                        <Input
                          id="fiscalCpf"
                          value={fiscalFormData.cpf}
                          onChange={(e) => handleFiscalInputChange('cpf', e.target.value)}
                          placeholder="000.000.000-00"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="fiscalOrdinance">Portaria *</Label>
                      <Input
                        id="fiscalOrdinance"
                        value={fiscalFormData.ordinance}
                        onChange={(e) => handleFiscalInputChange('ordinance', e.target.value)}
                        placeholder="Ex: Portaria nº 001/2024"
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleSaveFiscal}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Salvar Fiscal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mt-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar fiscal por nome..."
                          value={fiscalSearchTerm}
                          onChange={(e) => {
                            setFiscalSearchTerm(e.target.value);
                            setShowFiscalSearch(true);
                          }}
                          onFocus={() => setShowFiscalSearch(true)}
                          className="pl-10"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleNewFiscal}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Fiscal
                      </Button>
                    </div>
                    
                    {showFiscalSearch && fiscalSearchTerm && (
                      <div className="max-h-48 overflow-y-auto border rounded-lg bg-white shadow-lg">
                        {filteredFiscals.length > 0 ? (
                          filteredFiscals.map(fiscal => (
                            <div
                              key={fiscal.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                              onClick={() => handleFiscalSelect(fiscal)}
                            >
                              <div className="font-medium">{fiscal.name}</div>
                              <div className="text-sm text-gray-600">
                                {fiscal.cpf} - {fiscal.ordinance}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-gray-500 text-center">
                            Nenhum fiscal encontrado
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingUnit ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Programa */}
      {isProgramFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
              {editingProgram ? 'Editar Programa' : 'Novo Programa'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProgramSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="programName">Nome do Programa *</Label>
                  <Input
                    id="programName"
                    value={programFormData.name}
                    onChange={(e) => handleProgramInputChange('name', e.target.value)}
                    placeholder="Ex: Programa de Educação Básica"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="programUnit">Secretaria *</Label>
                  <select
                    id="programUnit"
                    value={programFormData.unitId}
                    onChange={(e) => handleProgramInputChange('unitId', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  >
                    <option value="">Selecione a secretaria</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleCancelProgram}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingProgram ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Unidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map(unit => (
          <Card key={unit.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                    {unit.name}
                  </CardTitle>
                  <p className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded inline-block">
                    {unit.code}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(unit)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(unit.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  <div>
                    <p className="font-medium">Secretário(a): {unit.responsible}</p>
                    {unit.fiscalId && (() => {
                      const fiscal = fiscals.find(f => f.id === unit.fiscalId);
                      return fiscal ? (
                        <p className="text-xs text-gray-500">Fiscal: {fiscal.name}</p>
                      ) : null;
                    })()}
                  </div>
                </div>
                
                {/* Programas da Unidade */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Programas ({unit.programs.length})</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddProgram(unit.id)}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {unit.programs.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">Nenhum programa cadastrado</p>
                  ) : (
                    <div className="space-y-1">
                      {unit.programs.map(program => (
                        <div key={program.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                          <span className="flex items-center">
                            <BookOpen className="w-3 h-3 mr-1 text-blue-500" />
                            {program.name}
                          </span>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditProgram(program)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteProgram(program.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {units.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma unidade gestora cadastrada
            </h3>
            <p className="text-gray-500 mb-4">
              Comece cadastrando as secretarias da prefeitura
            </p>
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeira Unidade
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}