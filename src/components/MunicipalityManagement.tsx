import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMunicipios, Municipio } from "@/hooks/useMunicipios";
import { useMunicipalityManagement } from "@/hooks/useMunicipalityManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Plus, Edit, Trash2, X, Loader2, AlertTriangle } from "lucide-react";

export function MunicipalityManagement() {
  const { user } = useAuth();
  const { municipios, loading, fetchMunicipios } = useMunicipios();
  const { createMunicipality, updateMunicipality, deleteMunicipality } = useMunicipalityManagement(fetchMunicipios);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMunicipio, setEditingMunicipio] = useState<Municipio | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Redirecionar se não for Super Admin
  if (!user?.is_admin) {
    return (
      <Card className="border-red-500 bg-red-50">
        <CardContent className="p-6 flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <p className="text-red-800 font-medium">Acesso negado. Apenas Super Administradores podem gerenciar prefeituras.</p>
        </CardContent>
      </Card>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNew = () => {
    setEditingMunicipio(null);
    setFormData({ id: '', name: '', slug: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (municipio: Municipio) => {
    setEditingMunicipio(municipio);
    setFormData({ id: municipio.id, name: municipio.name, slug: municipio.slug || '' });
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingMunicipio(null);
    setFormData({ id: '', name: '', slug: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (!formData.id || !formData.name || !formData.slug) {
      alert("Preencha todos os campos obrigatórios.");
      setIsSaving(false);
      return;
    }

    let success = false;
    const dataToSave = { id: formData.id, name: formData.name, slug: formData.slug };

    if (editingMunicipio) {
      success = await updateMunicipality(editingMunicipio.id, dataToSave);
    } else {
      success = await createMunicipality(dataToSave);
    }

    if (success) {
      handleCancel();
    }
    setIsSaving(false);
  };

  const handleDelete = async (municipio: Municipio) => {
    await deleteMunicipality(municipio.id, municipio.name);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Prefeituras</h2>
          <p className="text-gray-600">Crie, edite e exclua as prefeituras que o sistema irá gerenciar.</p>
        </div>
        <Button 
          onClick={handleNew}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Prefeitura
        </Button>
      </div>

      {/* Formulário de Criação/Edição */}
      {isFormOpen && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-lg md:text-xl">
              <Building2 className="w-5 h-5 mr-2 text-blue-600" />
              {editingMunicipio ? 'Editar Prefeitura' : 'Nova Prefeitura'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="id">ID da Prefeitura *</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    placeholder="Ex: santa-quiteria"
                    required
                    disabled={!!editingMunicipio} // Não pode mudar o ID ao editar
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Identificador único (ex: sigla ou nome curto).
                  </p>
                </div>
                <div>
                  <Label htmlFor="slug">Slug (Identificador Único) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="Ex: sq-contratos"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Usado internamente para URLs e referências.
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="name">Nome Oficial *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Prefeitura Municipal de Santa Quitéria"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Edit className="w-4 h-4 mr-2" />
                  )}
                  {editingMunicipio ? 'Atualizar' : 'Criar'} Prefeitura
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Prefeituras */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Prefeituras ({municipios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-blue-600" />
              <p className="mt-2 text-gray-600">Carregando lista...</p>
            </div>
          ) : municipios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhuma prefeitura cadastrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {municipios.map(municipio => (
                <div key={municipio.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{municipio.name}</p>
                    <p className="text-sm text-gray-600">ID: {municipio.id} | Slug: {municipio.slug}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(municipio)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(municipio)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}