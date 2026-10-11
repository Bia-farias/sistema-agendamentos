import React from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { formatCurrency, formatDate } from '../../utils/format';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  TrendingDown,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface FinancialAlertsProps {
  onNavigateTab: (tab: string) => void;
}

export function FinancialAlerts({ onNavigateTab }: FinancialAlertsProps) {
  const { payables, receivables, merchandise, getCommissionSummaries } = useFinancialStore();

  const today = new Date().toISOString().split('T')[0];

  // 1. Contas a pagar vencendo hoje ou já vencidas
  const overduePayables = payables.filter(
    (p) => p.status === 'overdue' || (p.status === 'pending' && p.due_date <= today)
  );

  // 2. Cobranças pendentes ou vencidas
  const overdueReceivables = receivables.filter((r) => r.status === 'overdue');
  const pendingReceivablesTotal = receivables
    .filter((r) => r.status === 'pending' || r.status === 'overdue')
    .reduce((sum, r) => sum + (r.final_amount - r.amount_paid), 0);

  // 3. Comissões pendentes
  const commissionSummaries = getCommissionSummaries();
  const totalPendingCommissions = commissionSummaries.reduce(
    (sum, c) => sum + c.commission_pending,
    0
  );

  // 4. Mercadorias abaixo do estoque mínimo
  const lowStockItems = merchandise.filter((m) => m.quantity <= m.min_quantity);

  const hasAlerts =
    overduePayables.length > 0 ||
    pendingReceivablesTotal > 0 ||
    totalPendingCommissions > 0 ||
    lowStockItems.length > 0;

  if (!hasAlerts) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
        <CheckCircle size={18} className="text-emerald-600 shrink-0" />
        <span className="font-semibold">
          Tudo em dia! Nenhuma conta vencida, estoque abastecido e comissões regulares.
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Alerta 1: Contas a Pagar Vencidas / Vencendo Hoje */}
      {overduePayables.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/25 border border-rose-200/80 dark:border-rose-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                {overduePayables.length} {overduePayables.length === 1 ? 'Conta Vencida' : 'Contas Vencidas'}
              </span>
              <p className="text-xs text-rose-900/90 dark:text-rose-200 font-semibold mt-0.5 truncate">
                {overduePayables[0]?.description} ({formatCurrency(overduePayables[0]?.amount)})
              </p>
              {overduePayables.length > 1 && (
                <span className="text-[10px] text-rose-700/80 dark:text-rose-400">
                  + {overduePayables.length - 1} outros pagamentos pendentes
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('pagar')}
            className="mt-2.5 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 flex items-center gap-1 hover:translate-x-0.5 transition-all self-start cursor-pointer"
          >
            Pagar agora &rarr;
          </button>
        </div>
      )}

      {/* Alerta 2: Valores a Receber Pendentes */}
      {pendingReceivablesTotal > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Clock size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                A Receber de Clientes
              </span>
              <p className="text-sm font-extrabold text-amber-950 dark:text-amber-200 mt-0.5">
                {formatCurrency(pendingReceivablesTotal)}
              </p>
              {overdueReceivables.length > 0 && (
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">
                  {overdueReceivables.length} cobrança em atraso
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('receber')}
            className="mt-2.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 flex items-center gap-1 hover:translate-x-0.5 transition-all self-start cursor-pointer"
          >
            Ver cobranças &rarr;
          </button>
        </div>
      )}

      {/* Alerta 3: Comissões Pendentes */}
      {totalPendingCommissions > 0 && (
        <div className="p-3.5 rounded-2xl bg-violet-50/90 dark:bg-violet-950/25 border border-violet-200/80 dark:border-violet-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
              <DollarSign size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-violet-800 dark:text-violet-300 uppercase tracking-wider block">
                Comissões a Quitar
              </span>
              <p className="text-sm font-extrabold text-violet-950 dark:text-violet-200 mt-0.5">
                {formatCurrency(totalPendingCommissions)}
              </p>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Aguardando repasse aos profissionais
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('comissoes')}
            className="mt-2.5 text-[11px] font-bold text-violet-700 dark:text-violet-300 hover:text-violet-900 flex items-center gap-1 hover:translate-x-0.5 transition-all self-start cursor-pointer"
          >
            Ver repasses &rarr;
          </button>
        </div>
      )}

      {/* Alerta 4: Estoque Baixo de Mercadorias */}
      {lowStockItems.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-orange-50/90 dark:bg-orange-950/25 border border-orange-200/80 dark:border-orange-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
              <Package size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider block">
                Estoque Crítico ({lowStockItems.length})
              </span>
              <p className="text-xs text-orange-950 dark:text-orange-200 font-semibold mt-0.5 truncate">
                {lowStockItems[0]?.name}
              </p>
              <span className="text-[10px] text-orange-700 dark:text-orange-400 font-medium">
                Apenas {lowStockItems[0]?.quantity} {lowStockItems[0]?.unit} restantes
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('mercadorias')}
            className="mt-2.5 text-[11px] font-bold text-orange-700 dark:text-orange-300 hover:text-orange-900 flex items-center gap-1 hover:translate-x-0.5 transition-all self-start cursor-pointer"
          >
            Repor com fornecedor &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
