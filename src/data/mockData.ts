import { Contract, ManagingUnit, Company, Program, Invoice } from '../types/contract';

export const companies: Company[] = [
  {
    id: '1',
    name: 'Papelaria Educacional Ltda',
    document: '12.345.678/0001-90',
    city: 'São Paulo',
    state: 'SP'
  },
  {
    id: '2',
    name: 'Limpeza Total Serviços Ltda',
    document: '98.765.432/0001-10',
    city: 'São Paulo',
    state: 'SP'
  },
  {
    id: '3',
    name: 'Construtora Cidade Nova Ltda',
    document: '11.222.333/0001-44',
    city: 'São Paulo',
    state: 'SP'
  },
  {
    id: '4',
    name: 'Auto Mecânica Central Ltda',
    document: '55.666.777/0001-88',
    city: 'São Paulo',
    state: 'SP'
  },
  {
    id: '5',
    name: 'Distribuidora Farmacêutica São Paulo Ltda',
    document: '99.888.777/0001-66',
    city: 'São Paulo',
    state: 'SP'
  }
];

export const programs: Program[] = [
  { id: '1', name: 'Programa de Educação Básica', unitId: '1' },
  { id: '2', name: 'Programa de Educação Infantil', unitId: '1' },
  { id: '3', name: 'Programa de Atenção Básica', unitId: '2' },
  { id: '4', name: 'Programa de Saúde da Família', unitId: '2' },
  { id: '5', name: 'Programa de Infraestrutura', unitId: '3' },
  { id: '6', name: 'Programa de Mobilidade Urbana', unitId: '4' },
];

export const managingUnits: ManagingUnit[] = [
  {
    id: '1',
    name: 'Secretaria de Educação',
    code: 'SEMED',
    programs: programs.filter(p => p.unitId === '1'),
    responsible: 'Maria Silva',
    email: 'maria.silva@prefeitura.gov.br',
    phone: '(11) 3333-1111',
    fiscalId: '1'
  },
  {
    id: '2',
    name: 'Secretaria de Saúde',
    code: 'SESAU',
    programs: programs.filter(p => p.unitId === '2'),
    responsible: 'João Santos',
    email: 'joao.santos@prefeitura.gov.br',
    phone: '(11) 3333-2222',
    fiscalId: '2'
  },
  {
    id: '3',
    name: 'Secretaria de Obras',
    code: 'SEOBR',
    programs: programs.filter(p => p.unitId === '3'),
    responsible: 'Ana Costa',
    email: 'ana.costa@prefeitura.gov.br',
    phone: '(11) 3333-3333',
    fiscalId: '3'
  },
  {
    id: '4',
    name: 'Secretaria de Transporte',
    code: 'SETRANS',
    programs: programs.filter(p => p.unitId === '4'),
    responsible: 'Carlos Lima',
    email: 'carlos.lima@prefeitura.gov.br',
    phone: '(11) 3333-4444',
    fiscalId: '1'
  }
];

