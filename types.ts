
export enum TransactionType {
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum PaymentStatus {
  PAID = 'pago',
  UNPAID = 'nao_pago',
  PENDING = 'pendente',
}

export interface Addition {
  _id: string;
  name: string;
  value: number;
  removed: boolean;
}

export interface Transaction {
  id: string;
  ownerPhone: string;
  type: TransactionType;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD format
  isControlled: boolean;
  counterpartyPhone?: string;
  status: PaymentStatus;
  controlId?: string;
  sharerPhone?: string;
  aggregate?: boolean;
  additions?: Addition[];
  paidAmount?: number;
}

export interface User {
  phone: string;
  name: string;
}

export interface MenuPermissions {
  rh: boolean;
  financeiro: boolean;
  os: boolean;
  ponto: boolean;
  aprovarHoras: boolean;
  chamados: boolean;
  empresa: boolean;
  listPurcharse: boolean;
  settings: boolean;
  exemplo: boolean;
}

export interface Empresa {
  id: string;
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: 'ativo' | 'inativo';
  owner: string;
  isOwnedByCurrentUser?: boolean;
}

export enum PontoStatus {
  PENDENTE = 'pendente',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  CANCELADO = 'cancelado',
}

export interface WorkRecord {
  id: string;
  employeePhone: string;
  employeeName?: string;
  companyId: string;
  entryTime: string; // ISO String
  exitTime?: string; // ISO String
  durationMinutes?: number;
  notes?: string;
  status: PontoStatus;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}


export enum OSStatus {
    ABERTO = 'aberto',
    EM_ANDAMENTO = 'em_andamento',
    FECHADO = 'resolvido',
    CANCELADO = 'cancelado',
}

export interface OrdemServico {
    id: string;
    openerPhone: string;
    empresaId: string;
    title: string;
    description: string;
    status: OSStatus;
    createdAt: string; // ISO String
    resolution?: string;
}

export interface SharedUser {
  phone: string;
  aggregate: boolean;
}

export interface UserCompanyLink {
  _id?: string; // Made optional to support new API response
  userPhone: string;
  empresaId: string;
  status: 'ativo' | 'inativo' | 'pendente';
}

export type ActivePage = 'home' | 'financeiro' | 'rh' | 'os' | 'settings' | 'empresa' | 'ponto' | 'aprovar-horas' | 'chamados' | 'listPurcharse' | 'exemplo';