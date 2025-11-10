import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Contract, Additive, Invoice, ManagingUnit } from "@/types/contract";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, 
  Building2, 
  User, 
  DollarSign, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Plus,
  Save,
  X,
  Trash2
} from "lucide-react";

interface ContractDetailsProps {
  contract: Contract;
  onContractUpdate: (contract: Contract) => void;
  saveAdditive: (additive: Omit<Additive, 'id'>, contractId: string, isEditing: boolean) => Promise<Additive | null>;
  deleteAdditive: (additiveId: string) => Promise<boolean>;
  saveInvoice: (invoice: Omit<Invoice, 'id'>, contractId: string, isEditing: boolean) => Promise<Invoice | null>;
  deleteInvoice: (invoiceId: string) => Promise<boolean>;
}

const statusConfig = {
  active: { label: 'Ativo', color: 'bg-green-500', icon: CheckCircle },
  expired: { label: 'Vencido', color: 'bg-red-500', icon: XCircle },
  suspended: { label: 'Suspenso', color: 'bg-yellow-500', icon: AlertTriangle },
  completed: { label: 'Concluído', color: 'bg-blue-500', icon: Clock }
};

export function ContractDetails({ 
  contract, 
  onContractUpdate, 
  saveAdditive, 
  deleteAdditive, 
  saveInvoice, 
  deleteInvoice 
}: ContractDetailsProps) {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [isAddingAdditive, setIsAddingAdditive] = useState(false);
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingAdditive, setEditingAdditive] = useState<Additive | null>(null);
  const [currentContract, setCurrentContract] = useState<Contract>(contract);

  const canEdit = hasPermission('contracts', 'edit');
  const canCreate = hasPermission('contracts', 'create');
  const canDelete = hasPermission('contracts', 'delete');
  
  const [additiveForm, setAdditiveForm] = useState({
    type: 'value' as 'value' | 'term' | 'both',
    valueChange: 0,
    termChange: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    justification: '',
    // Campos auxiliares para edição de prazo
    newStartDate: contract.startDate.toISOString().split('T')[0],
    newEndDate: contract.endDate.toISOString().split('T')[0]
  });
  
  const [invoiceForm, setInvoiceForm] = useState({
    number: '',
    value: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Atualizar o contrato local quando o prop contract mudar (após refetch)
  useEffect(() => {
    setCurrentContract(contract);
  }, [contract]);

  const status = statusConfig[currentContract.status];
  const StatusIcon = status.icon;
  const usagePercentage = (currentContract.usedValue / currentContract.currentValue) * 100;

  const handleAdditiveInputChange = (field: string, value: any) => {
    setAdditiveForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInvoiceInputChange = (field: string, value: any) => {
    setInvoiceForm(prev => ({ ...prev, [field]: value }));
  };

  const resetAdditiveForm = () => {
    setAdditiveForm({
      type: 'value',
      valueChange: 0,
      termChange: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      justification: '',
      newStartDate: currentContract.startDate.toISOString().split('T')[0],
      newEndDate: currentContract.endDate.toISOString().split('T')[0]
    });
    setEditingAdditive(null);
    setIsAddingAdditive(false);
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({
      number: '',
      value: 0,
      date: new Date().toISOString().split('T')[0]
    });
    setEditingInvoice(null);
    setIsAddingInvoice(false);
  };

  const handleSaveAdditive = async () => {
    const isEditing = !!editingAdditive;
    const { type, valueChange, newStartDate, newEndDate, date, description, justification } = additiveForm;

    // 1. Validação de Prazo
    let termChange = 0;
    let newContractEndDate = currentContract.endDate;
    
    if (type === 'term' || type === 'both') {
      const start = new Date(newStartDate);
      const end = new Date(newEndDate);
      
      if (end <= start) {
        toast({ variant: "destructive", title: "Erro de Prazo", description: "A nova data de fim deve ser posterior à data de início." });
        return;
      }
      
      // Calcula a diferença em dias entre a nova data de fim e a data de fim atual do contrato
      const diffTime = end.getTime() - currentContract.endDate.getTime();
      termChange = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      newContractEndDate = end;
    }

    // 2. Preparar dados do Aditivo
    const additiveToSave: Omit<Additive, 'id'> = {
      id: isEditing ? editingAdditive!.id : undefined,
      contractId: currentContract.id,
      type,
      description: description || `Aditivo ${type}`,
      valueChange: valueChange || 0,
      termChange: termChange,
      date: new Date(date),
      justification: justification || 'Alteração conforme necessidade',
    };

    // 3. Salvar Aditivo no Supabase
    const savedAdditive = await saveAdditive(additiveToSave, currentContract.id, isEditing);

    if (savedAdditive) {
      // 4. Recalcular valores do Contrato
      let updatedCurrentValue = currentContract.currentValue;
      let updatedRemainingBalance = currentContract.remainingBalance;
      let updatedAdditives = [...currentContract.additives];

      if (isEditing) {
        const oldAdditive = currentContract.additives.find(a => a.id === savedAdditive.id);
        const oldValueChange = oldAdditive?.valueChange || 0;
        
        // Reverte o valor antigo e aplica o novo
        updatedCurrentValue = updatedCurrentValue - oldValueChange + savedAdditive.valueChange;
        updatedRemainingBalance = updatedRemainingBalance - oldValueChange + savedAdditive.valueChange;
        
        updatedAdditives = updatedAdditives.map(a => a.id === savedAdditive.id ? savedAdditive : a);
      } else {
        updatedCurrentValue += savedAdditive.valueChange;
        updatedRemainingBalance += savedAdditive.valueChange;
        updatedAdditives.push(savedAdditive);
      }

      // 5. Atualizar Contrato Pai
      const updatedContract: Contract = {
        ...currentContract,
        currentValue: updatedCurrentValue,
        remainingBalance: updatedRemainingBalance,
        endDate: newContractEndDate,
        additives: updatedAdditives,
      };

      onContractUpdate(updatedContract); // Chama o update no Supabase via App.tsx
      resetAdditiveForm();
      toast({ title: "Sucesso", description: `Aditivo ${isEditing ? 'atualizado' : 'salvo'} com sucesso.`, variant: "success" });
    }
  };

  const handleSaveInvoice = async () => {
    const isEditing = !!editingInvoice;
    const { number, value, date } = invoiceForm;

    // 1. Validação de Data
    const invoiceDate = new Date(date);
    if (invoiceDate < currentContract.startDate || invoiceDate > currentContract.endDate) {
      toast({ variant: "destructive", title: "Erro de validação", description: "A data da nota fiscal deve estar dentro do período de vigência do contrato." });
      return;
    }
    
    // 2. Preparar dados da Nota Fiscal
    const invoiceToSave: Omit<Invoice, 'id'> = {
      id: isEditing ? editingInvoice!.id : undefined,
      contractId: currentContract.id,
      number,
      value: value || 0,
      date: invoiceDate,
    };

    // 3. Salvar Nota Fiscal no Supabase
    const savedInvoice = await saveInvoice(invoiceToSave, currentContract.id, isEditing);

    if (savedInvoice) {
      // 4. Recalcular valores do Contrato
      let updatedUsedValue = currentContract.usedValue;
      let updatedRemainingBalance = currentContract.remainingBalance;
      let updatedInvoices = [...currentContract.invoices];

      if (isEditing) {
        const oldInvoice = currentContract.invoices.find(inv => inv.id === savedInvoice.id);
        const oldValue = oldInvoice?.value || 0;
        
        // Reverte o valor antigo e aplica o novo
        updatedUsedValue = updatedUsedValue - oldValue + savedInvoice.value;
        updatedRemainingBalance = updatedRemainingBalance + oldValue - savedInvoice.value;
        
        updatedInvoices = updatedInvoices.map(inv => inv.id === savedInvoice.id ? savedInvoice : inv);
      } else {
        updatedUsedValue += savedInvoice.value;
        updatedRemainingBalance -= savedInvoice.value;
        updatedInvoices.push(savedInvoice);
      }

      // 5. Atualizar Contrato Pai
      const updatedContract: Contract = {
        ...currentContract,
        usedValue: updatedUsedValue,
        remainingBalance: updatedRemainingBalance,
        invoices: updatedInvoices,
      };

      onContractUpdate(updatedContract); // Chama o update no Supabase via App.tsx
      resetInvoiceForm();
      toast({ title: "Sucesso", description: `Nota Fiscal ${isEditing ? 'atualizada' : 'salva'} com sucesso.`, variant: "success" });
    }
  };

  const handleEditAdditive = (additive: Additive) => {
    setEditingAdditive(additive);
    setAdditiveForm({
      type: additive.type,
      valueChange: additive.valueChange,
      termChange: additive.termChange,
      date: additive.date.toISOString().split('T')[0],
      description: additive.description || '',
      justification: additive.justification || '',
      newStartDate: currentContract.startDate.toISOString().split('T')[0], // Mantém a data atual do contrato
      newEndDate: currentContract.endDate.toISOString().split('T')[0] // Mantém a data atual do contrato
    });
    setIsAddingAdditive(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      number: invoice.number,
      value: invoice.value,
      date: invoice.date.toISOString().split('T')[0]
    });
    setIsAddingInvoice(true);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
      const invoiceToDelete = currentContract.invoices.find(inv => inv.id === invoiceId);
      if (!invoiceToDelete) return;

      const success = await deleteInvoice(invoiceId);
      
      if (success) {
        // Recalcular valores do Contrato
        const updatedInvoices = currentContract.invoices.filter(invoice => invoice.id !== invoiceId);
        
        const updatedContract: Contract = {
          ...currentContract,
          invoices: updatedInvoices,
          usedValue: currentContract.usedValue - invoiceToDelete.value,
          remainingBalance: currentContract.remainingBalance + invoiceToDelete.value
        };

        onContractUpdate(updatedContract); // Chama o update no Supabase via App.tsx
        toast({ title: "Sucesso", description: "Nota fiscal excluída com sucesso.", variant: "success" });
      }
    }
  };

  const handleRescindContract = () => {
    if (confirm('Tem certeza que deseja rescindir este contrato? Esta ação não pode ser desfeita.')) {
      const updatedContract = {
        ...currentContract,
        status: 'suspended' as const
      };

      onContractUpdate(updatedContract);
      toast({ title: "Contrato Rescindido", description: "O status do contrato foi alterado para Suspenso.", variant: "warning" });
    }
  };

  // Encontrar o programa do contrato (Ainda depende de uma busca, mas vamos simplificar por enquanto)
  // NOTE: Em um sistema real, o App.tsx passaria a lista de ManagingUnits para ContractDetails
  // para que ele pudesse fazer essa busca. Como não temos a lista aqui, vamos ignorar a busca do programa.
  const contractUnit = null; // Não temos managingUnits aqui
  const contractProgram = null;

  return (
    <div className="space-y-6">
      {/* Header - Layout responsivo */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Contrato {currentContract.number}
                </CardTitle>
                <p className="text-gray-600 mb-4">{currentContract.object}</p>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <Badge className={`${status.color} text-white`}>
                  <StatusIcon className="w-4 h-4 mr-1" />
                  {status.label}
                </Badge>
                {currentContract.status === 'active' && canEdit && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRescindContract}
                    className="text-red-600 hover:text-red-700 border-red-300"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Rescindir
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center text-gray-600">
                <User className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Contratada</p>
                  <p className="font-medium">{currentContract.contractor}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <Building2 className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Unidade Gestora</p>
                  <p className="font-medium">{currentContract.managingUnit}</p>
                  {contractProgram && (
                    <p className="text-xs text-blue-600 mt-1">{contractProgram.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Vigência</p>
                  <p className="font-medium">
                    {formatDate(currentContract.startDate)} - {formatDate(currentContract.endDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Valores e Execução - Layout responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="w-6 h-6 text-blue-500 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Valor Original</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(currentContract.originalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 text-green-500 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Valor Atual</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(currentContract.currentValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-orange-500 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Valor Utilizado</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(currentContract.usedValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className={`w-6 h-6 mr-3 ${currentContract.remainingBalance <= 0 ? 'text-red-500' : 'text-green-500'}`} />
              <div>
                <p className="text-xs text-gray-500">Saldo Restante</p>
                <p className={`text-lg font-bold ${currentContract.remainingBalance <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(currentContract.remainingBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Execução - Layout responsivo */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Execução do Contrato</h3>
              <span className="text-xl font-bold text-gray-900">{usagePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  usagePercentage >= 90 ? 'bg-red-500' : 
                  usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs com detalhes - Layout responsivo */}
      <Tabs defaultValue="additives" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="additives">Aditivos ({currentContract.additives.length})</TabsTrigger>
          <TabsTrigger value="invoices">Notas Fiscais ({currentContract.invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="additives" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestão de Aditivos</h3>
            {currentContract.status === 'active' && canCreate && (
              <Button
                onClick={() => {
                  resetAdditiveForm();
                  setIsAddingAdditive(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Aditivo
              </Button>
            )}
          </div>

          {/* Formulário de Novo Aditivo - Layout responsivo */}
          {isAddingAdditive && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingAdditive ? 'Editar Aditivo' : 'Novo Aditivo'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Tipo de Aditivo</Label>
                    <div className="space-y-2 mt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="additiveType"
                          value="value"
                          checked={additiveForm.type === 'value'}
                          onChange={(e) => handleAdditiveInputChange('type', e.target.value)}
                          className="mr-2"
                        />
                        Aditivo de Valor
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="additiveType"
                          value="term"
                          checked={additiveForm.type === 'term'}
                          onChange={(e) => handleAdditiveInputChange('type', e.target.value)}
                          className="mr-2"
                        />
                        Aditivo de Prazo
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="additiveType"
                          value="both"
                          checked={additiveForm.type === 'both'}
                          onChange={(e) => handleAdditiveInputChange('type', e.target.value)}
                          className="mr-2"
                        />
                        Valor e Prazo
                      </label>
                    </div>
                  </div>

                  <div>
                    {(additiveForm.type === 'value' || additiveForm.type === 'both') && (
                      <div>
                        <Label htmlFor="valueChange">Acréscimo de Valor (R$)</Label>
                        <Input
                          id="valueChange"
                          type="number"
                          step="0.01"
                          value={additiveForm.valueChange}
                          onChange={(e) => handleAdditiveInputChange('valueChange', parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="date">Data do Aditivo</Label>
                    <Input
                      id="date"
                      type="date"
                      value={additiveForm.date}
                      onChange={(e) => handleAdditiveInputChange('date', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={additiveForm.description}
                    onChange={(e) => handleAdditiveInputChange('description', e.target.value)}
                    placeholder="Breve descrição do aditivo"
                  />
                </div>

                {(additiveForm.type === 'term' || additiveForm.type === 'both') && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="newStartDate">Nova Data de Início da Vigência</Label>
                      <Input
                        id="newStartDate"
                        type="date"
                        value={additiveForm.newStartDate}
                        onChange={(e) => handleAdditiveInputChange('newStartDate', e.target.value)}
                        min={currentContract.startDate.toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newEndDate">Nova Data de Fim da Vigência</Label>
                      <Input
                        id="newEndDate"
                        type="date"
                        value={additiveForm.newEndDate}
                        onChange={(e) => handleAdditiveInputChange('newEndDate', e.target.value)}
                        min={additiveForm.newStartDate || currentContract.startDate.toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button variant="outline" onClick={resetAdditiveForm}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveAdditive} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    {editingAdditive ? 'Atualizar Aditivo' : 'Salvar Aditivo'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Aditivos - Layout responsivo */}
          {currentContract.additives.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Nenhum aditivo registrado para este contrato.
              </CardContent>
            </Card>
          ) : (
            currentContract.additives.map((additive) => (
              <Card key={additive.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Aditivo {additive.type === 'value' ? 'de Valor' : additive.type === 'term' ? 'de Prazo' : 'de Valor e Prazo'}
                      </h4>
                      <p className="text-sm text-gray-500">Data: {formatDate(additive.date)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {additive.type === 'value' ? 'Valor' : additive.type === 'term' ? 'Prazo' : 'Valor e Prazo'}
                      </Badge>
                      {currentContract.status === 'active' && canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAdditive(additive)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {additive.valueChange !== 0 && (
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm">
                          Alteração de valor: <strong>{formatCurrency(additive.valueChange)}</strong>
                        </span>
                      </div>
                    )}
                    {additive.termChange !== 0 && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-sm">
                          Alteração de prazo: <strong>{additive.termChange} dias</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestão de Notas Fiscais</h3>
            {currentContract.status === 'active' && canCreate && (
              <Button
                onClick={() => {
                  resetInvoiceForm();
                  setIsAddingInvoice(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Nota Fiscal
              </Button>
            )}
          </div>

          {/* Formulário de Nova Nota Fiscal - Layout responsivo */}
          {isAddingInvoice && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingInvoice ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Número da Nota Fiscal</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceForm.number}
                      onChange={(e) => handleInvoiceInputChange('number', e.target.value)}
                      placeholder="Ex: NF-001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceValue">Valor da Nota</Label>
                    <Input
                      id="invoiceValue"
                      type="number"
                      step="0.01"
                      value={invoiceForm.value}
                      onChange={(e) => handleInvoiceInputChange('value', parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceDate">Data da Nota</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceForm.date}
                      onChange={(e) => handleInvoiceInputChange('date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button variant="outline" onClick={resetInvoiceForm}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveInvoice} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    {editingInvoice ? 'Atualizar' : 'Salvar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentContract.invoices.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Nenhuma nota fiscal registrada para este contrato.
              </CardContent>
            </Card>
          ) : (
            currentContract.invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">Nota Fiscal {invoice.number}</h4>
                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Valor:</span>
                          <span className="font-medium ml-2">{formatCurrency(invoice.value)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Data:</span>
                          <span className="font-medium ml-2">{formatDate(invoice.date)}</span>
                        </div>
                      </div>
                    </div>
                    {currentContract.status === 'active' && (canEdit || canDelete) && (
                      <div className="flex space-x-2 ml-4">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditInvoice(invoice)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}