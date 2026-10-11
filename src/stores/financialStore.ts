import { create } from 'zustand';
import {
  Receivable,
  Payable,
  Supplier,
  Merchandise,
  PaymentSetting,
  DepositConfig,
  CashFlowEntry,
  CommissionSummary,
  FinancialPeriod,
  ReceivableStatus,
  PayableStatus,
  PayableCategory,
  PaymentMethod,
} from '../types/financeiro';
import { getTodayDateString } from '../services/mockData';
import { useProfessionalStore } from './professionalStore';
import { financialApiService } from '../services/api/financialService';
import { isSupabaseConfigured } from '../services/supabase';
import { useAuthStore } from './authStore';

const STORAGE_KEY = 'agenda_ai_financial_v2';

// Clear legacy v1 mock cache if present safely
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('agenda_ai_financial_v1');
  }
} catch (_) {}

// Initial clean data without fictitious mock records
const getInitialReceivables = (): Receivable[] => [];
const getInitialPayables = (): Payable[] => [];
const getInitialSuppliers = (): Supplier[] => [];
const getInitialMerchandise = (): Merchandise[] => [];

const getInitialPaymentSettings = (): PaymentSetting[] => [
  {
    id: 'pay-set-1',
    method: 'pix',
    name: 'Pix Instantâneo',
    enabled: true,
    operator_fee_percentage: 0,
    settlement_days: 0,
  },
  {
    id: 'pay-set-2',
    method: 'dinheiro',
    name: 'Dinheiro em Espécie',
    enabled: true,
    operator_fee_percentage: 0,
    settlement_days: 0,
  },
  {
    id: 'pay-set-3',
    method: 'debito',
    name: 'Cartão de Débito',
    enabled: true,
    operator_fee_percentage: 1.49,
    settlement_days: 1,
  },
  {
    id: 'pay-set-4',
    method: 'credito',
    name: 'Cartão de Crédito',
    enabled: true,
    operator_fee_percentage: 3.19,
    settlement_days: 30,
    max_installments: 12,
    installments_fee_step: 0.99,
  },
  {
    id: 'pay-set-5',
    method: 'transferencia',
    name: 'Transferência / TED',
    enabled: true,
    operator_fee_percentage: 0,
    settlement_days: 0,
  },
  {
    id: 'pay-set-6',
    method: 'boleto',
    name: 'Boleto Bancário',
    enabled: true,
    operator_fee_percentage: 2.5,
    settlement_days: 2,
  },
];

const getInitialDepositConfig = (): DepositConfig => ({
  enabled: false,
  type: 'percentage',
  value: 30,
  require_pix_receipt: true,
  instructions:
    'Para confirmar seu agendamento, solicitamos um sinal via Pix. O restante do valor é acertado no dia do atendimento.',
});

interface FinancialState {
  receivables: Receivable[];
  payables: Payable[];
  suppliers: Supplier[];
  merchandise: Merchandise[];
  paymentSettings: PaymentSetting[];
  depositConfig: DepositConfig;
  activePeriod: FinancialPeriod;

  // Actions
  setActivePeriod: (period: FinancialPeriod) => void;

  // Receivables (Contas a Receber)
  addReceivable: (receivable: Omit<Receivable, 'id' | 'created_at'>) => Receivable;
  updateReceivable: (id: string, data: Partial<Receivable>) => void;
  markReceivablePaid: (id: string, method?: PaymentMethod) => void;
  deleteReceivable: (id: string) => void;

  // Payables (Contas a Pagar)
  addPayable: (payable: Omit<Payable, 'id' | 'created_at'>) => Payable;
  updatePayable: (id: string, data: Partial<Payable>) => void;
  markPayablePaid: (id: string, method?: PaymentMethod) => void;
  deletePayable: (id: string) => void;

  // Suppliers (Fornecedores & Transportadoras)
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Merchandise (Controle de Mercadorias & Estoque)
  addMerchandise: (merchandise: Omit<Merchandise, 'id' | 'created_at' | 'total_cost'>) => Merchandise;
  updateMerchandise: (id: string, data: Partial<Merchandise>) => void;
  adjustStock: (id: string, delta: number) => void;
  deleteMerchandise: (id: string) => void;

  // Settings
  updatePaymentSetting: (id: string, data: Partial<PaymentSetting>) => void;
  updateDepositConfig: (data: Partial<DepositConfig>) => void;

  // Commissions
  payCommission: (professionalId: string, professionalName: string, amount: number) => void;

