import { describe, it, expect } from 'vitest';
import {
  isDateBeforeFinancialPeriod,
  isDateInFinancialPeriod,
} from '../utils/financialPeriod';
import { computeCashFlowSummary } from '../utils/cashFlow';
import { Payable, Receivable } from '../types/financeiro';
import financeiroRaw from '../pages/Financeiro.tsx?raw';
import dashboardRaw from '../pages/Dashboard.tsx?raw';

describe('Financial Period Helpers', () => {
  it('handles today, month, and next_month including December-to-January rollover', () => {
    const today = '2026-12-20';

    expect(isDateInFinancialPeriod('2026-12-20', 'today', today)).toBe(true);
    expect(isDateInFinancialPeriod('2026-12-19', 'today', today)).toBe(false);

    expect(isDateInFinancialPeriod('2026-12-01', 'month', today)).toBe(true);
    expect(isDateInFinancialPeriod('2027-01-05', 'month', today)).toBe(false);

    expect(isDateInFinancialPeriod('2027-01-10', 'next_month', today)).toBe(true);
    expect(isDateInFinancialPeriod('2026-01-10', 'next_month', today)).toBe(false);
  });

  it('correctly identifies dates strictly before period start for opening balance', () => {
    const today = '2026-11-11';

    expect(isDateBeforeFinancialPeriod('2026-11-10', 'today', today)).toBe(true);
    expect(isDateBeforeFinancialPeriod('2026-11-11', 'today', today)).toBe(false);

    expect(isDateBeforeFinancialPeriod('2026-10-31', 'month', today)).toBe(true);
    expect(isDateBeforeFinancialPeriod('2026-11-01', 'month', today)).toBe(false);
    expect(isDateBeforeFinancialPeriod('2026-10-15', 'all', today)).toBe(false);
  });
});

describe('Cash Flow Computation', () => {
  it('computes openingBalance, period totals, finalBalance, and running balance_after accurately', () => {
    const today = '2026-11-11';
    const receivables: Receivable[] = [
      {
        id: 'r-prev',
        customer_name: 'Ana Anterior',
        description: 'Corte',
        original_amount: 200,
        discount: 0,
        surcharge: 0,
        final_amount: 200,
        amount_paid: 200,
        payment_method: 'pix',
        due_date: '2026-10-20',
        paid_at: '2026-10-20',
        status: 'paid',
        has_signal: false,
        created_at: '2026-10-20',
      },
      {
        id: 'r-curr',
        customer_name: 'Maria Atual',
        description: 'Coloração',
        original_amount: 350,
        discount: 0,
        surcharge: 0,
        final_amount: 350,
        amount_paid: 350,
        payment_method: 'credito',
        due_date: '2026-11-10',
        paid_at: '2026-11-10',
        status: 'paid',
        has_signal: false,
        created_at: '2026-11-10',
      },
      {
        id: 'r-pending',
        customer_name: 'Cliente Pendente',
        description: 'Escova',
        original_amount: 100,
        discount: 0,
        surcharge: 0,
        final_amount: 100,
        amount_paid: 0,
        payment_method: 'pix',
        due_date: '2026-11-11',
        status: 'pending',
        has_signal: false,
        created_at: '2026-11-11',
      },
    ];

    const payables: Payable[] = [
      {
        id: 'p-curr',
        description: 'Fornecedor Produtos',
        category: 'fornecedores',
        due_date: '2026-11-11',
        paid_at: '2026-11-11',
        amount: 120,
        paid_amount: 120,
        status: 'paid',
        payment_method: 'pix',
        created_at: '2026-11-11',
      },
    ];

    const monthSummary = computeCashFlowSummary(receivables, payables, 'month', today);
    expect(monthSummary.openingBalance).toBe(200);
    expect(monthSummary.totalIn).toBe(350);
    expect(monthSummary.totalOut).toBe(120);
    expect(monthSummary.netChange).toBe(230);
    expect(monthSummary.finalBalance).toBe(430);
    expect(monthSummary.entries).toHaveLength(2);
    expect(monthSummary.entries[0].balance_after).toBe(230 + 200);

    const todaySummary = computeCashFlowSummary(receivables, payables, 'today', today);
    expect(todaySummary.openingBalance).toBe(550);
    expect(todaySummary.totalIn).toBe(0);
    expect(todaySummary.totalOut).toBe(120);
    expect(todaySummary.finalBalance).toBe(430);
    expect(todaySummary.entries).toHaveLength(1);

    const allSummary = computeCashFlowSummary(receivables, payables, 'all', today);
    expect(allSummary.openingBalance).toBe(0);
    expect(allSummary.entries).toHaveLength(3);
  });
});

describe('Dashboard & Cash Flow Unification Architecture', () => {
  it('unifies Dashboard and Fluxo de Caixa into Visão Geral & Caixa in Financeiro.tsx', () => {
    expect(financeiroRaw).toContain("label: 'Visão Geral & Caixa'");
    expect(financeiroRaw).not.toContain("{ id: 'fluxo', label: 'Fluxo de Caixa'");
    expect(financeiroRaw).toContain('<FluxoCaixaTab\n              embedded');
    expect(financeiroRaw).toContain('hideTopEmptyBanner');
  });

  it('integrates DashboardCashFlowCard into Dashboard.tsx with RBAC protection', () => {
    expect(dashboardRaw).toContain('DashboardCashFlowCard');
    expect(dashboardRaw).toContain("['super_admin', 'owner', 'admin'].includes(userRole)");
    expect(dashboardRaw).toContain('canViewFinancial && <DashboardCashFlowCard />');
  });
});
