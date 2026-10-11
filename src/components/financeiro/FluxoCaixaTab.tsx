import React, { useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { formatCurrency, formatDate } from '../../utils/format';
import { FinancialPeriod } from '../../types/financeiro';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export function FluxoCaixaTab() {
  const { getCashFlowEntries, activePeriod, setActivePeriod } = useFinancialStore();
  const [selectedPeriod, setSelectedPeriod] = useState<FinancialPeriod>(activePeriod);

  const entries = getCashFlowEntries(selectedPeriod);

  const totalIn = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOut = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const initialBalance = 0; // Saldo de abertura do caixa
  const finalBalance = initialBalance + totalIn - totalOut;

  const periods: { id: FinancialPeriod; label: string }[] = [
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mês' },
    { id: 'next_month', label: 'Próximo Mês' },
    { id: 'all', label: 'Todo o Período' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls: Period Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#121215] p-3.5 rounded-2xl border border-violet-100/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            <Wallet size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Demonstrativo de Fluxo de Caixa
            </h3>
            <p className="text-[11px] text-zinc-400">
              Extrato consolidado de entradas e saídas financeiras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPeriod(p.id);
                setActivePeriod(p.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedPeriod === p.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Caixa Cards: Saldo Inicial + Entradas - Saídas = Saldo Atual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Inicial */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Saldo Inicial
          </span>
          <p className="text-2xl font-black text-zinc-800 dark:text-zinc-200 mt-1.5 font-mono">
            {formatCurrency(initialBalance)}
          </p>
          <span className="text-[11px] text-zinc-400 block mt-1">Saldo em caixa no início</span>
        </div>

        {/* (+) Entradas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              (+) Entradas Realizadas
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
            {formatCurrency(totalIn)}
          </p>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400 block mt-1">
            Recebimento de atendimentos e sinais
          </span>
        </div>

        {/* (-) Saídas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              (-) Saídas Pagas
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5 font-mono">
            {formatCurrency(totalOut)}
          </p>
          <span className="text-[11px] text-rose-700/80 dark:text-rose-400 block mt-1">
            Contas, despesas e fornecedores quitados
          </span>
        </div>

        {/* (=) Saldo Atual */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/20">
          <span className="text-xs font-bold text-violet-200 uppercase tracking-wider block">
            (=) Saldo Atual em Caixa
          </span>
          <p className="text-2xl font-black text-white mt-1.5 font-mono">
            {formatCurrency(finalBalance)}
          </p>
          <span className="text-[11px] text-violet-200 block mt-1">
            Disponível após todas as movimentações
          </span>
        </div>
      </div>

      {/* Extrato Detalhado do Fluxo de Caixa */}
      <div className="bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Movimentações do Caixa ({entries.length} lançamentos)
          </h4>
          <span className="text-xs text-zinc-400">Ordenado por data mais recente</span>
        </div>

        {entries.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs italic">
            Nenhuma movimentação financeira encontrada para este período.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[500px] overflow-y-auto">
            {entries.map((item) => {
              const isIncome = item.type === 'income';

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:px-5 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span>{formatDate(item.date)}</span>
                        <span>•</span>
                        <span className="font-medium text-zinc-600 dark:text-zinc-300">
                          {item.category}
                        </span>
                        <span>•</span>
                        <span className="uppercase">{item.payment_method}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-extrabold font-mono block ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Saldo: {formatCurrency(item.balance_after)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
