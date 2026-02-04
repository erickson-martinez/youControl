
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
  id?: string; // Adicionado ID para suportar a API de Listas
}

export interface MenuPermissions {
  rh: boolean;
  financeiro: boolean;
  graficos: boolean;
  os: boolean;
  ponto: boolean;
  aprovarHoras: boolean;
  chamados: boolean;
  empresa: boolean;
  lojas: boolean;
  listPurcharse: boolean;
  settings: boolean;
  exemplo: boolean;
  financialManual: boolean;
  // Módulo Hamburgueria
  burgerProducts: boolean;
  burgerPOS: boolean;
  burgerWaiter: boolean;
  burgerDelivery: boolean;
  burgerDashboard: boolean;
  burgerClient: boolean;
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

export interface Loja {
  id: string;
  name: string;
  address?: string;
  number?: string;
  zip?: string;
  latitude?: number | null;
  longitude?: number | null;
  status: 'active' | 'inactive';
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
  _id?: string;
  userPhone: string;
  empresaId: string;
  status: 'ativo' | 'inativo' | 'pendente';
}

export type ActivePage = 'home' | 'financeiro' | 'graficos' | 'rh' | 'os' | 'settings' | 'empresa' | 'lojas' | 'ponto' | 'aprovar-horas' | 'chamados' | 'listPurcharse' | 'exemplo' | 'financialManual' | 'burgerProducts' | 'burgerPOS' | 'burgerWaiter' | 'burgerDelivery' | 'burgerDashboard' | 'burgerClient';

// Tipos para Lista de Compras
export interface Market {
  id: string;
  name: string;
}

export interface Product {
  _id?: string;
  id?: string; // Fallback for old local storage logic if needed
  name: string;
  type?: string;
  quantity: number;
  brand?: string;
  packQuantity?: number;
  value: number; // Unit price
  total?: number;
  price?: number; // Fallback for old local storage logic
}

export interface ShoppingList {
  _id: string;
  id?: string; // Fallback
  name: string;
  marketId: string;
  idUser: string;
  date?: string; // Optional in API response
  products: Product[];
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
  total?: number;
}

// Tipos Hamburgueria
export interface BurgerProduct {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  status: 'Ativo' | 'Inativo';
}

export interface BurgerOrderItem {
  id: number;
  qty: number;
}

export interface BurgerOrder {
  id: number;
  time: string;
  name: string;
  phone?: string;
  paymentMethod: string;
  delivery: boolean;
  address?: {
    address: string;
    number: string;
    neighborhood?: string;
  } | null;
  items: BurgerOrderItem[];
  total: number;
  deliveryFee?: number;
  status: 'Aguardando' | 'Preparando' | 'Em preparo' | 'Pronto' | 'A caminho' | 'Entregue' | 'Recebido' | 'Aberto' | 'Fechamento' | 'Cancelado' | 'Retirada';
  payment: boolean;
  statusHistory?: Record<string, { start: string; end: string | null }>;
  tableNumber?: string;
  notes?: string;
  pickupTime?: string;
}

export interface BurgerTable {
  id: number;
  occupied: boolean;
}