export const contracts: Contract[] = [
  {
    id: '1',
    number: '001/2024',
    modality: 'pregao-eletronico',
    object: 'Fornecimento de material escolar para rede municipal de ensino',
    contractor: 'Papelaria Educacional Ltda',
    managingUnit: 'Secretaria de Educação',
    originalValue: 150000,
    currentValue: 180000,
    usedValue: 95000,
    remainingBalance: 85000,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-31'),
    status: 'active',
    additives: [
      {
        id: '1',
        contractId: '1',
        type: 'value',
        description: 'Aditivo para aumento de valor devido à demanda adicional',
        valueChange: 30000,
        termChange: 0,
        date: new Date('2024-06-15'),
        justification: 'Aumento do número de alunos matriculados'
      }
    ],
    invoices: [
      {
        id: '1',
        contractId: '1',
        number: 'NF-001',
        value: 25000,
        date: new Date('2024-02-01')
      },
      {
        id: '2',
        contractId: '1',
        number: 'NF-002',
        value: 35000,
        date: new Date('2024-03-01')
      },
      {
        id: '3',
        contractId: '1',
        number: 'NF-003',
        value: 35000,
        date: new Date('2024-04-01')
      }
    ]
  },
  {
    id: '2',
    number: '002/2024',
    modality: 'concorrencia-publica',
    object: 'Serviços de limpeza e conservação de unidades de saúde',
    contractor: 'Limpeza Total Serviços Ltda',
    managingUnit: 'Secretaria de Saúde',
    originalValue: 240000,
    currentValue: 240000,
    usedValue: 160000,
    remainingBalance: 80000,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-01-31'),
    status: 'active',
    additives: [],
    invoices: [
      {
        id: '4',
        contractId: '2',
        number: 'NF-101',
        value: 40000,
        date: new Date('2024-02-28')
      },
      {
        id: '5',
        contractId: '2',
        number: 'NF-102',
        value: 40000,
        date: new Date('2024-03-31')
      },
      {
        id: '6',
        contractId: '2',
        number: 'NF-103',
        value: 40000,
        date: new Date('2024-04-30')
      },
      {
        id: '7',
        contractId: '2',
        number: 'NF-104',
        value: 40000,
        date: new Date('2024-05-31')
      }
    ]
  },
  {
    id: '3',
    number: '003/2024',
    modality: 'concorrencia-publica',
    object: 'Reforma e ampliação da Escola Municipal João da Silva',
    contractor: 'Construtora Cidade Nova Ltda',
    managingUnit: 'Secretaria de Obras',
    originalValue: 500000,
    currentValue: 650000,
    usedValue: 325000,
    remainingBalance: 325000,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-11-30'),
    status: 'active',
    additives: [
      {
        id: '2',
        contractId: '3',
        type: 'both',
        description: 'Aditivo para ampliação do projeto e extensão de prazo',
        valueChange: 150000,
        termChange: 60,
        date: new Date('2024-07-15'),
        justification: 'Necessidade de ampliação da área construída conforme demanda da comunidade'
      }
    ],
    invoices: [
      {
        id: '8',
        contractId: '3',
        number: 'NF-201',
        value: 125000,
        date: new Date('2024-04-15')
      },
      {
        id: '9',
        contractId: '3',
        number: 'NF-202',
        value: 200000,
        date: new Date('2024-06-15')
      }
    ]
  },
  {
    id: '4',
    number: '004/2024',
    modality: 'registro-preco',
    isCarona: false,
    object: 'Manutenção preventiva e corretiva da frota municipal',
    contractor: 'Auto Mecânica Central Ltda',
    managingUnit: 'Secretaria de Transporte',
    originalValue: 120000,
    currentValue: 120000,
    usedValue: 45000,
    remainingBalance: 75000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: 'active',
    additives: [],
    invoices: [
      {
        id: '10',
        contractId: '4',
        number: 'NF-301',
        value: 15000,
        date: new Date('2024-02-05')
      },
      {
        id: '11',
        contractId: '4',
        number: 'NF-302',
        value: 18000,
        date: new Date('2024-03-05')
      },
      {
        id: '12',
        contractId: '4',
        number: 'NF-303',
        value: 12000,
        date: new Date('2024-04-05')
      }
    ]
  },
  {
    id: '5',
    number: '005/2024',
    modality: 'dispensa',
    object: 'Fornecimento de medicamentos para farmácia básica',
    contractor: 'Distribuidora Farmacêutica São Paulo Ltda',
    managingUnit: 'Secretaria de Saúde',
    originalValue: 300000,
    currentValue: 300000,
    usedValue: 300000,
    remainingBalance: 0,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    status: 'completed',
    additives: [],
    invoices: [
      {
        id: '13',
        contractId: '5',
        number: 'NF-401',
        value: 100000,
        date: new Date('2024-02-15')
      },
      {
        id: '14',
        contractId: '5',
        number: 'NF-402',
        value: 100000,
        date: new Date('2024-04-15')
      },
      {
        id: '15',
        contractId: '5',
        number: 'NF-403',
        value: 100000,
        date: new Date('2024-06-15')
      }
    ]
  }
];