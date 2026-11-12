import { CashFlowEntry, FinancialPeriod, Payable, Receivable } from '../types/financeiro';
import {
  isDateBeforeFinancialPeriod,
  isDateInFinancialPeriod,
} from './financialPeriod';

export interface CashFlowSummary {
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  netChange: number;
  finalBalance: number;
  entries: CashFlowEntry[];
}

/**
 * Computes chronological cash flow entries (settled inflows and paid outflows),
 * running balances, and period totals relative to `todayStr`.
 */
export function computeCashFlowSummary(
  receivables: Receivable[],
  payables: Payable[],
  period: FinancialPeriod,
  todayStr: string
): CashFlowSummary {
  const allEntries: CashFlowEntry[] = [];

  receivables
    .filter((r) => r.status === 'paid' || (r.status === 'partially_paid' && r.amount_paid > 0))
    .forEach((r) => {
      allEntries.push({
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

  payables
    .filter((p) => p.status === 'paid')
    .forEach((p) => {
      allEntries.push({
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

  allEntries.sort((a, b) => a.date.localeCompare(b.date));

  let runningBalance = 0;
  allEntries.forEach((entry) => {
    runningBalance += entry.type === 'income' ? entry.amount : -entry.amount;
    entry.balance_after = runningBalance;
  });

  const openingBalance = allEntries
    .filter((e) => isDateBeforeFinancialPeriod(e.date, period, todayStr))
    .reduce((sum, e) => sum + (e.type === 'income' ? e.amount : -e.amount), 0);

  const periodEntries = allEntries.filter((e) =>
    isDateInFinancialPeriod(e.date, period, todayStr)
  );

  const totalIn = periodEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOut = periodEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const netChange = totalIn - totalOut;
  const finalBalance = openingBalance + netChange;

  return {
    openingBalance,
    totalIn,
    totalOut,
    netChange,
    finalBalance,
    entries: periodEntries.slice().reverse(),
  };
}

