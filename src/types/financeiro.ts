import { AppointmentStatus } from './index';

export type ReceivableStatus = 'paid' | 'pending' | 'overdue' | 'cancelled' | 'partially_paid';

export type PayableStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export type PayableCategory =
  | 'aluguel'
  | 'salarios'
  | 'comissoes'
  | 'fornecedores'
  | 'marketing'
  | 'internet'
  | 'energia'
  | 'impostos'
  | 'materiais'
  | 'funcionarios'
  | 'outros';

export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'debito'
  | 'credito'
  | 'transferencia'
  | 'boleto'
  | 'outros';

export interface Receivable {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  appointment_id?: string;
  service_name?: string;
  professional_name?: string;
  description: string;
  original_amount: number;
  discount: number;
  surcharge: number;
  final_amount: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  due_date: string; // YYYY-MM-DD
  paid_at?: string; // YYYY-MM-DD
  status: ReceivableStatus;
  has_signal?: boolean;
  signal_amount?: number;
  signal_paid?: boolean;
  notes?: string;
  created_at: string;
}

export interface Payable {
  id: string;
  description: string;
  category: PayableCategory;
  supplier_id?: string;
  supplier_name?: string;
  due_date: string; // YYYY-MM-DD
  amount: number;
  paid_amount?: number;
  status: PayableStatus;
  payment_method?: PaymentMethod;
  paid_at?: string;
  professional_id?: string;
  professional_name?: string;
  is_recurring?: boolean;
  recurrence_type?: string;
  notes?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  trade_name?: string; // Nome Fantasia
  document: string; // CNPJ ou CPF
  phone: string;
  email?: string;
  address?: string;
  carrier_name?: string; // Nome da Transportadora
  category: string;
  notes?: string;
  created_at: string;
}

export interface Merchandise {
  id: string;
  name: string;
  supplier_id?: string;
  supplier_name?: string;
  carrier_name?: string; // Transportadora responsável
  quantity: number;
  min_quantity: number;
  unit: string; // un, kg, litro, cx, pacote
  cost_price: number;
  sale_price?: number;
  total_cost: number;
  last_restock_date: string;
  created_at: string;
}

export interface PaymentSetting {
  id: string;
  method: PaymentMethod;
  name: string;
  enabled: boolean;
  operator_fee_percentage: number;
  settlement_days: number; // D+1, D+30
  max_installments?: number;
  installments_fee_step?: number;
}

export interface DepositConfig {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number; // ex: 30 (% ou R$)
  pix_key?: string;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  require_pix_receipt: boolean;
  instructions: string;
}

export interface CashFlowEntry {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  balance_after: number;
  payment_method: PaymentMethod;
  reference_id?: string;
  reference_type?: 'receivable' | 'payable';
}

export interface CommissionSummary {
  professional_id: string;
  professional_name: string;
  role: string;
  appointments_count: number;
  total_revenue: number;
  commission_percentage: number;
  commission_generated: number;
  commission_paid: number;
  commission_pending: number;
}

export type FinancialPeriod = 'today' | 'week' | 'month' | 'next_month' | 'all';
