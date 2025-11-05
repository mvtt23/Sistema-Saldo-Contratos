import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ManagingUnit } from "@/types/contract";
import { Settings as SettingsIcon, Upload, User, Building2, Save, Plus, Edit, Trash2 } from "lucide-react";
import { UserManagement } from "./UserManagement";

interface Fiscal {
  id: string;
  name: string;
  cpf: string;
  ordinance: string;
}

interface SettingsProps {
  managingUnits: ManagingUnit[];
}

export function Settings({ managingUnits }: SettingsProps) {
  const [municipalityName, setMunicipalityName] = useState('Prefeitura Municipal de São Paulo');
  const [slogan, setSlogan] = useState('Cidade que não para');
  const [address, setAddress] = useState('Viaduto do Chá, 15 - Centro - São Paulo/SP - CEP: 01002-020');
  const [logoUrl, setLogoUrl] = useState('');

  const [fiscals, setFiscals] = useState<Fiscal[]>([
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
    }
  ]);

  const [isAddingFiscal, setIsAddingFiscal] = useState(false);
  const [editingFiscal, setEditingFiscal] = useState<Fiscal | null>(null);
  const [fiscalForm, setFiscalForm] = useState({
    name: '',
    cpf: '',
    ordinance: ''
  });

  const handleFiscal
Continuando a atualização do componente Settings:

<dyad-write path="src/components/Settings.tsx" description="Finalizando atualização do componente Settings">
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ManagingUnit } from "@/types/contract";
import { Settings as SettingsIcon, Upload, User, Building2, Save, Plus, Edit, Trash2 } from "lucide-react";
import { UserManagement } from "./UserManagement";

interface Fiscal {
  id: string;
  name: string;
  cpf: string;
  ordinance: string;
}

interface SettingsProps {
  managingUnits: ManagingUnit[];
}

export function Settings({ managingUnits }: SettingsProps) {
  const [municipalityName, setMunicipalityName] = useState('Prefeitura Municipal de São Paulo');
  const [slogan, setSlogan] = useState('Cidade que não para');
  const [address, setAddress] = useState('Viaduto do Chá, 15 - Centro - São Paulo/SP - CEP: 01002-020');
  const [logoUrl, setLogoUrl] = useState('');

  const [fiscals, setFiscals] = useState<Fiscal[]>([
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
    }
  ]);

  const [isAddingFiscal, setIsAddingFiscal] = useState(false);
  const [editingFiscal, setEditingFiscal] = useState<Fiscal | null>(null);
  const [fiscalForm, setFiscalForm] = useState({
    name: '',
    cpf: '',
    ordinance: ''
  });

  const handleFiscalInputChange = (field: string, value: string) => {
    setFiscalForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveFiscal = () => {
    if (editingFiscal) {
      setFiscals(prev => prev.map(fiscal => 
        fiscal.id === editingFiscal.id 
          ? { ...fiscal, ...fiscalForm }
          : fiscal
      ));
    } else {
      const newFiscal: Fiscal = {
        id: Date.now().toString(),
        ...fiscalForm
      };
      setFiscals(prev => [...prev, newFiscal]);
    }

    setFiscalForm({ name: '', cpf: '', ordinance: '' });
    setIsAddingFiscal(false);
    setEditingFiscal(null);
  };

  const handleEditFiscal = (fiscal: Fiscal) => {
    setEditingFiscal(fiscal);
    setFiscalForm({
      name: fiscal.name,
      cpf: fiscal.cpf,
      ordinance: fiscal.ordinance
    });
    setIsAddingFiscal(true);
  };

  const handleDeleteFiscal = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fiscal?')) {
      setFiscals(prev => prev.filter(fiscal => fiscal.id !== id));
    }
  };

  const handleCancelFiscal = () => {
    setFiscalForm({ name: '', cpf: '', ordinance: '' });
    setIsAddingFiscal(false);
    setEditingFiscal(null);
  };

  const handleSaveSettings = () => {
    console.log('Configurações salvas:', {
      municipalityName,
      slogan,
      address,
      logoUrl
    });
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h2>
        <p className="text-gray-600">Configure o sistema e gerencie usuários</p>
      </div>

      {/* Configurações da Prefeitura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            Timbrado da Prefeitura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="municipalityName">Nome Oficial da Prefeitura</Label>
            <Input
              id="municipalityName"
              value={municipalityName}
              onChange={(e) => setMunicipalityName(e.target.value)}
              placeholder="Ex: Prefeitura Municipal de São Paulo"
            />
          </div>

          <div>
            <Label htmlFor="slogan">Slogan</Label>
            <Input
              id="slogan"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Ex: Cidade que não para"
            />
          </div>

          <div>
            <Label htmlFor="address">Endereço Completo</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Endereço completo da prefeitura"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="logo">Logo da Prefeitura</Label>
            <div className="flex items-center space-x-4">
              <Input
                id="logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="URL da imagem ou deixe vazio para upload"
              />
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recomendado: PNG ou JPG, máximo 200x100px
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciar Fiscais */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Fiscais de Contratos
            </CardTitle>
            <Button 
              onClick={() => setIsAddingFiscal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Fiscal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário de Fiscal */}
          {isAddingFiscal && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-4">
                {editingFiscal ? 'Editar Fiscal' : 'Novo Fiscal'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fiscalName">Nome Completo</Label>
                  <Input
                    id="fiscalName"
                    value={fiscalForm.name}
                    onChange={(e) => handleFiscalInputChange('name', e.target.value)}
                    placeholder="Nome completo do fiscal"
                  />
                </div>
                <div>
                  <Label htmlFor="fiscalCpf">CPF</Label>
                  <Input
                    id="fiscalCpf"
                    value={fiscalForm.cpf}
                    onChange={(e) => handleFiscalInputChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="fiscalOrdinance">Portaria</Label>
                <Input
                  id="fiscalOrdinance"
                  value={fiscalForm.ordinance}
                  onChange={(e) => handleFiscalInputChange('ordinance', e.target.value)}
                  placeholder="Ex: Portaria nº 001/2024"
                />
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={handleCancelFiscal}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveFiscal} className="bg-blue-600 hover:bg-blue-700">
                  {editingFiscal ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}

          {/* Lista de Fiscais */}
          <div className="space-y-3">
            {fiscals.map(fiscal => (
              <div key={fiscal.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nome</p>
                      <p className="font-medium">{fiscal.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">CPF</p>
                      <p className="font-medium">{fiscal.cpf}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Portaria</p>
                      <p className="font-medium">{fiscal.ordinance}</p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditFiscal(fiscal)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteFiscal(fiscal.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {fiscals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum fiscal cadastrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações sobre Permissões */}
      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Fiscais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Permissões dos Fiscais</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Consulta:</strong> Visualizar todos os contratos e detalhes</li>
              <li>• <strong>Relatórios:</strong> Gerar relatórios em PDF</li>
              <li>• <strong>Restrições:</strong> Não podem editar, criar ou excluir contratos</li>
              <li>• <strong>Acesso:</strong> Limitado à secretaria correspondente (quando aplicável)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciamento de Usuários */}
      <UserManagement />
    </div>
  );
}