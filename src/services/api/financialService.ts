import { supabase, isSupabaseConfigured } from '../supabase';
import { Receivable, Payable, Supplier, Merchandise, DepositConfig } from '../../types/financeiro';

export const financialApiService = {
  // Receivables (Contas a Receber)
  async getReceivables(tenantId: string): Promise<Receivable[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('financial_receivables')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar recebíveis do Supabase:', error);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      appointment_id: r.appointment_id || undefined,
      customer_id: r.customer_id || undefined,
      customer_name: r.customer_name,
      customer_phone: r.customer_phone || undefined,
      service_name: r.service_name || undefined,
      professional_name: r.professional_name || undefined,
      description: r.description,
      original_amount: Number(r.original_amount),
      discount: Number(r.discount || 0),
      surcharge: Number(r.surcharge || 0),
      final_amount: Number(r.final_amount),
      amount_paid: Number(r.amount_paid || 0),
      payment_method: r.payment_method || 'pix',
      due_date: r.due_date,
      paid_at: r.paid_at || undefined,
      status: r.status,
      has_signal: Boolean(r.has_signal),
      notes: r.notes || undefined,
      created_at: r.created_at,
    }));
  },

  async createReceivable(receivable: Omit<Receivable, 'id' | 'created_at'>, tenantId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase.from('financial_receivables').insert({
      tenant_id: tenantId,
      appointment_id: receivable.appointment_id || null,
      customer_id: receivable.customer_id || null,
      customer_name: receivable.customer_name,
      customer_phone: receivable.customer_phone || null,
      service_name: receivable.service_name || null,
      professional_name: receivable.professional_name || null,
      description: receivable.description,
      original_amount: receivable.original_amount,
      discount: receivable.discount || 0,
      surcharge: receivable.surcharge || 0,
      final_amount: receivable.final_amount,
      amount_paid: receivable.amount_paid || 0,
      payment_method: receivable.payment_method,
      due_date: receivable.due_date,
      paid_at: receivable.paid_at || null,
      status: receivable.status,
      has_signal: receivable.has_signal || false,
      notes: receivable.notes || null,
    });

    if (error) {
      console.warn('Erro ao salvar recebível no Supabase:', error);
    }
  },

  async updateReceivable(id: string, updates: Partial<Receivable>): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('financial_receivables')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.warn('Erro ao atualizar recebível no Supabase:', error);
    }
  },

  async deleteReceivable(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('financial_receivables')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Erro ao excluir recebível no Supabase:', error);
    }
  },

  // Payables (Contas a Pagar)
  async getPayables(tenantId: string): Promise<Payable[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('financial_payables')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar despesas do Supabase:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      description: p.description,
      category: p.category,
      amount: Number(p.amount),
      paid_amount: Number(p.paid_amount || 0),
      due_date: p.due_date,
      paid_at: p.paid_at || undefined,
      status: p.status,
      supplier_name: p.supplier_name || undefined,
      professional_name: p.professional_name || undefined,
      payment_method: p.payment_method || undefined,
      is_recurring: Boolean(p.is_recurring),
      recurrence_type: p.recurrence_type || undefined,
      notes: p.notes || undefined,
      created_at: p.created_at,
    }));
  },

  async createPayable(payable: Omit<Payable, 'id' | 'created_at'>, tenantId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase.from('financial_payables').insert({
      tenant_id: tenantId,
      description: payable.description,
      category: payable.category,
      amount: payable.amount,
      paid_amount: payable.paid_amount || 0,
      due_date: payable.due_date,
      paid_at: payable.paid_at || null,
      status: payable.status,
      supplier_name: payable.supplier_name || null,
      professional_name: payable.professional_name || null,
      payment_method: payable.payment_method || null,
      is_recurring: payable.is_recurring || false,
      recurrence_type: payable.recurrence_type || null,
      notes: payable.notes || null,
    });

    if (error) {
      console.warn('Erro ao salvar despesa no Supabase:', error);
    }
  },

  async updatePayable(id: string, updates: Partial<Payable>): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('financial_payables')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.warn('Erro ao atualizar despesa no Supabase:', error);
    }
  },

  async deletePayable(id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from('financial_payables')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Erro ao excluir despesa no Supabase:', error);
    }
  },
};
