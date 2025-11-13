import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ManagingUnit, Program } from "@/types/contract";
import { Building2, Plus, Edit, Trash2, BookOpen, User, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useContractManagement } from "@/hooks/useContractManagement";

interface Fiscal {
  id: string;
  name: string;
  cpf: string;
  ordinance: string;
}

interface ManagingUnitsProps {
  initialUnits: ManagingUnit[];
  refetchData: () => void;
  saveUnit: (unitData: Omit<ManagingUnit, 'programs'>, isEditing: boolean) => Promise<ManagingUnit | null>;
  deleteUnit: (unitId: string) => Promise<boolean>;
  saveProgram: (programData: Omit<Program, 'id'>, isEditing: boolean) => Promise<Program | null>;
  deleteProgram: (programId: string) => Promise<boolean>;
}

export function ManagingUnits({ initialUnits, refetchData, saveUnit, deleteUnit, saveProgram, deleteProgram }: ManagingUnitsProps) {
  const { toast } = useToast();
  const { getAllFiscals, saveFiscal, updateFiscal, deleteFiscal } = useContractManagement(refetchData);
  
  const [units, setUnits] = useState<ManagingUnit[]>(initialUnits);
  const [fiscals, setFiscals] = useState<Fiscal[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ManagingUnit | null>(null);
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [selectedUnitForProgram, setSelectedUnitForProgram] = useState<string>('');
  const [selectedFiscal, setSelectedFiscal] = useState<Fiscal | null>(null);
  const [fiscalSearchTerm, setFiscalSearchTerm] = useState('');
  const [showFiscalForm, setShowFiscalForm] = useState(false);
  const [showFiscalSearch, setShowFiscalSearch] = useState(false);
  const [editingFiscal, setEditingFiscal] = useState<Fiscal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    responsible: '',
    code: '',
    fiscalId: '',
    email: '',
    phone: ''
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

  // Carregar fiscais do banco de dados quando o componente for montado
  useEffect(() => {
    const loadFiscals = async () => {
      try {
        const loadedFiscals = await getAllFiscals();
        setFiscals(loadedFiscals);
      } catch (error) {
        console.error('Erro ao carregar fiscais:', error);
        toast({ title: "Erro", description: "Falha ao carregar fiscais.", variant: "destructive" });
      }
    };
    
    loadFiscals();
  }, [getAllFiscals, toast]);

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

  const handleNewFiscal = async () => {
    setEditingFiscal(null);
    setFiscalFormData({ name: '', cpf: '', ordinance: '' });
    setShowFiscalForm(true);
    setShowFiscalSearch(false);
  };

  const handleSaveFiscal = async () => {
    if (!fiscalFormData.name || !fiscalFormData.cpf || !fiscalFormData.ordinance) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios do fiscal.", variant: "destructive" });
      return;
    }

    try {
      const fiscalId = await saveFiscal(fiscalFormData);
      
      if (fiscalId) {
        // Adicionar o novo fiscal à lista local
        const newFiscal: Fiscal = {
          id: fiscalId,
          ...fiscalFormData
        };
        
        setFiscals(prev => [...prev, newFiscal]);
        setSelectedFiscal(newFiscal);
        setFiscalSearchTerm(newFiscal.name);
        setFormData(prev => ({ ...prev, fiscalId: fiscalId }));
        
        // Limpar formulário
        setFiscalFormData({ name: '', cpf: '', ordinance: '' });
        setShowFiscalForm(false);
        setShowFiscalSearch(false);
      }
    } catch (error) {
      console.error('Erro ao salvar fiscal:', error);
    }
  };

  const handleEditFiscal = async () => {
    if (!editingFiscal) return;
    
    try {
      const success = await updateFiscal(editingFiscal.id, fiscalFormData);
      
      if (success) {
        // Atualizar o fiscal na lista local
        setFiscals(prev => 
          prev.map(fiscal => 
            fiscal.id === editingFiscal.id 
              ? { ...fiscal, ...fiscalFormData }
              : fiscal
          )
        );
        
        // Atualizar o formulário
        setFormData(prev => ({ ...prev, fiscalId: editingFiscal.id }));
        
        // Fechar formulário
        setShowFiscalForm(false);
        setShowFiscalSearch(false);
        setFiscalFormData({ name: '', cpf: '', ordinance: '' });
        setEditingFiscal(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar fiscal:', error);
    }
  };

  const handleDeleteFiscal = async (fiscalId: string) => {
    if (confirm('Tem certeza que deseja excluir este fiscal?')) {
      try {
        const success = await deleteFiscal(fiscalId);
        
        if (success) {
          // Remover o fiscal da lista local
          setFiscals(prev => prev.filter(fiscal => fiscal.id !== fiscalId));
          
          // Se o fiscal excluído estava selecionado, limpar a seleção
          if (selectedFiscal?.id === fiscalId) {
            setSelectedFiscal(null);
            setFiscalSearchTerm('');
            setFormData(prev => ({ ...prev, fiscalId: '' }));
          }
        }
      } catch (error) {
        console.error('Erro ao excluir fiscal:', error);
      }
    }
  };

  const handleClearFiscal = () => {
    setSelectedFiscal(null);
    setFiscalSearchTerm('');
    setFormData(prev => ({ ...prev, fiscalId: '' }));
    setShowFiscalSearch(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.responsible || !formData.fiscalId) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios (Nome, Responsável, Fiscal).", variant: "destructive" });
      return;
    }

    const isEditing = !!editingUnit;
    
    const unitData: Omit<ManagingUnit, 'programs'> = {
      name: formData.name,
      responsible: formData.responsible,
      code: formData.code || formData.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase(),
      fiscalId: formData.fiscalId,
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@prefeitura.gov.br`,
      phone: formData.phone || '(11) 3333-0000',
    };

    // Se for edição, incluir o ID
    if (isEditing && editingUnit) {
      unitData.id = editingUnit.id;
    }

    const result = await saveUnit(unitData, isEditing);

    if (result) {
      handleCancel();
    }
  };

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!programFormData.name || !programFormData.unitId) {
      toast({ title: "Erro", description: "Preencha o nome do programa e selecione a secretaria.", variant: "destructive" });
      return;
    }

    const isEditing = !!editingProgram;
    
    const programData: Omit<Program, 'id'> = {
      name: programFormData.name,
      unitId: programFormData.unitId
    };

    // Se for edição, incluir o ID
    if (isEditing && editingProgram) {
      programData.id = editingProgram.id;
    }

    const result = await saveProgram(programData, isEditing);

    if (result) {
      handleCancelProgram();
    }
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
      fiscalId: unit.fiscalId || '',
      email: unit.email || '',
      phone: unit.phone || ''
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

  const handleDeleteProgram = async (programId: string) => {
    if (confirm('Tem certeza que deseja excluir este programa?')) {
      await deleteProgram(programId);
    }
  };

  const handleAddProgram = (unitId: string) => {
    setSelectedUnitForProgram(unitId);
    setProgramFormData({ name: '', unitId });
    setEditingProgram(null);
    setIsProgramFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta unidade gestora? Isso excluirá todos os programas vinculados.')) {
      await deleteUnit(id);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', responsible: '', code: '', fiscalId: '', email: '', phone: '' });
    setSelectedFiscal(null);
    setFiscalSearchTerm('');
    setShowFiscalSearch(false);
    setShowFiscalForm(false);
    setEditingFiscal(null);
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Unidades Gestoras</h2>
          <p className="text-gray-600">Gerencie as secretarias e programas da prefeitura</p>
        </div>
        <Button 
          onClick={() => {
            handleCancel();
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      {/* Formulário da Unidade - Layout responsivo */}
      {isFormOpen && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <Building2 className="w-5 h-5 mr-2 text-blue-600" />
              {editingUnit ? 'Editar Unidade Gestora' : 'Nova Unidade Gestora'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
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
                    placeholder="Ex: SEMED"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (Opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@prefeitura.gov.br"
                  />
                </div>
              </div>

              {/* Seleção/Cadastro do Fiscal - Layout responsivo */}
              <div>
                <Label>Fiscal *</Label>
                {selectedFiscal ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-green-800">{selectedFiscal.name}</h4>
                          <p className="text-sm text-green-600">CPF: {selectedFiscal.cpf}</p>
                          <p className="text-sm text-green-600">{selectedFiscal.ordinance}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingFiscal(selectedFiscal);
                              setFiscalFormData({
                                name: selectedFiscal.name,
                                cpf: selectedFiscal.cpf,
                                ordinance: selectedFiscal.ordinance
                              });
                              setShowFiscalForm(true);
                              setShowFiscalSearch(false);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFiscal(selectedFiscal.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                    </div>
                  </div>
                ) : showFiscalForm ? (
                  <div className="space-y-4 border border-blue-200 rounded-lg p-4 bg-blue-50 mt-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-blue-800">
                        {editingFiscal ? 'Editar Fiscal' : 'Cadastrar Novo Fiscal'}
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowFiscalForm(false);
                          setShowFiscalSearch(true);
                          setFiscalFormData({ name: '', cpf: '', ordinance: '' });
                          setEditingFiscal(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
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
                        onClick={editingFiscal ? handleEditFiscal : handleSaveFiscal}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {editingFiscal ? 'Atualizar Fiscal' : 'Salvar Fiscal'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mt-2">
                    <div className="flex flex-col sm:flex-row gap-2">
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
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
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

      {/* Formulário de Programa - Layout responsivo */}
      {isProgramFormOpen && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
              {editingProgram ? 'Editar Programa' : 'Novo Programa'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProgramSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
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

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
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

      {/* Lista de Unidades - Layout responsivo */}
      <div className="grid grid-cols-1 gap-6">
        {units.map(unit => (
          <Card key={unit.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {unit.name}
                    </CardTitle>
                    <p className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded inline-block">
                      {unit.code}
                    </p>
                  </div>
                  <div className="flex space-x-2 flex-wrap">
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
                
                {/* Informações da unidade */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2 flex-shrink-0" />
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
            </CardHeader>
            <CardContent>
              {/* Conteúdo adicional pode ser adicionado aqui */}
            </CardContent>
          </Card>
        ))}
      </div>

      {units.length === 0 && (
        <Card>
          <CardContent className="p-8 md:p-12 text-center">
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