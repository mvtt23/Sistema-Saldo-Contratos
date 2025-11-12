import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Company, Contract, ManagingUnit } from "@/types/contract";
import { Building2, User, FileText, Save, Search, Plus, X, Edit2, Trash2, CheckCircle, Loader2 } from "lucide-react";

interface ContractFormProps {
  onContractSave: (contractData: Omit<Contract, 'id' | 'additives' | 'invoices'>) => void;
  managingUnits: ManagingUnit[];
  companies: Company[];
  saveCompany: (companyData: Omit<Company, 'id'>, isEditing: boolean) => Promise<Company | null>;
  deleteCompany: (companyId: string) => Promise<boolean>;
}

export function ContractForm({ onContractSave, managingUnits, companies, saveCompany, deleteCompany }: ContractFormProps) {
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [showCompanyList, setShowCompanyList] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    document: '',
    city: '',
    state: ''
  });

  const [formData, setFormData] = useState({
    // Dados do Contrato
    contractNumber: '',
    modality: '',
    isCarona: false,
    managingUnit: '',
    program: '',
    startDate: '',
    endDate: '',
    object: '',
    value: ''
  });

  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  const selectedUnit = managingUnits.find(unit => unit.name === formData.managingUnit);
  const availablePrograms = selectedUnit ? selectedUnit.programs : [];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyInputChange = (field: string, value: string) => {
    setCompanyFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
    company.document.includes(companySearchTerm)
  );

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setCompanySearchTerm(company.name);
    setShowCompanyList(false);
    setShowCompanyForm(false);
    setCompanySaved(false);
  };

  const handleNewCompany = () => {
    setEditingCompany(null);
    setCompanyFormData({ name: '', document: '', city: '', state: '' });
    setShowCompanyForm(true);
    setShowCompanyList(false);
    setCompanySaved(false);
  };

  const handleSaveCompany = async () => {
    if (!companyFormData.name || !companyFormData.document || !companyFormData.city || !companyFormData.state) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha todos os campos obrigatórios da empresa." });
      return;
    }

    // Verificar se o documento já existe (exceto quando estiver editando)
    if (!editingCompany) {
      const existingCompany = companies.find(company => 
        company.document === companyFormData.document
      );
      
      if (existingCompany) {
        toast({ 
          variant: "destructive", 
          title: "Erro", 
          description: "empresa já cadastrada" 
        });
        return;
      }
    }

    setIsSavingCompany(true);
    
    try {
      const isEditing = !!editingCompany;
      
      const dataToSave = isEditing 
        ? { ...editingCompany, ...companyFormData } as Company
        : companyFormData as Omit<Company, 'id'>;

      const result = await saveCompany(dataToSave, isEditing);

      if (result) {
        setSelectedCompany(result);
        setCompanySearchTerm(result.name);
        setCompanySaved(true);
        setShowCompanyForm(false);
        
        // Limpar o formulário após 2 segundos
        setTimeout(() => {
          setCompanyFormData({ name: '', document: '', city: '', state: '' });
          setCompanySaved(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleCancelCompany = () => {
    setCompanyFormData({ name: '', document: '', city: '', state: '' });
    setShowCompanyForm(false);
    setCompanySaved(false);
  };

  const handleClearCompany = () => {
    setSelectedCompany(null);
    setCompanySearchTerm('');
    setShowCompanyForm(false);
    setCompanySaved(false);
  };

  const handleManageCompanies = () => {
    setShowCompanyList(true);
    setShowCompanyForm(false);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setCompanyFormData({
      name: company.name,
      document: company.document,
      city: company.city,
      state: company.state
    });
    setShowCompanyForm(true);
    setShowCompanyList(false);
    setCompanySaved(false);
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (confirm('Tem certeza que deseja excluir esta empresa?')) {
      const success = await deleteCompany(companyId);
      if (success && selectedCompany?.id === companyId) {
        setSelectedCompany(null);
        setCompanySearchTerm('');
        setShowCompanyForm(false);
        setCompanySaved(false);
      }
    }
  };

  const handleBackToSearch = () => {
    setShowCompanyList(false);
    setShowCompanyForm(false);
    setCompanyFormData({ name: '', document: '', city: '', state: '' });
    setEditingCompany(null);
    setCompanySaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      toast({ variant: "destructive", title: "Erro", description: "Por favor, selecione uma empresa antes de salvar o contrato." });
      return;
    }
    
    if (!formData.contractNumber || !formData.modality || !formData.managingUnit || !formData.startDate || !formData.endDate || !formData.object || !formData.value) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha todos os campos obrigatórios do contrato." });
      return;
    }

    const value = parseFloat(formData.value);
    if (isNaN(value) || value <= 0) {
      toast({ variant: "destructive", title: "Erro", description: "O valor do contrato deve ser um número positivo." });
      return;
    }

    // Criar o novo contrato
    const contractData: Omit<Contract, 'id' | 'additives' | 'invoices'> = {
      number: formData.contractNumber,
      modality: formData.modality as any,
      isCarona: formData.modality === 'registro-preco' ? formData.isCarona : false,
      object: formData.object,
      contractor: selectedCompany.name,
      managingUnit: formData.managingUnit,
      originalValue: value,
      currentValue: value,
      usedValue: 0,
      remainingBalance: value,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      status: 'active' as const,
    };

    // Salvar o contrato usando a função Supabase
    onContractSave(contractData);
    
    // Limpar formulário (será feito após o sucesso do saveContract no App.tsx)
    setFormData({
      contractNumber: '',
      modality: '',
      isCarona: false,
      managingUnit: '',
      program: '',
      startDate: '',
      endDate: '',
      object: '',
      value: ''
    });
    setSelectedCompany(null);
    setCompanySearchTerm('');
    setShowCompanyForm(false);
    setCompanySaved(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Cadastro de Contratos</h2>
        <p className="text-gray-600">Cadastre um novo contrato no sistema</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção/Cadastro da Empresa - Layout responsivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Empresa Contratada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCompany && !editingCompany && !companySaved ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800">{selectedCompany.name}</h4>
                      <p className="text-sm text-green-600">CNPJ/CPF: {selectedCompany.document}</p>
                      <p className="text-sm text-green-600">{selectedCompany.city}/{selectedCompany.state}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCompany(selectedCompany)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearCompany}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Trocar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : companySaved ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-800">Empresa cadastrada com sucesso!</h4>
                    <p className="text-sm text-green-600">{companyFormData.name} - {companyFormData.document}</p>
                  </div>
                </div>
              </div>
            ) : showCompanyList ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">Gerenciar Empresas Cadastradas</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBackToSearch}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Voltar
                  </Button>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {companies.length > 0 ? (
                    companies.map(company => (
                      <div
                        key={company.id}
                        className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-600">
                            {company.document} - {company.city}/{company.state}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCompany(company)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCompany(company.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma empresa cadastrada
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar empresa por nome ou CNPJ/CPF..."
                      value={companySearchTerm}
                      onChange={(e) => setCompanySearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleNewCompany}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleManageCompanies}
                    variant="outline"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Gerenciar
                  </Button>
                </div>
                
                {companySearchTerm && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map(company => (
                        <div
                          key={company.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleCompanySelect(company)}
                        >
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-gray-600">
                            {company.document} - {company.city}/{company.state}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-center">
                        Nenhuma empresa encontrada
                      </div>
                    )}
                  </div>
                )}

                {/* Formulário de Cadastro de Empresa - Sem atualizar página */}
                {showCompanyForm && (
                  <div className="space-y-4 border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-blue-800">
                        {editingCompany ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelCompany}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newCompanyName">Razão Social *</Label>
                        <Input
                          id="newCompanyName"
                          value={companyFormData.name}
                          onChange={(e) => handleCompanyInputChange('name', e.target.value)}
                          placeholder="Digite a razão social"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newCompanyDocument">CNPJ/CPF *</Label>
                        <Input
                          id="newCompanyDocument"
                          value={companyFormData.document}
                          onChange={(e) => handleCompanyInputChange('document', e.target.value)}
                          placeholder="00.000.000/0000-00"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newCompanyCity">Cidade *</Label>
                        <Input
                          id="newCompanyCity"
                          value={companyFormData.city}
                          onChange={(e) => handleCompanyInputChange('city', e.target.value)}
                          placeholder="Digite a cidade"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="newCompanyState">UF *</Label>
                        <Select value={companyFormData.state} onValueChange={(value) => handleCompanyInputChange('state', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AC">AC</SelectItem>
                            <SelectItem value="AL">AL</SelectItem>
                            <SelectItem value="AP">AP</SelectItem>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="BA">BA</SelectItem>
                            <SelectItem value="CE">CE</SelectItem>
                            <SelectItem value="DF">DF</SelectItem>
                            <SelectItem value="ES">ES</SelectItem>
                            <SelectItem value="GO">GO</SelectItem>
                            <SelectItem value="MA">MA</SelectItem>
                            <SelectItem value="MT">MT</SelectItem>
                            <SelectItem value="MS">MS</SelectItem>
                            <SelectItem value="MG">MG</SelectItem>
                            <SelectItem value="PA">PA</SelectItem>
                            <SelectItem value="PB">PB</SelectItem>
                            <SelectItem value="PR">PR</SelectItem>
                            <SelectItem value="PE">PE</SelectItem>
                            <SelectItem value="PI">PI</SelectItem>
                            <SelectItem value="RJ">RJ</SelectItem>
                            <SelectItem value="RN">RN</SelectItem>
                            <SelectItem value="RS">RS</SelectItem>
                            <SelectItem value="RO">RO</SelectItem>
                            <SelectItem value="RR">RR</SelectItem>
                            <SelectItem value="SC">SC</SelectItem>
                            <SelectItem value="SP">SP</SelectItem>
                            <SelectItem value="SE">SE</SelectItem>
                            <SelectItem value="TO">TO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleSaveCompany}
                        disabled={isSavingCompany}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSavingCompany ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {editingCompany ? 'Atualizar Empresa' : 'Salvar Empresa'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados do Contrato - Layout responsivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Informações do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractNumber">Número do Contrato *</Label>
                <Input
                  id="contractNumber"
                  value={formData.contractNumber}
                  onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                  placeholder="Ex: 001/2024"
                  required
                />
              </div>
              <div>
                <Label htmlFor="modality">Modalidade *</Label>
                <Select value={formData.modality} onValueChange={(value) => handleInputChange('modality', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dispensa">Dispensa</SelectItem>
                    <SelectItem value="pregao-eletronico">Pregão Eletrônico</SelectItem>
                    <SelectItem value="concorrencia-publica">Concorrência Pública</SelectItem>
                    <SelectItem value="chamada-publica">Chamada Pública</SelectItem>
                    <SelectItem value="registro-preco">Registro de Preço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.modality === 'registro-preco' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isCarona"
                  checked={formData.isCarona}
                  onCheckedChange={(checked) => handleInputChange('isCarona', checked as boolean ? 'true' : 'false')}
                />
                <Label htmlFor="isCarona">É Carona de Ata?</Label>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="managingUnit">Unidade Gestora *</Label>
                <Select value={formData.managingUnit} onValueChange={(value) => handleInputChange('managingUnit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a Unidade Gestora" />
                  </SelectTrigger>
                  <SelectContent>
                    {managingUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="program">Programa (Opcional)</Label>
                <Select value={formData.program} onValueChange={(value) => handleInputChange('program', value)} disabled={!selectedUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Programa" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePrograms.length > 0 ? (
                      availablePrograms.map(program => (
                        <SelectItem key={program.id} value={program.name}>{program.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="placeholder-program" disabled>Nenhum programa disponível</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="object">Objeto do Contrato *</Label>
              <Textarea
                id="object"
                value={formData.object}
                onChange={(e) => handleInputChange('object', e.target.value)}
                placeholder="Descreva o objeto do contrato"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="value">Valor Original (R$) *</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data de Fim *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Salvar Contrato
          </Button>
        </div>
      </form>
    </div>
  );
}