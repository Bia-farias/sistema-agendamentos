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
import { isDateInFinancialPeriod } from '../utils/financialPeriod';
import { CashFlowSummary, computeCashFlowSummary } from '../utils/cashFlow';

const STORAGE_KEY = 'agenda_ai_financial_v2';

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
  isLoading: boolean;

  // Actions
  fetchFinancialData: () => Promise<void>;
  setActivePeriod: (period: FinancialPeriod) => void;

  // Receivables (Contas a Receber)
  addReceivable: (receivable: Omit<Receivable, 'id' | 'created_at'>) => Promise<Receivable>;
  updateReceivable: (id: string, data: Partial<Receivable>) => Promise<void>;
  markReceivablePaid: (id: string, method?: PaymentMethod) => Promise<void>;
  deleteReceivable: (id: string) => Promise<void>;

  // Payables (Contas a Pagar)
  addPayable: (payable: Omit<Payable, 'id' | 'created_at'>) => Promise<Payable>;
  updatePayable: (id: string, data: Partial<Payable>) => Promise<void>;
  markPayablePaid: (id: string, method?: PaymentMethod) => Promise<void>;
  deletePayable: (id: string) => Promise<void>;

  // Suppliers (Fornecedores & Transportadoras)
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at'>) => Promise<Supplier>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  // Merchandise (Controle de Mercadorias & Estoque)
  addMerchandise: (merchandise: Omit<Merchandise, 'id' | 'created_at' | 'total_cost'>) => Promise<Merchandise>;
  updateMerchandise: (id: string, data: Partial<Merchandise>) => Promise<void>;
  adjustStock: (id: string, delta: number) => Promise<void>;
  deleteMerchandise: (id: string) => Promise<void>;

  // Settings
  updatePaymentSetting: (id: string, data: Partial<PaymentSetting>) => void;
  updateDepositConfig: (data: Partial<DepositConfig>) => Promise<void>;

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
  getCashFlowSummary: (period?: FinancialPeriod) => CashFlowSummary;
  getCommissionSummaries: () => CommissionSummary[];
}

