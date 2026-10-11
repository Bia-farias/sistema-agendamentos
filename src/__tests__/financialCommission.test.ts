import { describe, it, expect } from 'vitest';
import { Receivable, Payable } from '../types/financeiro';

/**
 * Lógica do cálculo de comissão consolidada por profissional
 */
function calculateProfessionalCommission(
  professionalName: string,
  commissionRate: number,
  receivables: Receivable[],
  payables: Payable[]
) {
  // 1. Receitas recebidas (status === 'paid')
  const paidReceivables = receivables.filter(
    (r) => r.status === 'paid' && r.professional_name === professionalName
  );

  const totalRevenue = paidReceivables.reduce((sum, r) => sum + r.final_amount, 0);
  const appointmentsCount = paidReceivables.length;

  // 2. Comissão bruta gerada
  const commissionGenerated = Math.round((totalRevenue * commissionRate) / 100);

  // 3. Comissões já repassadas / pagas registradas no contas a pagar
  const paidCommissions = payables
    .filter((p) => p.category === 'comissoes' && p.status === 'paid' && p.professional_name === professionalName)
    .reduce((sum, p) => sum + (p.paid_amount || p.amount), 0);

  const commissionPending = Math.max(0, commissionGenerated - paidCommissions);

  return {
    appointmentsCount,
    totalRevenue,
    commissionRate,
    commissionGenerated,
    paidCommissions,
    commissionPending,
  };
}

describe('Regras Financeiras: Cálculo e Repasse de Comissões', () => {
  const dummyReceivables: Receivable[] = [
    {
      id: 'rec-1',
      customer_name: 'Lucas Mendes',
      customer_phone: '11999998888',
      service_name: 'Corte Degradê',
      professional_name: 'Camila Silva',
      description: 'Atendimento Corte',
      original_amount: 80,
      discount: 0,
      surcharge: 0,
      final_amount: 80,
      amount_paid: 80,
      payment_method: 'pix',
      due_date: '2026-10-15',
      paid_at: '2026-10-15',
      status: 'paid',
      has_signal: false,
      created_at: '2026-10-15T10:00:00Z',
    },
    {
      id: 'rec-2',
      customer_name: 'Juliana Paes',
      customer_phone: '11988887777',
      service_name: 'Escova & Hidratação',
      professional_name: 'Camila Silva',
      description: 'Atendimento Escova',
      original_amount: 120,
      discount: 0,
      surcharge: 0,
      final_amount: 120,
      amount_paid: 120,
      payment_method: 'credito',
      due_date: '2026-10-15',
      paid_at: '2026-10-15',
      status: 'paid',
      has_signal: false,
      created_at: '2026-10-15T11:00:00Z',
    },
    {
      id: 'rec-3',
      customer_name: 'Felipe Santos',
      customer_phone: '11977776666',
      service_name: 'Barba Terapia',
      professional_name: 'Camila Silva',
      description: 'Atendimento Barba',
      original_amount: 60,
      discount: 0,
      surcharge: 0,
      final_amount: 60,
      amount_paid: 0,
      payment_method: 'pix',
      due_date: '2026-10-16',
      status: 'pending', // NÃO pago ainda
      has_signal: false,
      created_at: '2026-10-15T12:00:00Z',
    },
    {
      id: 'rec-4',
      customer_name: 'Carlos Alberto',
      customer_phone: '11966665555',
      service_name: 'Corte Clássico',
      professional_name: 'Camila Silva',
      description: 'Atendimento Cancelado',
      original_amount: 80,
      discount: 0,
      surcharge: 0,
      final_amount: 80,
      amount_paid: 0,
      payment_method: 'pix',
      due_date: '2026-10-16',
      status: 'cancelled', // Cancelado
      has_signal: false,
      created_at: '2026-10-15T13:00:00Z',
    },
  ];

  it('deve calcular a comissão apenas sobre recebíveis com status "paid"', () => {
    // 80 + 120 = 200 de receita paga (desconsiderando pendente de 60 e cancelado de 80)
    // 35% de 200 = 70
    const result = calculateProfessionalCommission('Camila Silva', 35, dummyReceivables, []);

    expect(result.appointmentsCount).toBe(2);
    expect(result.totalRevenue).toBe(200);
    expect(result.commissionGenerated).toBe(70);
    expect(result.commissionPending).toBe(70);
  });

  it('deve abater comissões já pagas no Contas a Pagar', () => {
    const payables: Payable[] = [
      {
        id: 'pay-1',
        description: 'Repasse adiantamento comissão',
        category: 'comissoes',
        amount: 30,
        paid_amount: 30,
        status: 'paid',
        payment_method: 'pix',
        due_date: '2026-10-15',
        paid_at: '2026-10-15',
        professional_name: 'Camila Silva',
        created_at: '2026-10-15T12:00:00Z',
      },
    ];

    const result = calculateProfessionalCommission('Camila Silva', 35, dummyReceivables, payables);

    expect(result.commissionGenerated).toBe(70);
    expect(result.paidCommissions).toBe(30);
    expect(result.commissionPending).toBe(40); // 70 - 30 = 40 pendente
  });

  it('deve suportar percentuais personalizados por profissional (ex: 50%)', () => {
    const result = calculateProfessionalCommission('Camila Silva', 50, dummyReceivables, []);

    expect(result.totalRevenue).toBe(200);
    expect(result.commissionGenerated).toBe(100); // 50% de 200 = 100
  });
});
