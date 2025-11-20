import { useAuth } from "@/contexts/AuthContext";
import { useMunicipios, Municipio } from "@/hooks/useMunicipios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MunicipalitySelector() {
  const { user, selectedPrefeituraId, setPrefeituraSelecionada } = useAuth();
  const { municipios, loading } = useMunicipios();

  if (!user || !user.is_admin) {
    return null; // Só renderiza para Super Admins
  }

  

  return (
    <Card className="mb-6 border-blue-300 bg-blue-50 shadow-md">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-shrink-0">
          <Building2 className="w-6 h-6 text-blue-700" />
          <p className="font-semibold text-blue-800">
            Prefeitura Ativa (Admin)
          </p>
        </div>
        
        <div className="w-full sm:w-64">
          {loading ? (
            <div className="flex items-center text-sm text-gray-600">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Carregando prefeituras...
            </div>
          ) : (
            <Select 
              value={selectedPrefeituraId || ''} 
              onValueChange={setPrefeituraSelecionada}
              disabled={loading}
            >
              <SelectTrigger className="bg-white border-blue-400 text-blue-900 font-medium">
                <SelectValue placeholder="Selecione a Prefeitura" />
              </SelectTrigger>
              <SelectContent>
                {municipios.map((municipio: Municipio) => (
                  <SelectItem key={municipio.id} value={municipio.id}>
                    {municipio.name} ({municipio.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}