export const useFinancialStore = create<FinancialState>((set, get) => {
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
    isLoading: false,

    fetchFinancialData: async () => {
      set({ isLoading: true });
      try {
        const [recRes, payRes, supRes, merchRes, depositRes] = await Promise.allSettled([
          financialApiService.getReceivables(),
          financialApiService.getPayables(),
          financialApiService.getSuppliers(),
          financialApiService.getMerchandise(),
          financialApiService.getDepositConfig(),
        ]);

        const nextState: Partial<FinancialState> = { isLoading: false };

        if (recRes.status === 'fulfilled' && recRes.value && recRes.value.length > 0) {
          nextState.receivables = recRes.value;
        }
        if (payRes.status === 'fulfilled' && payRes.value && payRes.value.length > 0) {
          nextState.payables = payRes.value;
        }
        if (supRes.status === 'fulfilled' && supRes.value && supRes.value.length > 0) {
          nextState.suppliers = supRes.value;
        }
        if (merchRes.status === 'fulfilled' && merchRes.value && merchRes.value.length > 0) {
          nextState.merchandise = merchRes.value;
        }
        if (depositRes.status === 'fulfilled' && depositRes.value) {
          nextState.depositConfig = depositRes.value;
        }

        persist(nextState);
        set(nextState);
      } catch (err) {
        console.warn('Falha ao sincronizar dados financeiros da API:', err);
        set({ isLoading: false });
      }
    },

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
    addReceivable: async (data) => {
      const now = new Date().toISOString();
      try {
        const created = await financialApiService.createReceivable(data);
        const updated = [created, ...get().receivables.filter((r) => r.id !== created.id)];
        persist({ receivables: updated });
        set({ receivables: updated });
        return created;
      } catch (err) {
        console.warn('Erro ao salvar recebível na API, salvando localmente:', err);
        const fallback: Receivable = {
          ...data,
          id: crypto.randomUUID(),
          created_at: now,
        };
        const updated = [fallback, ...get().receivables];
        persist({ receivables: updated });
        set({ receivables: updated });
        return fallback;
      }
    },

    updateReceivable: async (id, data) => {
      const updated = get().receivables.map((r) => (r.id === id ? { ...r, ...data } : r));
      persist({ receivables: updated });
      set({ receivables: updated });

      try {
        await financialApiService.updateReceivable(id, data);
      } catch (err) {
        console.warn('Sync atualização recebível API:', err);
      }
    },

    markReceivablePaid: async (id, method) => {
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

      try {
        await financialApiService.markReceivablePaid(id, paymentMethod, today);
      } catch (err) {
        console.warn('Sync baixa de recebível API:', err);
      }
    },

    deleteReceivable: async (id) => {
      const updated = get().receivables.filter((r) => r.id !== id);
      persist({ receivables: updated });
      set({ receivables: updated });

      try {
        await financialApiService.deleteReceivable(id);
      } catch (err) {
        console.warn('Sync exclusão recebível API:', err);
      }
    },

    // Payables
    addPayable: async (data) => {
      const now = new Date().toISOString();
      try {
        const created = await financialApiService.createPayable(data);
        const updated = [created, ...get().payables.filter((p) => p.id !== created.id)];
        persist({ payables: updated });
        set({ payables: updated });
        return created;
      } catch (err) {
        console.warn('Erro ao salvar despesa na API, salvando localmente:', err);
        const fallback: Payable = {
          ...data,
          id: crypto.randomUUID(),
          created_at: now,
        };
        const updated = [fallback, ...get().payables];
        persist({ payables: updated });
        set({ payables: updated });
        return fallback;
      }
    },

    updatePayable: async (id, data) => {
      const updated = get().payables.map((p) => (p.id === id ? { ...p, ...data } : p));
      persist({ payables: updated });
      set({ payables: updated });

      try {
        await financialApiService.updatePayable(id, data);
      } catch (err) {
        console.warn('Sync atualização despesa API:', err);
      }
    },

    markPayablePaid: async (id, method) => {
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

      try {
        await financialApiService.markPayablePaid(id, pay?.amount, paymentMethod, today);
      } catch (err) {
        console.warn('Sync baixa de despesa API:', err);
      }
    },

    deletePayable: async (id) => {
      const updated = get().payables.filter((p) => p.id !== id);
      persist({ payables: updated });
      set({ payables: updated });

      try {
        await financialApiService.deletePayable(id);
      } catch (err) {
        console.warn('Sync exclusão despesa API:', err);
      }
    },

    // Suppliers
    addSupplier: async (data) => {
      const now = new Date().toISOString();
      try {
        const created = await financialApiService.createSupplier(data);
        const updated = [created, ...get().suppliers.filter((s) => s.id !== created.id)];
        persist({ suppliers: updated });
        set({ suppliers: updated });
        return created;
      } catch (err) {
        console.warn('Erro ao salvar fornecedor na API, salvando localmente:', err);
        const fallback: Supplier = {
          ...data,
          id: crypto.randomUUID(),
          created_at: now,
        };
        const updated = [fallback, ...get().suppliers];
        persist({ suppliers: updated });
        set({ suppliers: updated });
        return fallback;
      }
    },

    updateSupplier: async (id, data) => {
      const updated = get().suppliers.map((s) => (s.id === id ? { ...s, ...data } : s));
      persist({ suppliers: updated });
      set({ suppliers: updated });

      try {
        await financialApiService.updateSupplier(id, data);
      } catch (err) {
        console.warn('Sync atualização fornecedor API:', err);
      }
    },

    deleteSupplier: async (id) => {
      const updated = get().suppliers.filter((s) => s.id !== id);
      persist({ suppliers: updated });
      set({ suppliers: updated });

      try {
        await financialApiService.deleteSupplier(id);
      } catch (err) {
        console.warn('Sync exclusão fornecedor API:', err);
      }
    },

    // Merchandise
    addMerchandise: async (data) => {
      const now = new Date().toISOString();
      try {
        const created = await financialApiService.createMerchandise(data);
        const updated = [created, ...get().merchandise.filter((m) => m.id !== created.id)];
        persist({ merchandise: updated });
        set({ merchandise: updated });
        return created;
      } catch (err) {
        console.warn('Erro ao salvar produto na API, salvando localmente:', err);
        const total_cost = data.quantity * data.cost_price;
        const fallback: Merchandise = {
          ...data,
          id: crypto.randomUUID(),
          total_cost,
          created_at: now,
        };
        const updated = [fallback, ...get().merchandise];
        persist({ merchandise: updated });
        set({ merchandise: updated });
        return fallback;
      }
    },

    updateMerchandise: async (id, data) => {
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

    adjustStock: async (id, delta) => {
      const today = getTodayDateString();
      const target = get().merchandise.find((m) => m.id === id);
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

      if (target) {
        try {
          const type = delta > 0 ? 'entry' : 'exit';
          await financialApiService.adjustStock(id, type, Math.abs(delta));
        } catch (err) {
          console.warn('Sync ajuste de estoque API:', err);
        }
      }
    },

    deleteMerchandise: async (id) => {
      const updated = get().merchandise.filter((m) => m.id !== id);
      persist({ merchandise: updated });
      set({ merchandise: updated });

      try {
        await financialApiService.deleteMerchandise(id);
      } catch (err) {
        console.warn('Sync exclusão produto API:', err);
      }
    },

    // Settings
    updatePaymentSetting: (id, data) => {
      const updated = get().paymentSettings.map((s) => (s.id === id ? { ...s, ...data } : s));
      persist({ paymentSettings: updated });
      set({ paymentSettings: updated });
    },

    updateDepositConfig: async (data) => {
      const updated = { ...get().depositConfig, ...data };
      persist({ depositConfig: updated });
      set({ depositConfig: updated });

      try {
        await financialApiService.updateDepositConfig(data);
      } catch (err) {
        console.warn('Sync configuração sinal API:', err);
      }
    },

    // Commissions: Launches a paid commission entry in payables
    payCommission: (professionalId, professionalName, amount) => {
      const today = getTodayDateString();
      const newPayable: Payable = {
        id: crypto.randomUUID(),
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

      financialApiService.createPayable({
        description: newPayable.description,
        category: newPayable.category,
        amount: newPayable.amount,
        paid_amount: newPayable.paid_amount,
        due_date: newPayable.due_date,
        paid_at: newPayable.paid_at,
        status: newPayable.status,
        professional_id: professionalId,
        professional_name: professionalName,
        payment_method: newPayable.payment_method,
        notes: newPayable.notes,
      }).catch((err) => {
        console.warn('Sync comissão em contas a pagar API:', err);
      });
    },

    // Analytics: KPIs calculation based on period
    getFinancialKPIs: (periodParam) => {
      const period = periodParam || get().activePeriod;
      const today = getTodayDateString();
      const receivables = get().receivables;
      const payables = get().payables;

      const filteredRec = receivables.filter((r) => isDateInFinancialPeriod(r.due_date, period, today));
      const filteredPay = payables.filter((p) => isDateInFinancialPeriod(p.due_date, period, today));

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

    // Cash flow timeline entries (ordered newest first, with cumulative running balance)
    getCashFlowEntries: (periodParam) => {
      return get().getCashFlowSummary(periodParam).entries;
    },

    // Consolidated Cash Flow summary + statement for a period
    getCashFlowSummary: (periodParam) => {
      const period = periodParam || get().activePeriod;
      const today = getTodayDateString();
      return computeCashFlowSummary(get().receivables, get().payables, period, today);
    },

    getCommissionSummaries: () => {
      const receivables = get().receivables;
      const payables = get().payables;
      const registeredProfessionals = useProfessionalStore.getState().professionals;

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
