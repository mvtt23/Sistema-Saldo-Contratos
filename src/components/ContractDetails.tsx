import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Contract, Additive, Invoice } from "@/types/contract";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { managingUnits } from "@/data/mockData";
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
}

const statusConfig = {
  active: { label: 'Ativo', color: 'bg-green-500', icon: CheckCircle },
  expired: { label: 'Vencido', color: 'bg-red-500', icon: XCircle },
  suspended: { label: 'Suspenso', color: 'bg-yellow-500', icon: AlertTriangle },
  completed: { label: 'Concluído', color: 'bg-blue-500', icon: Clock }
};

const paymentStatusConfig = {
  paid: { label: 'Pago', color: 'bg-green-500' },
  pending: { label: 'Pendente', color: 'bg-yellow-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' }
};

export function ContractDetails({ contract, onContractUpdate }: ContractDetailsProps) {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [isEditingAdditives, setIsEditingAdditives] = useState(false);
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
    newStartDate: '',
    newEndDate: ''
  });
  const [invoiceForm, setInvoiceForm] = useState({
    number: '',
    value: 0,
    date: ''
  });

  const status = statusConfig[currentContract.status];
  const StatusIcon = status.icon;
  const usagePercentage = (currentContract.usedValue / currentContract.currentValue) * 100;

  const handleAdditiveInputChange = (field: string, value: any) => {
    setAdditiveForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInvoiceInputChange = (field: string, value: any) => {
    setInvoiceForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAdditive = () => {
    // Validações para aditivo de prazo
    if (additiveForm.type === 'term' || additiveForm.type === 'both') {
      const newStartDate = new Date(additiveForm.newStartDate);
      const newEndDate = new Date(additiveForm.newEndDate);
      const contractStartDate = currentContract.startDate;
      
      if (newStartDate < contractStartDate) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: "A nova data de início não pode ser anterior ao início da vigência do contrato.",
        });
        setTimeout(() => {
          toast({ variant: "destructive", title: "", description: "" });
        }, 3000);
        return;
      }
      
      if (newEndDate <= newStartDate) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: "A nova data de fim deve ser posterior à data de início.",
        });
        setTimeout(() => {
          toast({ variant: "destructive", title: "", description: "" });
        }, 3000);
        return;
      }
    }

    if (editingAdditive) {
      // Editar aditivo existente
      const updatedAdditives = currentContract.additives.map(additive =>
        additive.id === editingAdditive.id
          ? {
              ...additive,
              type: additiveForm.type,
              valueChange: additiveForm.valueChange,
              termChange: additiveForm.type === 'term' || additiveForm.type === 'both' 
                ? Math.ceil((new Date(additiveForm.newEndDate).getTime() - new Date(additiveForm.newStartDate).getTime()) / (1000 * 60 * 60 * 24))
                : 0,
              description: `Aditivo ${additiveForm.type === 'value' ? 'de valor' : additiveForm.type === 'term' ? 'de prazo' : 'de valor e prazo'}`,
              justification: `Alteração ${additiveForm.type === 'value' ? 'de valor' : additiveForm.type === 'term' ? 'de prazo' : 'de valor e prazo'} conforme necessidade`
            }
          : additive
      );
      
      const valueDifference = additiveForm.valueChange - editingAdditive.valueChange;
      
      const updatedContract = {
        ...currentContract,
        additives: updatedAdditives,
        currentValue: currentContract.currentValue + valueDifference,
        remainingBalance: currentContract.remainingBalance + valueDifference,
        endDate: additiveForm.type === 'term' || additiveForm.type === 'both' 
          ? new Date(additiveForm.newEndDate)
          : currentContract.endDate
      };
      
      setCurrentContract(updatedContract);
      onContractUpdate(updatedContract);
    } else {
      // Criar novo aditivo
      const newAdditive: Additive = {
        id: Date.now().toString(),
        contractId: currentContract.id,
        type: additiveForm.type,
        description: `Aditivo ${additiveForm.type === 'value' ? 'de valor' : additiveForm.type === 'term' ? 'de prazo' : 'de valor e prazo'}`,
        valueChange: additiveForm.valueChange,
        termChange: additiveForm.type === 'term' || additiveForm.type === 'both' 
          ? Math.ceil((new Date(additiveForm.newEndDate).getTime() - new Date(additiveForm.newStartDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        date: new Date(),
        justification: `Alteração ${additiveForm.type === 'value' ? 'de valor' : additiveForm.type === 'term' ? 'de prazo' : 'de valor e prazo'} conforme necessidade`
      };

      const updatedContract = {
        ...currentContract,
        additives: [...currentContract.additives, newAdditive],
        currentValue: currentContract.currentValue + additiveForm.valueChange,
        remainingBalance: currentContract.remainingBalance + additiveForm.valueChange,
        endDate: additiveForm.type === 'term' || additiveForm.type === 'both' 
          ? new Date(additiveForm.newEndDate)
          : currentContract.endDate
      };

      setCurrentContract(updatedContract);
      onContractUpdate(updatedContract);
    }
    
    setIsAddingAdditive(false);
    setEditingAdditive(null);
    setAdditiveForm({
      type: 'value',
      valueChange: 0,
      newStartDate: '',
      newEndDate: ''
    });
  };

  const handleSaveInvoice = () => {
    // Validação de data da nota fiscal
    const invoiceDate = new Date(invoiceForm.date);
    const contractStartDate = currentContract.startDate;
    const contractEndDate = currentContract.endDate;
    
    if (invoiceDate < contractStartDate || invoiceDate > contractEndDate) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "A data da nota fiscal deve estar dentro do período de vigência do contrato.",
      });
      setTimeout(() => {
        toast({ variant: "destructive", title: "", description: "" });
      }, 3000);
      return;
    }
    
    if (editingInvoice) {
      // Editar nota fiscal existente
      const oldInvoice = currentContract.invoices.find(inv => inv.id === editingInvoice.id);
      const oldValue = oldInvoice ? oldInvoice.value : 0;
      
      const updatedInvoices = currentContract.invoices.map(invoice =>
        invoice.id === editingInvoice.id
          ? {
              ...invoice,
              number: invoiceForm.number,
              value: invoiceForm.value,
              date: new Date(invoiceForm.date)
            }
          : invoice
      );

      const valueDifference = invoiceForm.value - oldValue;
      
      const updatedContract = {
        ...currentContract,
        invoices: updatedInvoices,
        usedValue: currentContract.usedValue + valueDifference,
        remainingBalance: currentContract.remainingBalance - valueDifference
      };

      setCurrentContract(updatedContract);
      onContractUpdate(updatedContract);
    } else {
      // Criar nova nota fiscal
      const newInvoice: Invoice = {
        id: Date.now().toString(),
        contractId: currentContract.id,
        number: invoiceForm.number,
        value: invoiceForm.value,
        date: new Date(invoiceForm.date)
      };

      const updatedContract = {
        ...currentContract,
        invoices: [...currentContract.invoices, newInvoice],
        usedValue: currentContract.usedValue + invoiceForm.value,
        remainingBalance: currentContract.remainingBalance - invoiceForm.value
      };

      setCurrentContract(updatedContract);
      onContractUpdate(updatedContract);
    }
    
    setIsAddingInvoice(false);
    setInvoiceForm({
      number: '',
      value: 0,
      date: ''
    });
    setEditingInvoice(null);
  };

  const handleEditAdditive = (additive: Additive) => {
    setEditingAdditive(additive);
    setAdditiveForm({
      type: additive.type,
      valueChange: additive.valueChange,
      newStartDate: currentContract.startDate.toISOString().split('T')[0],
      newEndDate: currentContract.endDate.toISOString().split('T')[0]
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

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
      const invoiceToDelete = currentContract.invoices.find(inv => inv.id === invoiceId);
      if (invoiceToDelete) {
        const updatedInvoices = currentContract.invoices.filter(invoice => invoice.id !== invoiceId);
        
        const updatedContract = {
          ...currentContract,
          invoices: updatedInvoices,
          usedValue: currentContract.usedValue - invoiceToDelete.value,
          remainingBalance: currentContract.remainingBalance + invoiceToDelete.value
        };

        setCurrentContract(updatedContract);
        onContractUpdate(updatedContract);
      }
    }
  };

  const handleRescindContract = () => {
    if (confirm('Tem certeza que deseja rescindir este contrato? Esta ação não pode ser desfeita.')) {
      const updatedContract = {
        ...currentContract,
        status: 'suspended' as const
      };

      setCurrentContract(updatedContract);
      onContractUpdate(updatedContract);
    }
  };

  // Atualizar o contrato local quando o prop contract mudar
  useState(() => {
    setCurrentContract(contract);
  }, [contract]);

  // Encontrar o programa do contrato
  const contractUnit = managingUnits.find(unit => unit.name === currentContract.managingUnit);
  const contractProgram = contractUnit?.programs.find(program => 
    currentContract.object.toLowerCase().includes(program.name.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Contrato {currentContract.number}
              </CardTitle>
              <p className="text-gray-600 mb-4">{currentContract.object}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={`${status.color} text-white`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {status.label}
              </Badge>
              {currentContract.status === 'active' && (
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center text-gray-600">
              <User className="w-5 h-5 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Contratada</p>
                <p className="font-medium">{currentContract.contractor}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-600">
              <Building2 className="w-5 h-5 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Unidade Gestora</p>
                <p className="font-medium">{currentContract.managingUnit}</p>
                {contractProgram && (
                  <p className="text-xs text-blue-600 mt-1">{contractProgram.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Vigência</p>
                <p className="font-medium">
                  {formatDate(currentContract.startDate)} - {formatDate(currentContract.endDate)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Valores e Execução */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Valor Original</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(currentContract.originalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Valor Atual</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(currentContract.currentValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Valor Utilizado</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(currentContract.usedValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className={`w-8 h-8 mr-3 ${currentContract.remainingBalance <= 0 ? 'text-red-500' : 'text-green-500'}`} />
              <div>
                <p className="text-sm text-gray-500">Saldo Restante</p>
                <p className={`text-xl font-bold ${currentContract.remainingBalance <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(currentContract.remainingBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Execução */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Execução do Contrato</h3>
              <span className="text-2xl font-bold text-gray-900">{usagePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-500 ${
                  usagePercentage >= 90 ? 'bg-red-500' : 
                  usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="additives" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="additives">Aditivos ({currentContract.additives.length})</TabsTrigger>
          <TabsTrigger value="invoices">Notas Fiscais ({currentContract.invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="additives" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestão de Aditivos</h3>
            {currentContract.status === 'active' && (canEdit || canCreate) && (
              <div className="space-x-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingAdditives(!isEditingAdditives)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditingAdditives ? 'Cancelar Edição' : 'Editar Aditivos'}
                  </Button>
                )}
                {canCreate && (
                  <Button
                    onClick={() => setIsAddingAdditive(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Aditivo
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Formulário de Novo Aditivo */}
          {isAddingAdditive && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingAdditive ? 'Editar Aditivo' : 'Novo Aditivo'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <Label htmlFor="valueChange">Acréscimo de Valor</Label>
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
                </div>

                {(additiveForm.type === 'term' || additiveForm.type === 'both') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddingAdditive(false);
                    setEditingAdditive(null);
                    setAdditiveForm({
                      type: 'value',
                      valueChange: 0,
                      newStartDate: '',
                      newEndDate: ''
                    });
                  }}>
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

          {/* Lista de Aditivos */}
          {currentContract.additives.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Nenhum aditivo registrado para este contrato.
              </CardContent>
            </Card>
          ) : (
            currentContract.additives.map((additive) => (
              <Card key={additive.id}>
                <CardContent className="p-6">
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onClick={() => setIsAddingInvoice(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Nota Fiscal
              </Button>
            )}
          </div>

          {/* Formulário de Nova Nota Fiscal */}
          {isAddingInvoice && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingInvoice ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Número da Nota Fiscal</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceForm.number}
                      onChange={(e) => handleInvoiceInputChange('number', e.target.value)}
                      placeholder="Ex: NF-001"
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceDate">Data da Nota</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceForm.date}
                      onChange={(e) => handleInvoiceInputChange('date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddingInvoice(false);
                    setEditingInvoice(null);
                    setInvoiceForm({ number: '', value: 0, date: '' });
                  }}>
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
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">Nota Fiscal {invoice.number}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
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