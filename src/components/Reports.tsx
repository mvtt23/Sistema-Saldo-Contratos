import { useState } from "react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { managingUnits, contracts as mockContracts } from "@/data/mockData";
import { Contract } from "@/types/contract";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileBarChart, Download, Search, Calendar, Building2 } from "lucide-react";

interface ReportsProps {
  contracts?: Contract[];
  onContractSelect?: (contract: Contract) => void;
}

export function Reports({ contracts: contractsProp, onContractSelect }: ReportsProps) {
  const contracts = contractsProp || mockContracts;
  const [reportType, setReportType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedModality, setSelectedModality] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtrar contratos conforme o usuário digita
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContracts([]);
      return;
    }

    const filtered = contracts.filter(contract =>
      contract.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractor.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredContracts(filtered);
  }, [searchTerm, contracts]);

  const handleContractSelect = (contract: Contract) => {
    setSelectedContract(contract);
    setShowPdfPreview(true);
  };

  const generateIndividualPDF = (contract: Contract) => {
    const contractUnit = managingUnits.find(unit => unit.name === contract.managingUnit);
    const contractProgram = contractUnit?.programs.find(program => 
      contract.object.toLowerCase().includes(program.name.toLowerCase())
    );
    
    const usagePercentage = (contract.usedValue / contract.currentValue) * 100;
    
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Relatório Individual - Contrato ${contract.number}</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 0; 
      padding: 40px; 
      line-height: 1.6; 
      color: #333;
      background: #fff;
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #2563EB; 
      padding-bottom: 30px; 
      margin-bottom: 40px;
    }
    .header h1 { 
      color: #2563EB; 
      margin: 0; 
      font-size: 28px; 
      font-weight: bold;
    }
    .header h2 { 
      color: #666; 
      margin: 10px 0 0 0; 
      font-size: 18px; 
      font-weight: normal;
    }
    .contract-info { 
      background: #f8fafc; 
      padding: 25px; 
      border-radius: 8px; 
      margin-bottom: 30px;
      border-left: 4px solid #2563EB;
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
      margin-bottom: 20px;
    }
    .info-item { 
      margin-bottom: 15px;
    }
    .info-label { 
      font-weight: bold; 
      color: #374151; 
      display: block; 
      margin-bottom: 5px;
    }
    .info-value { 
      color: #1f2937; 
      font-size: 16px;
    }
    .progress-section { 
      margin: 30px 0;
    }
    .progress-bar { 
      width: 100%; 
      height: 25px; 
      background: #e5e7eb; 
      border-radius: 12px; 
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill { 
      height: 100%; 
      background: ${usagePercentage >= 90 ? '#dc2626' : usagePercentage >= 70 ? '#f59e0b' : '#16a34a'}; 
      transition: width 0.3s ease;
      border-radius: 12px;
    }
    .invoices-section { 
      margin-top: 40px;
    }
    .invoices-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 20px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .invoices-table th { 
      background: #2563EB; 
      color: white; 
      padding: 15px; 
      text-align: left; 
      font-weight: 600;
    }
    .invoices-table td { 
      padding: 12px 15px; 
      border-bottom: 1px solid #e5e7eb;
    }
    .invoices-table tr:last-child td { 
      border-bottom: none;
    }
    .invoices-table tr:nth-child(even) { 
      background: #f9fafb;
    }
    .summary { 
      background: #ecfdf5; 
      padding: 25px; 
      border-radius: 8px; 
      margin: 30px 0;
      border-left: 4px solid #16a34a;
    }
    .signature-section { 
      margin-top: 60px; 
      text-align: center;
    }
    .signature-line { 
      border-top: 2px solid #374151; 
      width: 300px; 
      margin: 40px auto 10px; 
    }
    .value { 
      font-weight: bold; 
      color: #059669;
    }
    .contract-number { 
      font-size: 24px; 
      font-weight: bold; 
      color: #2563EB; 
      margin-bottom: 10px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PREFEITURA MUNICIPAL</h1>
    <h2>Sistema de Contratos - Relatório Individual</h2>
  </div>
  
  <div class="contract-info">
    <div class="contract-number">CONTRATO ${contract.number}</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Secretaria:</span>
        <span class="info-value">${contract.managingUnit}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Programa:</span>
        <span class="info-value">${contractProgram?.name || 'Não especificado'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Vigência:</span>
        <span class="info-value">${formatDate(contract.startDate)} a ${formatDate(contract.endDate)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Status:</span>
        <span class="info-value">${contract.status === 'active' ? 'Ativo' : contract.status === 'completed' ? 'Concluído' : contract.status === 'expired' ? 'Vencido' : 'Suspenso'}</span>
      </div>
    </div>
    <div class="info-item">
      <span class="info-label">Objeto:</span>
      <span class="info-value">${contract.object}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Empresa:</span>
      <span class="info-value">${contract.contractor}</span>
    </div>
  </div>
  
  <div class="progress-section">
    <h3>Execução do Contrato</h3>
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <span>Progresso: <strong>${usagePercentage.toFixed(1)}%</strong></span>
      <span>Valor Utilizado: <strong class="value">${formatCurrency(contract.usedValue)}</strong></span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${Math.min(usagePercentage, 100)}%"></div>
    </div>
  </div>
  
  <div class="invoices-section">
    <h3>Histórico de Notas Fiscais</h3>
    ${contract.invoices.length > 0 ? `
    <table class="invoices-table">
      <thead>
        <tr>
          <th>Número da Nota</th>
          <th>Data</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody>
        ${contract.invoices.map(invoice => `
        <tr>
          <td>${invoice.number}</td>
          <td>${formatDate(invoice.date)}</td>
          <td class="value">${formatCurrency(invoice.value)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p style="color: #6b7280; font-style: italic;">Nenhuma nota fiscal registrada.</p>'}
  </div>
  
  <div class="summary">
    <h3 style="margin-top: 0; color: #059669;">Resumo Financeiro</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Valor Original:</span>
        <span class="info-value value">${formatCurrency(contract.originalValue)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Valor Atual:</span>
        <span class="info-value value">${formatCurrency(contract.currentValue)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Valor Utilizado:</span>
        <span class="info-value value">${formatCurrency(contract.usedValue)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Saldo Restante:</span>
        <span class="info-value value" style="color: ${contract.remainingBalance <= 0 ? '#dc2626' : '#059669'}">${formatCurrency(contract.remainingBalance)}</span>
      </div>
    </div>
  </div>
  
  <div class="signature-section">
    <div class="signature-line"></div>
    <p><strong>${contractUnit?.responsible || 'Responsável'}</strong></p>
    <p>${contract.managingUnit}</p>
    <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
      Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
    </p>
  </div>
</body>
</html>
    `;
    
    return pdfContent;
  };

  const handleDownloadPDF = () => {
    if (!selectedContract) return;
    
    // Generate PDF content
    const contractUnit = managingUnits.find(unit => unit.name === selectedContract.managingUnit);
    const contractProgram = contractUnit?.programs.find(program => 
      selectedContract.object.toLowerCase().includes(program.name.toLowerCase())
    );
    const usagePercentage = (selectedContract.usedValue / selectedContract.currentValue) * 100;
    
    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório - Contrato ${selectedContract.number}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body { 
      font-family: 'Arial', sans-serif; 
      margin: 0; 
      padding: 0; 
      line-height: 1.6; 
      color: #333;
      font-size: 12px;
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #2563EB; 
      padding-bottom: 20px; 
      margin-bottom: 30px;
    }
    .header h1 { 
      color: #2563EB; 
      margin: 0; 
      font-size: 24px; 
      font-weight: bold;
    }
    .header h2 { 
      color: #666; 
      margin: 10px 0 0 0; 
      font-size: 16px; 
      font-weight: normal;
    }
    .contract-info { 
      background: #f8fafc; 
      padding: 20px; 
      border-radius: 8px; 
      margin-bottom: 25px;
      border-left: 4px solid #2563EB;
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 15px; 
      margin-bottom: 15px;
    }
    .info-item { 
      margin-bottom: 10px;
    }
    .info-label { 
      font-weight: bold; 
      color: #374151; 
      display: block; 
      margin-bottom: 3px;
    }
    .info-value { 
      color: #1f2937; 
      font-size: 14px;
    }
    .progress-section { 
      margin: 25px 0;
    }
    .progress-bar { 
      width: 100%; 
      height: 20px; 
      background: #e5e7eb; 
      border-radius: 10px; 
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill { 
      height: 100%; 
      background: ${usagePercentage >= 90 ? '#dc2626' : usagePercentage >= 70 ? '#f59e0b' : '#16a34a'}; 
      border-radius: 10px;
      width: ${Math.min(usagePercentage, 100)}%;
    }
    .invoices-section { 
      margin-top: 30px;
    }
    .invoices-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 15px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .invoices-table th { 
      background: #2563EB; 
      color: white; 
      padding: 12px; 
      text-align: left; 
      font-weight: 600;
      font-size: 12px;
    }
    .invoices-table td { 
      padding: 10px 12px; 
      border-bottom: 1px solid #e5e7eb;
      font-size: 11px;
    }
    .invoices-table tr:last-child td { 
      border-bottom: none;
    }
    .invoices-table tr:nth-child(even) { 
      background: #f9fafb;
    }
    .summary { 
      background: #ecfdf5; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 25px 0;
      border-left: 4px solid #16a34a;
    }
    .signature-section { 
      margin-top: 50px; 
      text-align: center;
    }
    .signature-line { 
      border-top: 2px solid #374151; 
      width: 250px; 
      margin: 30px auto 10px; 
    }
    .value { 
      font-weight: bold; 
      color: #059669;
    }
    .contract-number { 
      font-size: 20px; 
      font-weight: bold; 
      color: #2563EB; 
      margin-bottom: 10px;
    }
    h3 {
      color: #374151;
      font-size: 16px;
      margin: 20px 0 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PREFEITURA MUNICIPAL</h1>
    <h2>Sistema de Contratos - Relatório Individual</h2>
  </div>
  
  <div class="contract-info">
    <div class="contract-number">CONTRATO ${selectedContract.number}</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Secretaria:</span>
        <span class="info-value">${selectedContract.managingUnit}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Programa:</span>
        <span class="info-value">${contractProgram?.name || 'Não especificado'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Vigência:</span>
        <span class="info-value">${formatDate(selectedContract.startDate)} a ${formatDate(selectedContract.endDate)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Status:</span>
        <span class="info-value">${selectedContract.status === 'active' ? 'Ativo' : selectedContract.status === 'completed' ? 'Concluído' : selectedContract.status === 'expired' ? 'Vencido' : 'Suspenso'}</span>
      </div>
    </div>
    <div class="info-item">
      <span class="info-label">Objeto:</span>
      <span class="info-value">${selectedContract.object}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Empresa:</span>
      <span class="info-value">${selectedContract.contractor}</span>
    </div>
  </div>
  
  <div class="progress-section">
    <h3>Execução do Contrato</h3>
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px;">
      <span>Progresso: <strong>${usagePercentage.toFixed(1)}%</strong></span>
      <span>Valor Utilizado: <strong class="value">${formatCurrency(selectedContract.usedValue)}</strong></span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
  </div>
  
  <div class="invoices-section">
    <h3>Histórico de Notas Fiscais</h3>
    ${selectedContract.invoices.length > 0 ? `
    <table class="invoices-table">
      <thead>
        <tr>
          <th>Número da Nota</th>
          <th>Data</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody>
        ${selectedContract.invoices.map(invoice => `
        <tr>
          <td>${invoice.number}</td>
          <td>${formatDate(invoice.date)}</td>
          <td class="value">${formatCurrency(invoice.value)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<p style="color: #6b7280; font-style: italic; font-size: 12px;">Nenhuma nota fiscal registrada.</p>'}
  </div>
  
  <div class="summary">
    <h3 style="margin-top: 0; color: #059669;">Resumo Financeiro</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Valor Original:</span>
        <span class="info-value value">${formatCurrency(selectedContract.originalValue)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Valor Atual:</span>
        <span class="info-value value">${formatCurrency(selectedContract.currentValue)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Valor Utilizado:</span>
        <span class="info-value value">${formatCurrency(selectedContract.usedValue)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Saldo Restante:</span>
        <span class="info-value value" style="color: ${selectedContract.remainingBalance <= 0 ? '#dc2626' : '#059669'}">${formatCurrency(selectedContract.remainingBalance)}</span>
      </div>
    </div>
  </div>
  
  <div class="signature-section">
    <div class="signature-line"></div>
    <p><strong>${contractUnit?.responsible || 'Responsável'}</strong></p>
    <p>${selectedContract.managingUnit}</p>
    <p style="margin-top: 15px; color: #6b7280; font-size: 11px;">
      Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
    </p>
  </div>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Contrato_${selectedContract.number.replace('/', '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Also open in new tab for immediate viewing/printing
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
      // Auto-trigger print dialog after content loads
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.print();
        }, 500);
      };
    }
  };

  const generateReport = () => {
    const reportData = {
      reportType,
      selectedUnit,
      selectedProgram,
      selectedModality,
      startDate,
      endDate
    };

    console.log('Gerando relatório:', reportData);

    if (reportType === 'unit') {
      if (!selectedUnit) {
        alert('Por favor, selecione uma secretaria.');
        return;
      }
    }

    if (reportType === 'period') {
      if (!startDate || !endDate) {
        alert('Por favor, informe o período (data inicial e final).');
        return;
      }
      
      if (new Date(startDate) > new Date(endDate)) {
        alert('A data inicial deve ser anterior à data final.');
        return;
      }

      // Filtrar contratos por período
      const filteredContracts = contracts.filter(contract => {
        const contractStart = contract.startDate;
        const contractEnd = contract.endDate;
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        
        // Verificar se há sobreposição entre o período do contrato e o período filtrado
        const hasOverlap = contractStart <= filterEnd && contractEnd >= filterStart;
        
        // Aplicar filtros opcionais
        const matchesUnit = !selectedUnit || selectedUnit === 'all' || contract.managingUnit === selectedUnit;
        const matchesModality = !selectedModality || selectedModality === 'all' || contract.modality === selectedModality;
        const matchesProgram = !selectedProgram || contract.object.toLowerCase().includes(selectedProgram.toLowerCase());
        
        return hasOverlap && matchesUnit && matchesModality && matchesProgram;
      });

      if (filteredContracts.length === 0) {
        alert('Nenhum contrato encontrado no período informado com os filtros aplicados.');
        return;
      }

      // Gerar relatório com os contratos filtrados
      const reportContent = `
RELATÓRIO DE CONTRATOS POR PERÍODO
Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}
${selectedUnit ? `Secretaria: ${selectedUnit}` : ''}
${selectedModality ? `Modalidade: ${selectedModality}` : ''}
${selectedProgram ? `Programa: ${selectedProgram}` : ''}

CONTRATOS ENCONTRADOS: ${filteredContracts.length}

${filteredContracts.map((contract, index) => `
${index + 1}. CONTRATO ${contract.number}
   Empresa: ${contract.contractor}
   Objeto: ${contract.object}
   Secretaria: ${contract.managingUnit}
   Valor: R$ ${contract.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
   Vigência: ${contract.startDate.toLocaleDateString('pt-BR')} a ${contract.endDate.toLocaleDateString('pt-BR')}
   Status: ${contract.status === 'active' ? 'Ativo' : contract.status === 'completed' ? 'Concluído' : contract.status === 'expired' ? 'Vencido' : 'Suspenso'}
`).join('')}

RESUMO:
- Total de contratos: ${filteredContracts.length}
- Valor total: R$ ${filteredContracts.reduce((sum, c) => sum + c.currentValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Contratos ativos: ${filteredContracts.filter(c => c.status === 'active').length}
- Contratos concluídos: ${filteredContracts.filter(c => c.status === 'completed').length}
      `;

      // Simular abertura de PDF em nova aba
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Relatório de Contratos - Período</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
              </style>
            </head>
            <body>
              <h1>Sistema de Contratos - Prefeitura Municipal</h1>
              <pre>${reportContent}</pre>
              <script>
                window.onload = function() {
                  window.print();
                }
              </script>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
      
      alert(`Relatório gerado com sucesso!\n\nEncontrados ${filteredContracts.length} contratos no período informado.`);
      return;
    }
    
    // Simular abertura de PDF em nova aba
    alert(`Relatório por Secretaria gerado com sucesso!\n\n(Em uma implementação real, abriria o PDF em nova aba)`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Relatórios</h2>
        <p className="text-gray-600">Gere relatórios em PDF dos contratos da prefeitura</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seleção do tipo de relatório */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileBarChart className="w-5 h-5 mr-2 text-blue-600" />
              Tipo de Relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <button
                onClick={() => setReportType('individual')}
                className={`w-full p-3 text-left rounded-lg border transition-colors ${
                  reportType === 'individual' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">Relatório Individual</div>
                <div className="text-sm text-gray-500">Relatório detalhado de um contrato específico</div>
              </button>

              <button
                onClick={() => setReportType('unit')}
                className={`w-full p-3 text-left rounded-lg border transition-colors ${
                  reportType === 'unit' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">Por Secretaria/Programa</div>
                <div className="text-sm text-gray-500">Todos os contratos de uma secretaria ou programa</div>
              </button>

              <button
                onClick={() => setReportType('period')}
                className={`w-full p-3 text-left rounded-lg border transition-colors ${
                  reportType === 'period' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">Por Período</div>
                <div className="text-sm text-gray-500">Contratos dentro de um intervalo de datas</div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de filtros */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Filtros do Relatório</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportType === 'individual' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="searchTerm">Buscar Contrato</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="searchTerm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Digite o número do contrato ou nome da empresa"
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Lista de contratos filtrados */}
                  {filteredContracts.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg bg-white shadow-lg">
                      {filteredContracts.map(contract => (
                        <div
                          key={contract.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleContractSelect(contract)}
                        >
                          <div className="font-medium text-blue-600">{contract.number}</div>
                          <div className="text-sm text-gray-600">{contract.contractor}</div>
                          <div className="text-xs text-gray-500">{contract.object.substring(0, 60)}...</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {reportType === 'unit' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="unit">Secretaria</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a secretaria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Secretarias</SelectItem>
                      {managingUnits.map(unit => (
                        <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="program">Programa (Opcional)</Label>
                  <Input
                    id="program"
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    placeholder="Digite o programa específico"
                  />
                </div>
              </div>
            )}

            {reportType === 'period' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data Inicial</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">Data Final</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="modalityFilter">Filtrar por Modalidade (Opcional)</Label>
                  <Select value={selectedModality} onValueChange={setSelectedModality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as modalidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Modalidades</SelectItem>
                      <SelectItem value="dispensa">Dispensa</SelectItem>
                      <SelectItem value="pregao-eletronico">Pregão Eletrônico</SelectItem>
                      <SelectItem value="concorrencia-publica">Concorrência Pública</SelectItem>
                      <SelectItem value="chamada-publica">Chamada Pública</SelectItem>
                      <SelectItem value="registro-preco">Registro de Preço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unitFilter">Filtrar por Secretaria (Opcional)</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as secretarias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Secretarias</SelectItem>
                      {managingUnits.map(unit => (
                        <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="programFilter">Filtrar por Programa (Opcional)</Label>
                  <Input
                    id="programFilter"
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    placeholder="Digite o programa específico"
                  />
                </div>
              </div>
            )}

            {reportType && reportType !== 'individual' && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={generateReport}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!reportType}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Gerar Relatório PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pré-visualização do PDF */}
      {showPdfPreview && selectedContract && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pré-visualização do Relatório</CardTitle>
              <div className="space-x-2">
                <Button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowPdfPreview(false);
                  setSelectedContract(null);
                }}>
                  Fechar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className="border rounded-lg p-4 bg-white max-h-[800px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: generateIndividualPDF(selectedContract) }}
            />
          </CardContent>
        </Card>
      )}

    </div>
  );
}