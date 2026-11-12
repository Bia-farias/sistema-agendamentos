import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useFinancialStore } from '../../stores/financialStore';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { NovaCobrancaModal } from '../financeiro/NovaCobrancaModal';
import { NovaDespesaModal } from '../financeiro/NovaDespesaModal';
import { formatCurrency, formatDate } from '../../utils/format';

export function DashboardCashFlowCard() {
  const navigate = useNavigate();
  const { getCashFlowSummary } = useFinancialStore();
  const [cashPeriod, setCashPeriod] = useState<'today' | 'month'>('month');
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);

  const summary = getCashFlowSummary(cashPeriod);
  const totalVolume = Math.max(summary.totalIn + summary.totalOut, 1);
  const inRatio = summary.totalIn > 0 ? Math.round((summary.totalIn / totalVolume) * 100) : 0;
  const outRatio = summary.totalOut > 0 ? 100 - inRatio : 0;
  const recentEntries = summary.entries.slice(0, 3);

  return (
    <>
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-violet-500" />
              <span>Fluxo de Caixa</span>
            </div>
          }
          subtitle={
            cashPeriod === 'today'
              ? 'Movimentação realizada hoje'
              : 'Movimentação acumulada neste mês'
          }
          action={
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCashPeriod('today')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    cashPeriod === 'today'
                      ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-300 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setCashPeriod('month')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    cashPeriod === 'month'
                      ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-300 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Mês
                </button>
              </div>
              <Button
                variant="ghost"
                size="xs"
                rightIcon={<ArrowRight size={14} />}
                onClick={() => navigate('/financeiro')}
              >
                Abrir
              </Button>
            </div>
          }
        />

        {/* KPIs Compactos do Caixa */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 min-w-0">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight size={12} className="shrink-0" />
              Entradas
            </span>
            <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 truncate">
              {formatCurrency(summary.totalIn)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 min-w-0">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownLeft size={12} className="shrink-0" />
              Saídas
            </span>
            <p className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 font-mono mt-1 truncate">
              {formatCurrency(summary.totalOut)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-sm min-w-0">
            <span className="text-[10px] font-bold text-violet-200 uppercase tracking-wider block">
              Saldo Caixa
            </span>
            <p className="text-sm sm:text-base font-black text-white font-mono mt-1 truncate">
              {formatCurrency(summary.finalBalance)}
            </p>
          </div>
        </div>

        {/* Barra de Proporção Entradas x Saídas */}
        {(summary.totalIn > 0 || summary.totalOut > 0) && (
          <div className="mt-3 space-y-1">
            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex">
              {inRatio > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${inRatio}%` }}
                />
              )}
              {outRatio > 0 && (
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${outRatio}%` }}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
              <span>{inRatio}% Entradas</span>
              <span>{outRatio}% Saídas</span>
            </div>
          </div>
        )}

        {/* Últimas movimentações do período */}
        <div className="mt-4">
          {recentEntries.length === 0 ? (
            <EmptyState
              size="sm"
              icon={<Wallet size={18} />}
              title={
                cashPeriod === 'today'
                  ? 'Sem movimentações liquidadas hoje'
                  : 'Sem movimentações liquidadas no mês'
              }
              description="Entradas recebidas e despesas pagas aparecem aqui em tempo real."
            />
          ) : (
            <div className="space-y-2">
              {recentEntries.map((entry) => {
                const isIncome = entry.type === 'income';
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                          {entry.description}
                        </p>
                        <span className="text-[10px] text-zinc-400">
                          {formatDate(entry.date)} • {entry.payment_method.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`font-mono font-bold shrink-0 ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(entry.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ações Rápidas Diretas */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReceivableModalOpen(true)}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Recebimento
          </button>
          <button
            type="button"
            onClick={() => setIsPayableModalOpen(true)}
            className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Despesa
          </button>
        </div>
      </Card>

      <NovaCobrancaModal
        isOpen={isReceivableModalOpen}
        onClose={() => setIsReceivableModalOpen(false)}
      />
      <NovaDespesaModal
        isOpen={isPayableModalOpen}
        onClose={() => setIsPayableModalOpen(false)}
      />
    </>
  );
}

