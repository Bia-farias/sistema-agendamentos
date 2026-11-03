import { apiClient } from './apiClient';
import {
  Receivable,
  Payable,
  Supplier,
  Merchandise,
  DepositConfig,
  PaymentMethod,
  ReceivableStatus,
  PayableStatus,
  PayableCategory,
} from '../../types/financeiro';

function mapBackendReceivable(r: any): Receivable {
  return {
    id: r.id,
    appointment_id: r.appointmentId || undefined,
    customer_id: r.clientId || r.customerId || undefined,
    customer_name: r.customerName,
    customer_phone: r.customerPhone || undefined,
    service_name: r.serviceName || undefined,
    professional_name: r.professionalName || undefined,
    description: r.description,
    original_amount: Number(r.originalAmount),
    discount: Number(r.discount || 0),
    surcharge: Number(r.surcharge || 0),
    final_amount: Number(r.finalAmount),
    amount_paid: Number(r.amountPaid || 0),
    payment_method: (r.paymentMethod ? r.paymentMethod.toLowerCase() : 'pix') as PaymentMethod,
    due_date: r.dueDate,
    paid_at: r.paidAt || undefined,
    status: (r.status ? r.status.toLowerCase() : 'pending') as ReceivableStatus,
    has_signal: Boolean(r.hasSignal),
    signal_amount: r.signalAmount ? Number(r.signalAmount) : undefined,
    signal_paid: Boolean(r.signalPaid),
    notes: r.notes || undefined,
    created_at: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt || Date.now()).toISOString(),
  };
}

function mapBackendPayable(p: any): Payable {
  return {
    id: p.id,
    description: p.description,
    category: (p.category ? p.category.toLowerCase() : 'outros') as PayableCategory,
    amount: Number(p.amount),
    paid_amount: Number(p.paidAmount || 0),
    due_date: p.dueDate,
    paid_at: p.paidAt || undefined,
    status: (p.status ? p.status.toLowerCase() : 'pending') as PayableStatus,
    supplier_id: p.supplierId || undefined,
    supplier_name: p.supplierName || undefined,
    professional_id: p.professionalId || undefined,
    professional_name: p.professionalName || undefined,
    payment_method: p.paymentMethod ? (p.paymentMethod.toLowerCase() as PaymentMethod) : undefined,
    is_recurring: Boolean(p.isRecurring),
    recurrence_type: p.recurrenceType || undefined,
    notes: p.notes || undefined,
    created_at: typeof p.createdAt === 'string' ? p.createdAt : new Date(p.createdAt || Date.now()).toISOString(),
  };
}

function mapBackendSupplier(s: any): Supplier {
  return {
    id: s.id,
    name: s.name,
    trade_name: s.tradeName || undefined,
    document: s.document,
    phone: s.phone,
    email: s.email || undefined,
    address: s.address || undefined,
    carrier_name: s.carrierName || undefined,
    category: s.category || 'Geral',
    notes: s.notes || undefined,
    created_at: typeof s.createdAt === 'string' ? s.createdAt : new Date(s.createdAt || Date.now()).toISOString(),
  };
}

function mapBackendMerchandise(m: any): Merchandise {
  return {
    id: m.id,
    name: m.name,
    supplier_id: m.supplierId || undefined,
    supplier_name: m.supplierName || undefined,
    carrier_name: m.carrierName || undefined,
    quantity: m.quantity || 0,
    min_quantity: m.minQuantity !== undefined ? m.minQuantity : 5,
    unit: m.unit || 'un',
    cost_price: Number(m.costPrice),
    sale_price: m.salePrice ? Number(m.salePrice) : undefined,
    total_cost: Number(m.totalCost),
    last_restock_date: m.lastRestockDate || new Date().toISOString().split('T')[0],
    created_at: typeof m.createdAt === 'string' ? m.createdAt : new Date(m.createdAt || Date.now()).toISOString(),
  };
}

