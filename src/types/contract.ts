export interface Contract {
  id: string;
  number: string;
  modality: 'dispensa' | 'pregao-eletronico' | 'concorrencia-publica' | 'chamada-publica' | 'registro-preco';
  isCarona?: boolean; // Only for registro-preco
  object: string;
  contractor: string;
  managingUnit: string;
  originalValue: number;
  currentValue: number;
  usedValue: number;
  remainingBalance: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'suspended' | 'completed';
  additives: Additive[];
  invoices: Invoice[];
}

export interface Additive {
  id: string;
  contractId: string;
  type: 'value' | 'term' | 'both';
  description: string;
  valueChange: number;
  termChange: number; // in days
  date: Date;
  justification: string;
}

export interface Payment {
  id: string;
  contractId: string;
  description: string;
  value: number;
  date: Date;
  invoice: string;
  status: 'pending' | 'paid' | 'cancelled';
}

export interface ManagingUnit {
  id: string;
  name: string;
  code: string;
  programs: Program[];
  responsible: string;
  email: string;
  phone: string;
  fiscalId?: string;
}

export interface Program {
  id: string;
  name: string;
  unitId: string;
}

export interface Invoice {
  id: string;
  contractId: string;
  number: string;
  value: number;
  date: Date;
}

export interface Company {
  id: string;
  name: string;
  document: string;
  city: string;
  state: string;
}