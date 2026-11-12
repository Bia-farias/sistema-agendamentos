import React, { useMemo, useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { formatCurrency, formatDate } from '../../utils/format';
import { FinancialPeriod } from '../../types/financeiro';
import { EmptyState } from '../ui/EmptyState';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Download,
  TrendingUp,
} from 'lucide-react';

interface FluxoCaixaTabProps {
  embedded?: boolean;
  onOpenReceivable?: () => void;
  onOpenPayable?: () => void;
}

type FlowFilterType = 'all' | 'income' | 'expense';

export function FluxoCaixaTab({
  embedded = false,
  onOpenReceivable,
  onOpenPayable,
}: FluxoCaixaTabProps) {
  const {
    getCashFlowSummary,
    activePeriod,
    setActivePeriod,
    receivables,
    payables,
  } = useFinancialStore();

  const [typeFilter, setTypeFilter] = useState<FlowFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    openingBalance,
    totalIn,
    totalOut,
    netChange,
    finalBalance,
    entries,
  } = getCashFlowSummary(activePeriod);

  const allTimeCount = getCashFlowSummary('all').entries.length;

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (!q) return true;
      return (
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.payment_method.toLowerCase().includes(q)
      );
    });
  }, [entries, typeFilter, searchQuery]);

  // Agrupamento diário (até 14 datas mais recentes dentro do período) para visualização temporal
  const dailyFlow = useMemo(() => {
    const map: Record<string, { date: string; income: number; expense: number }> = {};
    entries.forEach((entry) => {
      const dateKey = entry.date.slice(0, 10);
      if (!map[dateKey]) {
        map[dateKey] = { date: dateKey, income: 0, expense: 0 };
      }
      if (entry.type === 'income') {
        map[dateKey].income += entry.amount;
      } else {
        map[dateKey].expense += entry.amount;
      }
    });

    const sorted = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-14);
  }, [entries]);

  const maxDailyValue = useMemo(() => {
    return Math.max(
      ...dailyFlow.map((d) => Math.max(d.income, d.expense)),
      1
    );
  }, [dailyFlow]);

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) return;
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Forma de Pagamento', 'Valor', 'Saldo Após'];
    const rows = filteredEntries.map((item) => [
      item.date,
      item.type === 'income' ? 'Entrada' : 'Saída',
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      item.payment_method,
      (item.type === 'income' ? item.amount : -item.amount).toFixed(2),
      item.balance_after.toFixed(2),
    ]);
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fluxo-de-caixa-${activePeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const periods: { id: FinancialPeriod; label: string }[] = [
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mês' },
    { id: 'next_month', label: 'Próximo Mês' },
    { id: 'all', label: 'Todo o Período' },
  ];

  const incomeCount = entries.filter((e) => e.type === 'income').length;
  const expenseCount = entries.filter((e) => e.type === 'expense').length;

  return (
    <div className="space-y-5">
      {/* Header próprio apenas quando usado fora da Visão Geral unificada */}
      {!embedded && (
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
                type="button"
                onClick={() => setActivePeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activePeriod === p.id
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Caixa Cards: Saldo Anterior + Entradas - Saídas = Saldo Atual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Anterior */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Saldo Anterior
          </span>
          <p className="text-2xl font-black text-zinc-800 dark:text-zinc-200 mt-1.5 font-mono">
            {formatCurrency(openingBalance)}
          </p>
          <span className="text-[11px] text-zinc-400 block mt-1">
            Acumulado antes do período
          </span>
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
            {incomeCount} {incomeCount === 1 ? 'recebimento liquidado' : 'recebimentos liquidados'}
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
            {expenseCount} {expenseCount === 1 ? 'despesa quitada' : 'despesas quitadas'}
          </span>
        </div>

        {/* (=) Saldo Atual */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-md shadow-violet-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-200 uppercase tracking-wider block">
              (=) Saldo Atual em Caixa
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                netChange >= 0
                  ? 'bg-emerald-400/20 text-emerald-100'
                  : 'bg-rose-400/25 text-rose-100'
              }`}
            >
              {netChange >= 0 ? '+' : ''}
              {formatCurrency(netChange)} no período
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-1.5 font-mono">
            {formatCurrency(finalBalance)}
          </p>
          <span className="text-[11px] text-violet-200 block mt-1">
            Disponível após movimentações liquidadas
          </span>
        </div>
      </div>

      {/* Evolução Diária do Fluxo de Caixa (Entradas × Saídas) */}
      {dailyFlow.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                <TrendingUp size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Evolução Diária do Caixa
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Entradas × Saídas liquidadas por dia no período
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Entradas
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                Saídas
              </span>
            </div>
          </div>

          <div className="h-36 flex items-end gap-2 sm:gap-3 pt-4 pb-1 overflow-x-auto">
            {dailyFlow.map((day) => {
              const inH = day.income > 0 ? Math.max(Math.round((day.income / maxDailyValue) * 100), 10) : 0;
              const outH = day.expense > 0 ? Math.max(Math.round((day.expense / maxDailyValue) * 100), 10) : 0;
              const shortDate = `${day.date.slice(8, 10)}/${day.date.slice(5, 7)}`;

              return (
                <div
                  key={day.date}
                  className="flex-1 min-w-[38px] flex flex-col items-center gap-1.5 group relative"
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-2 bg-zinc-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-10 font-mono shadow-lg">
                    +{formatCurrency(day.income)} / -{formatCurrency(day.expense)}
                  </div>
                  <div className="w-full h-24 flex items-end justify-center gap-1">
                    <div
                      style={{ height: `${inH}%` }}
                      className={`w-2.5 sm:w-3 rounded-t-md transition-all duration-300 ${
                        inH > 0 ? 'bg-emerald-500/90 group-hover:bg-emerald-400' : 'bg-transparent'
                      }`}
                    />
                    <div
                      style={{ height: `${outH}%` }}
                      className={`w-2.5 sm:w-3 rounded-t-md transition-all duration-300 ${
                        outH > 0 ? 'bg-rose-500/90 group-hover:bg-rose-400' : 'bg-transparent'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400 font-mono">
                    {shortDate}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extrato Detalhado do Fluxo de Caixa */}
      <div className="bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <Wallet size={15} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Extrato de Movimentações ({filteredEntries.length} lançamentos)
              </h4>
              <span className="text-[11px] text-zinc-400">
                Apenas entradas recebidas e despesas já pagas • Ordenado por data recente
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro rápido Todas / Entradas / Saídas */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 text-[11px] font-bold">
              {(
                [
                  { id: 'all', label: `Todas (${entries.length})` },
                  { id: 'income', label: `Entradas (${incomeCount})` },
                  { id: 'expense', label: `Saídas (${expenseCount})` },
                ] as const
              ).map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setTypeFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    typeFilter === pill.id
                      ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-300 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Busca rápida */}
            <div className="relative flex-1 sm:flex-initial min-w-[170px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar extrato..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-base sm:text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Exportar CSV */}
            {filteredEntries.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-500/40 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Exportar extrato filtrado para CSV"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            )}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-5">
            <EmptyState
              size="sm"
              icon={<Wallet size={20} />}
              title={
                searchQuery.trim() || typeFilter !== 'all'
                  ? 'Nenhuma movimentação corresponde ao filtro'
                  : allTimeCount === 0
                  ? 'Nenhuma movimentação realizada no caixa'
                  : 'Nenhuma movimentação neste período'
              }
              description={
                searchQuery.trim() || typeFilter !== 'all'
                  ? 'Limpe a busca ou selecione "Todas" para visualizar todos os lançamentos liquidados do período.'
                  : allTimeCount === 0
                  ? receivables.length > 0 || payables.length > 0
                    ? 'Você possui lançamentos pendentes, mas o Fluxo de Caixa exibe apenas entradas recebidas e despesas já pagas.'
                    : 'Conforme você receber pagamentos de clientes e quitar despesas, o extrato consolidado aparecerá aqui.'
                  : 'Não houve entradas ou saídas liquidadas no filtro de data selecionado.'
              }
              actionLabel={
                searchQuery.trim() || typeFilter !== 'all'
                  ? 'Limpar Filtros'
                  : allTimeCount > 0 && activePeriod !== 'all'
                  ? 'Ver Todo o Período'
                  : onOpenReceivable
                  ? '+ Registrar Recebimento'
                  : undefined
              }
              onAction={
                searchQuery.trim() || typeFilter !== 'all'
                  ? () => {
                      setSearchQuery('');
                      setTypeFilter('all');
                    }
                  : allTimeCount > 0 && activePeriod !== 'all'
                  ? () => setActivePeriod('all')
                  : onOpenReceivable
              }
              secondaryActionLabel={
                allTimeCount === 0 && onOpenPayable ? '+ Lançar Despesa' : undefined
              }
              onSecondaryAction={allTimeCount === 0 ? onOpenPayable : undefined}
            />
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[460px] overflow-y-auto">
            {filteredEntries.map((item) => {
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
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-400">
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
