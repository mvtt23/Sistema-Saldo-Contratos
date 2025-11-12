import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ManagingUnit } from "@/types/contract";
import { Building2, Save, Upload } from "lucide-react";
import { UserManagement } from "./UserManagement";

interface SettingsProps {
  managingUnits: ManagingUnit[];
}

export function Settings({ managingUnits }: SettingsProps) {
  const [municipalityName, setMunicipalityName] = useState('Prefeitura Municipal de São Paulo');
  const [slogan, setSlogan] = useState('Cidade que não para');
  const [address, setAddress] = useState('Viaduto do Chá, 15 - Centro - São Paulo/SP - CEP: 01002-020');
  const [logoUrl, setLogoUrl] = useState('');

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
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Configurações</h2>
        <p className="text-gray-600">Configure o sistema e gerencie usuários</p>
      </div>

      {/* Configurações da Prefeitura - Layout responsivo */}
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

      {/* Gerenciamento de Usuários - Layout responsivo */}
      <UserManagement />
    </div>
  );
}