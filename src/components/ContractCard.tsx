import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Contract } from "@/types/contract";
import { formatCurrency, formatDate, calculateDaysRemaining } from "@/lib/utils";
import { Calendar, Building2, User, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

const modalityLabels = {
  'dispensa': 'Dispensa',
  'pregao-eletronico': 'Pregão Eletrônico',
  'concorrencia-publica': 'Concorrência Pública',
  'chamada-publica': 'Chamada Pública',
  'registro-preco': 'Registro de Preço'
};

interface ContractCardProps {
  contract: Contract;
  onClick: (contract: Contract) => void;
}

const statusConfig = {
  active: { label: 'Ativo', color: 'bg-green-500', icon: CheckCircle },
  expired: { label: 'Vencido', color: 'bg-red-500', icon: XCircle },
  suspended: { label: 'Suspenso', color: 'bg-yellow-500', icon: AlertTriangle },
  completed: { label: 'Concluído', color: 'bg-blue-500', icon: Clock }
};

export function ContractCard({ contract, onClick }: ContractCardProps) {
  const daysRemaining = calculateDaysRemaining(contract.endDate);
  const usagePercentage = (contract.usedValue / contract.currentValue) * 100;
  const status = statusConfig[contract.status];
  const StatusIcon = status.icon;

  const getUrgencyColor = () => {
    if (contract.status === 'expired') return 'border-red-500';
    if (daysRemaining <= 30) return 'border-orange-500';
    if (usagePercentage >= 90) return 'border-yellow-500';
    return 'border-gray-200';
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${getUrgencyColor()} border-2`}
      onClick={() => onClick(contract)}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-3">
          {/* Número do contrato e status */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                Contrato {contract.number}
              </CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2">
                {contract.object}
              </p>
            </div>
            <Badge className={`${status.color} text-white ml-0 sm:ml-2 flex-shrink-0 mt-1 sm:mt-0`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          
          {/* Modalidade */}
          <div>
            <Badge variant="outline" className="text-xs">
              {modalityLabels[contract.modality]}
              {contract.modality === 'registro-preco' && contract.isCarona && ' (Carona)'}
            </Badge>
          </div>
        </div>
        
        {/* Informações principais */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{contract.contractor}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{contract.managingUnit}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">
              {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Valores */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Valor Atual</p>
            <p className="font-semibold text-gray-900 text-sm">
              {formatCurrency(contract.currentValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Saldo Restante</p>
            <p className={`font-semibold text-sm ${contract.remainingBalance <= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(contract.remainingBalance)}
            </p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Execução</span>
            <span>{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                usagePercentage >= 90 ? 'bg-red-500' : 
                usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Alertas */}
        {(daysRemaining <= 30 && contract.status === 'active') && (
          <div className="flex items-center text-orange-600 text-sm bg-orange-50 p-2 rounded">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">Vence em {daysRemaining} dias</span>
          </div>
        )}

        {contract.remainingBalance <= 0 && (
          <div className="flex items-center text-red-600 text-sm bg-red-50 p-2 rounded">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">Saldo esgotado</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}