  // Analytics Helpers
  getFinancialKPIs: (period?: FinancialPeriod) => {
    totalRevenue: number;
    receivedRevenue: number;
    pendingReceivable: number;
    overdueReceivable: number;
    totalExpenses: number;
    paidExpenses: number;
    pendingExpenses: number;
    netProfit: number;
    overdueBillsCount: number;
    averageTicket: number;
    paidAppointmentsCount: number;
    pendingAppointmentsCount: number;
  };

  clearAllFinancialData: () => void;
  getCashFlowEntries: (period?: FinancialPeriod) => CashFlowEntry[];
  getCommissionSummaries: () => CommissionSummary[];
}

export const useFinancialStore = create<FinancialState>((set, get) => {
  // Load saved state or default
  let savedData: any = null;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) savedData = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Erro ao ler estado financeiro:', e);
  }

  const initialReceivables = Array.isArray(savedData?.receivables) ? savedData.receivables : getInitialReceivables();
  const initialPayables = Array.isArray(savedData?.payables) ? savedData.payables : getInitialPayables();
  const initialSuppliers = Array.isArray(savedData?.suppliers) ? savedData.suppliers : getInitialSuppliers();
  const initialMerchandise = Array.isArray(savedData?.merchandise) ? savedData.merchandise : getInitialMerchandise();
  const initialPaymentSettings = savedData?.paymentSettings || getInitialPaymentSettings();
  const initialDepositConfig = savedData?.depositConfig || getInitialDepositConfig();

  const persist = (data: Partial<FinancialState>) => {
    const current = get();
    const toSave = {
      receivables: data.receivables !== undefined ? data.receivables : current.receivables,
      payables: data.payables !== undefined ? data.payables : current.payables,
      suppliers: data.suppliers !== undefined ? data.suppliers : current.suppliers,
      merchandise: data.merchandise !== undefined ? data.merchandise : current.merchandise,
      paymentSettings: data.paymentSettings || current.paymentSettings,
      depositConfig: data.depositConfig || current.depositConfig,
    };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      }
    } catch (e) {
      console.error('Erro ao salvar estado financeiro:', e);
    }
  };

  return {
    receivables: initialReceivables,
    payables: initialPayables,
    suppliers: initialSuppliers,
    merchandise: initialMerchandise,
    paymentSettings: initialPaymentSettings,
    depositConfig: initialDepositConfig,
    activePeriod: 'month',

    setActivePeriod: (period) => set({ activePeriod: period }),

    clearAllFinancialData: () => {
      const emptyState = {
        receivables: [],
        payables: [],
        suppliers: [],
        merchandise: [],
      };
      persist(emptyState);
      set(emptyState);
    },

    // Receivables
    addReceivable: (data) => {
      const now = new Date().toISOString();
      const newRec: Receivable = {
        ...data,
        id: `rec-${Date.now()}`,
        created_at: now,
      };
      const updated = [newRec, ...get().receivables];
      persist({ receivables: updated });
      set({ receivables: updated });

      if (isSupabaseConfigured()) {
        const tenantId = useAuthStore.getState().tenant?.id || 'tenant-1';
        financialApiService.createReceivable(data, tenantId).catch((err) => {
          console.warn('Sync criação de recebível no Supabase:', err);
        });
      }

      return newRec;
    },

    updateReceivable: (id, data) => {
      const updated = get().receivables.map((r) => (r.id === id ? { ...r, ...data } : r));
      persist({ receivables: updated });
      set({ receivables: updated });

      if (isSupabaseConfigured()) {
        financialApiService.updateReceivable(id, data).catch((err) => {
          console.warn('Sync atualização de recebível no Supabase:', err);
        });
      }
    },

    markReceivablePaid: (id, method) => {
      const today = getTodayDateString();
      const rec = get().receivables.find((r) => r.id === id);
      const paymentMethod = method || rec?.payment_method || 'pix';
      const updated = get().receivables.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: 'paid' as ReceivableStatus,
            amount_paid: r.final_amount,
            paid_at: today,
            payment_method: paymentMethod,
          };
        }
        return r;
      });
      persist({ receivables: updated });
      set({ receivables: updated });

      if (isSupabaseConfigured() && rec) {
        financialApiService.updateReceivable(id, {
          status: 'paid',
          amount_paid: rec.final_amount,
          paid_at: today,
          payment_method: paymentMethod,
        }).catch((err) => {
          console.warn('Sync baixa de recebível no Supabase:', err);
        });
      }
    },

    deleteReceivable: (id) => {
      const updated = get().receivables.filter((r) => r.id !== id);
      persist({ receivables: updated });
      set({ receivables: updated });

      if (isSupabaseConfigured()) {
        financialApiService.deleteReceivable(id).catch((err) => {
          console.warn('Sync exclusão de recebível no Supabase:', err);
        });
      }
    },

    // Payables
    addPayable: (data) => {
      const now = new Date().toISOString();
      const newPay: Payable = {
        ...data,
        id: `pay-${Date.now()}`,
        created_at: now,
      };
      const updated = [newPay, ...get().payables];
      persist({ payables: updated });
      set({ payables: updated });

      if (isSupabaseConfigured()) {
        const tenantId = useAuthStore.getState().tenant?.id || 'tenant-1';
        financialApiService.createPayable(data, tenantId).catch((err) => {
          console.warn('Sync criação de conta a pagar no Supabase:', err);
        });
      }

      return newPay;
    },

    updatePayable: (id, data) => {
      const updated = get().payables.map((p) => (p.id === id ? { ...p, ...data } : p));
      persist({ payables: updated });
      set({ payables: updated });

      if (isSupabaseConfigured()) {
        financialApiService.updatePayable(id, data).catch((err) => {
          console.warn('Sync atualização de conta a pagar no Supabase:', err);
        });
      }
    },

    markPayablePaid: (id, method) => {
      const today = getTodayDateString();
      const pay = get().payables.find((p) => p.id === id);
      const paymentMethod = method || pay?.payment_method || 'pix';
      const updated = get().payables.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status: 'paid' as PayableStatus,
            paid_amount: p.amount,
            paid_at: today,
            payment_method: paymentMethod,
          };
        }
        return p;
      });
      persist({ payables: updated });
      set({ payables: updated });

      if (isSupabaseConfigured() && pay) {
        financialApiService.updatePayable(id, {
          status: 'paid',
          paid_amount: pay.amount,
          paid_at: today,
          payment_method: paymentMethod,
        }).catch((err) => {
          console.warn('Sync baixa de conta a pagar no Supabase:', err);
        });
      }
    },

    deletePayable: (id) => {
      const updated = get().payables.filter((p) => p.id !== id);
      persist({ payables: updated });
      set({ payables: updated });

      if (isSupabaseConfigured()) {
        financialApiService.deletePayable(id).catch((err) => {
          console.warn('Sync exclusão de conta a pagar no Supabase:', err);
        });
      }
    },

    // Suppliers
    addSupplier: (data) => {
      const now = new Date().toISOString();
      const newSup: Supplier = {
        ...data,
        id: `sup-${Date.now()}`,
        created_at: now,
      };
      const updated = [newSup, ...get().suppliers];
      persist({ suppliers: updated });
      set({ suppliers: updated });
      return newSup;
    },

    updateSupplier: (id, data) => {
      const updated = get().suppliers.map((s) => (s.id === id ? { ...s, ...data } : s));
      persist({ suppliers: updated });
      set({ suppliers: updated });
    },

    deleteSupplier: (id) => {
      const updated = get().suppliers.filter((s) => s.id !== id);
      persist({ suppliers: updated });
      set({ suppliers: updated });
    },

    // Merchandise
    addMerchandise: (data) => {
      const now = new Date().toISOString();
      const total_cost = data.quantity * data.cost_price;
      const newMerch: Merchandise = {
        ...data,
        id: `merch-${Date.now()}`,
        total_cost,
        created_at: now,
      };
      const updated = [newMerch, ...get().merchandise];
      persist({ merchandise: updated });
      set({ merchandise: updated });
      return newMerch;
    },

    updateMerchandise: (id, data) => {
      const updated = get().merchandise.map((m) => {
        if (m.id === id) {
          const qty = data.quantity !== undefined ? data.quantity : m.quantity;
          const cost = data.cost_price !== undefined ? data.cost_price : m.cost_price;
          return {
            ...m,
            ...data,
            total_cost: qty * cost,
          };
        }
        return m;
      });
      persist({ merchandise: updated });
      set({ merchandise: updated });
    },

    adjustStock: (id, delta) => {
      const today = getTodayDateString();
      const updated = get().merchandise.map((m) => {
        if (m.id === id) {
          const newQty = Math.max(0, m.quantity + delta);
          return {
            ...m,
            quantity: newQty,
            total_cost: newQty * m.cost_price,
            last_restock_date: delta > 0 ? today : m.last_restock_date,
          };
        }
        return m;
      });
      persist({ merchandise: updated });
      set({ merchandise: updated });
    },

    deleteMerchandise: (id) => {
      const updated = get().merchandise.filter((m) => m.id !== id);
      persist({ merchandise: updated });
      set({ merchandise: updated });
    },

    // Settings
    updatePaymentSetting: (id, data) => {
      const updated = get().paymentSettings.map((s) => (s.id === id ? { ...s, ...data } : s));
      persist({ paymentSettings: updated });
      set({ paymentSettings: updated });
    },

    updateDepositConfig: (data) => {
      const updated = { ...get().depositConfig, ...data };
      persist({ depositConfig: updated });
      set({ depositConfig: updated });
    },

    // Commissions: Launches a paid commission entry in payables
    payCommission: (professionalId, professionalName, amount) => {
      const today = getTodayDateString();
      const newPayable: Payable = {
        id: `pay-com-${Date.now()}`,
        description: `Comissão — ${professionalName}`,
        category: 'comissoes',
        due_date: today,
        amount,
        paid_amount: amount,
        status: 'paid',
        payment_method: 'pix',
        paid_at: today,
        professional_id: professionalId,
        professional_name: professionalName,
        notes: `Pagamento integral de comissão gerada para ${professionalName}.`,
        created_at: today,
      };

      const updatedPayables = [newPayable, ...get().payables];
      persist({ payables: updatedPayables });
      set({ payables: updatedPayables });
    },

    // Analytics: KPIs calculation based on period
    getFinancialKPIs: (periodParam) => {
      const period = periodParam || get().activePeriod;
      const today = getTodayDateString();
      const receivables = get().receivables;
      const payables = get().payables;

      // Filter by period
      const isDateInPeriod = (dateStr: string) => {
        if (!dateStr || period === 'all') return true;
        const target = new Date(dateStr);
        const curr = new Date(today);

        if (period === 'today') {
          return dateStr === today;
        }
        if (period === 'week') {
          // within 7 days
          const diffDays = (curr.getTime() - target.getTime()) / (1000 * 3600 * 24);
          return diffDays >= -1 && diffDays <= 7;
        }
        if (period === 'month') {
          return (
            target.getFullYear() === curr.getFullYear() &&
            target.getMonth() === curr.getMonth()
          );
        }
        if (period === 'next_month') {
          const nextM = (curr.getMonth() + 1) % 12;
          return target.getMonth() === nextM;
        }
        return true;
      };

      const filteredRec = receivables.filter((r) => isDateInPeriod(r.due_date));
      const filteredPay = payables.filter((p) => isDateInPeriod(p.due_date));

      const totalRevenue = filteredRec
        .filter((r) => r.status !== 'cancelled')
        .reduce((sum, r) => sum + r.final_amount, 0);

      const receivedRevenue = filteredRec
        .filter((r) => r.status === 'paid' || r.status === 'partially_paid')
        .reduce((sum, r) => sum + r.amount_paid, 0);

      const pendingReceivable = filteredRec
        .filter((r) => r.status === 'pending' || r.status === 'partially_paid')
        .reduce((sum, r) => sum + (r.final_amount - r.amount_paid), 0);

      const overdueReceivable = filteredRec
        .filter((r) => r.status === 'overdue')
        .reduce((sum, r) => sum + (r.final_amount - r.amount_paid), 0);

      const totalExpenses = filteredPay
        .filter((p) => p.status !== 'cancelled')
        .reduce((sum, p) => sum + p.amount, 0);

      const paidExpenses = filteredPay
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + (p.paid_amount || p.amount), 0);

      const pendingExpenses = filteredPay
        .filter((p) => p.status === 'pending' || p.status === 'overdue')
        .reduce((sum, p) => sum + (p.amount - (p.paid_amount || 0)), 0);

      const netProfit = receivedRevenue - paidExpenses;

      const overdueBillsCount = filteredPay.filter(
        (p) => p.status === 'overdue' || (p.status === 'pending' && p.due_date < today)
      ).length;

      const paidRecList = filteredRec.filter((r) => r.status === 'paid');
      const paidAppointmentsCount = paidRecList.length;
      const pendingAppointmentsCount = filteredRec.filter(
        (r) => r.status === 'pending' || r.status === 'partially_paid' || r.status === 'overdue'
      ).length;

      const averageTicket =
        paidAppointmentsCount > 0
          ? Math.round(receivedRevenue / paidAppointmentsCount)
          : totalRevenue > 0
          ? Math.round(totalRevenue / (filteredRec.length || 1))
          : 0;

      return {
        totalRevenue,
        receivedRevenue,
        pendingReceivable,
        overdueReceivable,
        totalExpenses,
        paidExpenses,
        pendingExpenses,
        netProfit,
        overdueBillsCount,
        averageTicket,
        paidAppointmentsCount,
        pendingAppointmentsCount,
      };
    },

    // Cash flow timeline entries
    getCashFlowEntries: (periodParam) => {
      const receivables = get().receivables;
      const payables = get().payables;

      const entries: CashFlowEntry[] = [];

      // Paid receivables -> Incomes
      receivables
        .filter((r) => r.status === 'paid' || (r.status === 'partially_paid' && r.amount_paid > 0))
        .forEach((r) => {
          entries.push({
            id: `flow-in-${r.id}`,
            date: r.paid_at || r.due_date,
            description: `${r.customer_name} — ${r.service_name || r.description}`,
            type: 'income',
            category: 'Atendimentos & Serviços',
            amount: r.amount_paid || r.final_amount,
            balance_after: 0,
            payment_method: r.payment_method,
            reference_id: r.id,
            reference_type: 'receivable',
          });
        });

      // Paid payables -> Expenses
      payables
        .filter((p) => p.status === 'paid')
        .forEach((p) => {
          entries.push({
            id: `flow-out-${p.id}`,
            date: p.paid_at || p.due_date,
            description: p.description,
            type: 'expense',
            category: p.category.toUpperCase(),
            amount: p.paid_amount || p.amount,
            balance_after: 0,
            payment_method: p.payment_method || 'pix',
            reference_id: p.id,
            reference_type: 'payable',
          });
        });

      // Sort chronologically ascending to compute progressive balance
      entries.sort((a, b) => a.date.localeCompare(b.date));

      let currentBalance = 0; // Saldo inicial real
      entries.forEach((entry) => {
        if (entry.type === 'income') {
          currentBalance += entry.amount;
        } else {
          currentBalance -= entry.amount;
        }
        entry.balance_after = currentBalance;
      });

      // Return descending for list presentation
      return entries.reverse();
    },

    // Professional commission summary calculation
    getCommissionSummaries: () => {
      const receivables = get().receivables;
      const payables = get().payables;
      const registeredProfessionals = useProfessionalStore.getState().professionals;

      // Group receivables by professional
      const profMap: Record<
        string,
        {
          id: string;
          name: string;
          role: string;
          count: number;
          revenue: number;
          rate: number;
        }
      > = {};

      // Seed with actually registered professionals in the system
      registeredProfessionals.forEach((p) => {
        profMap[p.name] = {
          id: p.id,
          name: p.name,
          role: p.specialties?.join(', ') || 'Profissional',
          count: 0,
          revenue: 0,
          rate: p.commission_percentage ?? 35,
        };
      });

      // Add or accumulate from paid receivables
      receivables
        .filter((r) => r.status === 'paid' && r.professional_name)
        .forEach((r) => {
          const pName = r.professional_name!;
          if (!profMap[pName]) {
            profMap[pName] = {
              id: `pro-${pName.toLowerCase().replace(/\s+/g, '-')}`,
              name: pName,
              role: 'Profissional',
              count: 0,
              revenue: 0,
              rate: 35,
            };
          }
          profMap[pName].count += 1;
          profMap[pName].revenue += r.final_amount;
        });

      // Calculate paid commissions in payables
      const paidByProf: Record<string, number> = {};
      payables
        .filter((p) => p.category === 'comissoes' && p.status === 'paid')
        .forEach((p) => {
          if (p.professional_name) {
            paidByProf[p.professional_name] =
              (paidByProf[p.professional_name] || 0) + (p.paid_amount || p.amount);
          }
        });

      return Object.values(profMap).map((data) => {
        const generated = Math.round((data.revenue * data.rate) / 100);
        const paid = paidByProf[data.name] || 0;
        const pending = Math.max(0, generated - paid);

        return {
          professional_id: data.id,
          professional_name: data.name,
          role: data.role,
          appointments_count: data.count,
          total_revenue: data.revenue,
          commission_percentage: data.rate,
          commission_generated: generated,
          commission_paid: paid,
          commission_pending: pending,
        };
      });
    },
  };
});
