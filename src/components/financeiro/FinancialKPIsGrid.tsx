import React from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { formatCurrency } from '../../utils/format';
import {
  DollarSign,
  TrendingUp,
  Clock,
  TrendingDown,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Hourglass,
  Percent,
} from 'lucide-react';

export function FinancialKPIsGrid() {
  const { getFinancialKPIs, activePeriod } = useFinancialStore();
  const kpis = getFinancialKPIs(activePeriod);

  const profitMargin =
    kpis.receivedRevenue > 0
      ? Math.round((kpis.netProfit / kpis.receivedRevenue) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Receita Total */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:border-violet-300 dark:hover:border-violet-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Receita Total
          </span>
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            <DollarSign size={18} />
          </div>
        </div>
        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-2 font-mono tracking-tight">
          {formatCurrency(kpis.totalRevenue)}
        </p>
        <span className="text-[11px] text-zinc-400 block mt-1">
          Valor bruto faturado e agendado
        </span>
      </div>

      {/* 2. Receita Recebida */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Receita Recebida
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={18} />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono tracking-tight">
          {formatCurrency(kpis.receivedRevenue)}
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
          <CheckCircle2 size={13} />
          <span>{kpis.paidAppointmentsCount} pagamentos liquidados</span>
        </div>
      </div>

      {/* 3. A Receber */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            A Receber
          </span>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Clock size={18} />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono tracking-tight">
          {formatCurrency(kpis.pendingReceivable + kpis.overdueReceivable)}
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
          <Hourglass size={13} />
          <span>{kpis.pendingAppointmentsCount} atendimentos pendentes</span>
        </div>
      </div>

      {/* 4. Despesas Totais */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Despesas Totais
          </span>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <TrendingDown size={18} />
          </div>
        </div>
        <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 font-mono tracking-tight">
          {formatCurrency(kpis.totalExpenses)}
        </p>
        <span className="text-[11px] text-zinc-400 block mt-1">
          {formatCurrency(kpis.paidExpenses)} pagas • {formatCurrency(kpis.pendingExpenses)} pendentes
        </span>
      </div>

      {/* 5. Lucro Líquido Realizado */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50/80 via-white to-purple-50/40 dark:from-violet-950/20 dark:via-[#121215] dark:to-[#181424] border border-violet-200/80 dark:border-violet-900/40 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
            Lucro Líquido Real
          </span>
          <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
            Margem {profitMargin}%
          </span>
        </div>
        <p className="text-2xl font-black text-violet-700 dark:text-violet-300 mt-2 font-mono tracking-tight">
          {formatCurrency(kpis.netProfit)}
        </p>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-1">
          Receitas recebidas menos despesas pagas
        </span>
      </div>

      {/* 6. Contas Vencidas */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Contas Vencidas
          </span>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
            <AlertCircle size={18} />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            {kpis.overdueBillsCount}
          </p>
          <span className="text-xs text-zinc-400 font-medium">contas a regularizar</span>
        </div>
        <span className="text-[11px] text-rose-600/80 dark:text-rose-400 block mt-1 font-semibold">
          Evite juros e interrupção de serviços
        </span>
      </div>

      {/* 7. Ticket Médio */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Ticket Médio
          </span>
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600">
            <Receipt size={18} />
          </div>
        </div>
        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2 font-mono tracking-tight">
          {formatCurrency(kpis.averageTicket)}
        </p>
        <span className="text-[11px] text-zinc-400 block mt-1">
          Média por atendimento realizado
        </span>
      </div>

      {/* 8. Atendimentos: Pagos vs Pendentes */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Status Atendimentos
          </span>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {kpis.paidAppointmentsCount + kpis.pendingAppointmentsCount} Total
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">
              Pagos
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {kpis.paidAppointmentsCount}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase block">
              Pendentes
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {kpis.pendingAppointmentsCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
