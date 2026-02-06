
export interface User {
  id?: string;
  name: string;
  phone: string;
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
  burgerProducts: boolean;
  burgerPOS: boolean;
  burgerWaiter: boolean;
  burgerDelivery: boolean;
  burgerDashboard: boolean;
  burgerClient: boolean;
  burgerCompany: boolean;
}

export type ActivePage = keyof MenuPermissions | 'home';

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
  owner?: string;
  isOwnedByCurrentUser?: boolean;
}

export interface UserCompanyLink {
  _id: string;
  userPhone: string;
  empresaId: string;
  status: string;
}

export enum PontoStatus {
  PENDENTE = 'pendente',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  CANCELADO = 'cancelado'
}

export interface WorkRecord {
  id: string;
  employeePhone: string;
  employeeName?: string;
  companyId: string;
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
  status: PontoStatus;
  rejectionReason?: string;
  approvedBy?: string;
  rejectedBy?: string;
}

export enum OSStatus {
  ABERTO = 'aberto',
  EM_ANDAMENTO = 'em_andamento',
  FECHADO = 'fechado',
  CANCELADO = 'cancelado'
}

export interface OrdemServico {
  id: string;
  openerPhone: string;
  empresaId: string;
  title: string;
  description: string;
  status: OSStatus;
  createdAt: string;
  resolution?: string;
  companyId?: string | { _id: string };
}

export enum TransactionType {
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

export enum PaymentStatus {
  PAID = 'pago',
  UNPAID = 'nao_pago',
  PENDING = 'pendente'
}

export interface Addition {
  _id: string;
  name: string;
  value: number;
  removed?: boolean;
}

export interface Transaction {
  id: string;
  ownerPhone: string;
  type: TransactionType;
  name: string;
  amount: number;
  date: string;
  isControlled: boolean;
  status: PaymentStatus;
  counterpartyPhone?: string;
  controlId?: string;
  sharerPhone?: string;
  aggregate?: boolean;
  additions?: Addition[];
  paidAmount?: number;
}

export interface SharedUser {
  phone: string;
  aggregate: boolean;
}

export interface Market {
  id: string;
  name: string;
  address?: string;
  number?: string;
  zip?: string;
  status: 'active' | 'inactive';
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
}

// Alias for Market as used in LojasPage
export type Loja = Market;

export interface Product {
  id: number | string;
  _id?: string;
  name: string;
  brand?: string;
  type?: string;
  quantity: number;
  packQuantity?: number;
  value: number;
  total?: number;
  price?: number; // Used in BurgerProduct context
  parentListId?: string;
  marketId?: { name: string };
  currentPrice?: number;
  productName?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  marketId: string;
  date: string;
  products: Product[];
  total: number;
  completed: boolean;
  createdAt?: string;
  idUser?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface BurgerProduct {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  status: string;
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
  deliveryBy?: string;
  deliveredBy?: string;
  onclient?: boolean;
}

export interface BurgerTable {
  id: number;
  occupied: boolean;
}

export interface BurgerConfig {
    _id?: string;
    BURGER: string;
    CNPJ: string;
    CAIXA: string[];
    GARCOM: string[];
    DELIVERY: string[];
    PERIOD?: { day: string; start: string; end: string }[];
    phone: string;
    PAYMENT_METHODS: string[];
    DEBIT_CARD_FEE_RATE: number;
    CREDIT_CARD_FEE_RATE: number;
    TAXA_POR_KM: number;
    PREFIXOS_LOGRADOURO: string[];
    latitude: string;
    longitude: string;
    TAXA_DELIVERY_FIXA: number;
    DELIVERY_FEE: number;
    TABLE_COUNT: number;
    STATUS: 'active' | 'inactive';
}