export const financialApiService = {
  // Receivables
  async getReceivables(): Promise<Receivable[]> {
    const res = await apiClient.get<any[]>('/financial/receivables');
    return (res || []).map(mapBackendReceivable);
  },

  async createReceivable(receivable: Omit<Receivable, 'id' | 'created_at'>): Promise<Receivable> {
    const res = await apiClient.post<any>('/financial/receivables', {
      customerName: receivable.customer_name,
      customerPhone: receivable.customer_phone || null,
      customerId: receivable.customer_id || null,
      appointmentId: receivable.appointment_id || null,
      serviceName: receivable.service_name || null,
      professionalName: receivable.professional_name || null,
      description: receivable.description,
      originalAmount: receivable.original_amount,
      discount: receivable.discount || 0,
      surcharge: receivable.surcharge || 0,
      finalAmount: receivable.final_amount,
      amountPaid: receivable.amount_paid || 0,
      paymentMethod: receivable.payment_method,
      dueDate: receivable.due_date,
      paidAt: receivable.paid_at || null,
      status: receivable.status,
      hasSignal: receivable.has_signal || false,
      signalAmount: receivable.signal_amount || null,
      signalPaid: receivable.signal_paid || false,
      notes: receivable.notes || null,
    });
    return mapBackendReceivable(res);
  },

  async updateReceivable(id: string, updates: Partial<Receivable>): Promise<Receivable> {
    const payload: any = {};
    if (updates.customer_name) payload.customerName = updates.customer_name;
    if (updates.description) payload.description = updates.description;
    if (updates.original_amount !== undefined) payload.originalAmount = updates.original_amount;
    if (updates.final_amount !== undefined) payload.finalAmount = updates.final_amount;
    if (updates.amount_paid !== undefined) payload.amountPaid = updates.amount_paid;
    if (updates.payment_method) payload.paymentMethod = updates.payment_method;
    if (updates.due_date) payload.dueDate = updates.due_date;
    if (updates.paid_at !== undefined) payload.paidAt = updates.paid_at;
    if (updates.status) payload.status = updates.status;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const res = await apiClient.put<any>(`/financial/receivables/${id}`, payload);
    return mapBackendReceivable(res);
  },

  async markReceivablePaid(id: string, paymentMethod?: string, paidAt?: string): Promise<Receivable> {
    const res = await apiClient.patch<any>(`/financial/receivables/${id}/pay`, { paymentMethod, paidAt });
    return mapBackendReceivable(res);
  },

  async deleteReceivable(id: string): Promise<void> {
    await apiClient.delete(`/financial/receivables/${id}`);
  },

  // Payables
  async getPayables(): Promise<Payable[]> {
    const res = await apiClient.get<any[]>('/financial/payables');
    return (res || []).map(mapBackendPayable);
  },

  async createPayable(payable: Omit<Payable, 'id' | 'created_at'>): Promise<Payable> {
    const res = await apiClient.post<any>('/financial/payables', {
      description: payable.description,
      category: payable.category,
      amount: payable.amount,
      paidAmount: payable.paid_amount || 0,
      dueDate: payable.due_date,
      paidAt: payable.paid_at || null,
      status: payable.status,
      supplierId: payable.supplier_id || null,
      supplierName: payable.supplier_name || null,
      professionalId: payable.professional_id || null,
      professionalName: payable.professional_name || null,
      paymentMethod: payable.payment_method || null,
      isRecurring: payable.is_recurring || false,
      recurrenceType: payable.recurrence_type || null,
      notes: payable.notes || null,
    });
    return mapBackendPayable(res);
  },

  async updatePayable(id: string, updates: Partial<Payable>): Promise<Payable> {
    const payload: any = {};
    if (updates.description) payload.description = updates.description;
    if (updates.category) payload.category = updates.category;
    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.paid_amount !== undefined) payload.paidAmount = updates.paid_amount;
    if (updates.due_date) payload.dueDate = updates.due_date;
    if (updates.paid_at !== undefined) payload.paidAt = updates.paid_at;
    if (updates.status) payload.status = updates.status;
    if (updates.payment_method !== undefined) payload.paymentMethod = updates.payment_method;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const res = await apiClient.put<any>(`/financial/payables/${id}`, payload);
    return mapBackendPayable(res);
  },

  async markPayablePaid(id: string, paidAmount?: number, paymentMethod?: string, paidAt?: string): Promise<Payable> {
    const res = await apiClient.patch<any>(`/financial/payables/${id}/pay`, { paidAmount, paymentMethod, paidAt });
    return mapBackendPayable(res);
  },

  async deletePayable(id: string): Promise<void> {
    await apiClient.delete(`/financial/payables/${id}`);
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const res = await apiClient.get<any[]>('/financial/suppliers');
    return (res || []).map(mapBackendSupplier);
  },

  async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
    const res = await apiClient.post<any>('/financial/suppliers', {
      name: supplier.name,
      tradeName: supplier.trade_name || null,
      document: supplier.document,
      phone: supplier.phone,
      email: supplier.email || null,
      address: supplier.address || null,
      carrierName: supplier.carrier_name || null,
      category: supplier.category || 'Geral',
      notes: supplier.notes || null,
    });
    return mapBackendSupplier(res);
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.trade_name !== undefined) payload.tradeName = updates.trade_name;
    if (updates.document) payload.document = updates.document;
    if (updates.phone) payload.phone = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.carrier_name !== undefined) payload.carrierName = updates.carrier_name;
    if (updates.category) payload.category = updates.category;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const res = await apiClient.put<any>(`/financial/suppliers/${id}`, payload);
    return mapBackendSupplier(res);
  },

  async deleteSupplier(id: string): Promise<void> {
    await apiClient.delete(`/financial/suppliers/${id}`);
  },

  // Merchandise & Estoque
  async getMerchandise(): Promise<Merchandise[]> {
    const res = await apiClient.get<any[]>('/financial/merchandise');
    return (res || []).map(mapBackendMerchandise);
  },

  async createMerchandise(merchandise: Omit<Merchandise, 'id' | 'created_at' | 'total_cost'>): Promise<Merchandise> {
    const res = await apiClient.post<any>('/financial/merchandise', {
      name: merchandise.name,
      supplierId: merchandise.supplier_id || null,
      supplierName: merchandise.supplier_name || null,
      carrierName: merchandise.carrier_name || null,
      quantity: merchandise.quantity || 0,
      minQuantity: merchandise.min_quantity !== undefined ? merchandise.min_quantity : 5,
      unit: merchandise.unit || 'un',
      costPrice: merchandise.cost_price,
      salePrice: merchandise.sale_price || null,
      lastRestockDate: merchandise.last_restock_date || null,
    });
    return mapBackendMerchandise(res);
  },

  async adjustStock(id: string, type: 'entry' | 'exit' | 'adjustment', quantityDelta: number, reason?: string): Promise<Merchandise> {
    const res = await apiClient.post<any>(`/financial/merchandise/${id}/adjust`, {
      type,
      quantityDelta,
      reason,
    });
    return mapBackendMerchandise(res);
  },

  async deleteMerchandise(id: string): Promise<void> {
    await apiClient.delete(`/financial/merchandise/${id}`);
  },

  // Deposit Config
  async getDepositConfig(): Promise<DepositConfig> {
    const res = await apiClient.get<any>('/financial/deposit-config');
    return {
      enabled: Boolean(res.enabled),
      type: res.type || 'percentage',
      value: Number(res.value || 30),
      require_pix_receipt: true,
      instructions: 'Para confirmar seu agendamento, realize o pagamento do sinal via Pix.',
    };
  },

  async updateDepositConfig(config: Partial<DepositConfig>): Promise<DepositConfig> {
    const res = await apiClient.put<any>('/financial/deposit-config', {
      enabled: Boolean(config.enabled),
      type: config.type || 'percentage',
      value: Number(config.value || 30),
    });
    return {
      enabled: Boolean(res.enabled),
      type: res.type || 'percentage',
      value: Number(res.value || 30),
      require_pix_receipt: true,
      instructions: 'Para confirmar seu agendamento, realize o pagamento do sinal via Pix.',
    };
  },
};
