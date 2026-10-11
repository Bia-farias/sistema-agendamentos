import React from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { formatCurrency } from '../../utils/format';
import {
  TrendingUp,
  Scissors,
  Users,
  CreditCard,
  BarChart3,
  PieChart,
} from 'lucide-react';

export function FinancialCharts() {
  const { receivables, payables, activePeriod } = useFinancialStore();

  // 1. Receitas x Despesas
  const totalIn = receivables
    .filter((r) => r.status === 'paid' || r.status === 'partially_paid')
    .reduce((sum, r) => sum + r.amount_paid, 0);

  const totalOut = payables
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.paid_amount || p.amount), 0);

  const maxCompare = Math.max(totalIn, totalOut, 1);
  const inPercent = Math.round((totalIn / maxCompare) * 100);
  const outPercent = Math.round((totalOut / maxCompare) * 100);

  // 2. Receitas por Serviço
  const serviceRevenueMap: Record<string, { count: number; total: number }> = {};
  receivables
    .filter((r) => r.status !== 'cancelled' && r.service_name)
    .forEach((r) => {
      const sName = r.service_name!;
      if (!serviceRevenueMap[sName]) {
        serviceRevenueMap[sName] = { count: 0, total: 0 };
      }
      serviceRevenueMap[sName].count += 1;
      serviceRevenueMap[sName].total += r.final_amount;
    });

  // Top services sorted by revenue
  const topServices = Object.entries(serviceRevenueMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);

  const maxServiceTotal = topServices[0]?.total || 1;

  // 3. Receitas por Profissional
  const profRevenueMap: Record<string, { count: number; total: number }> = {};
  receivables
    .filter((r) => r.status !== 'cancelled' && r.professional_name)
    .forEach((r) => {
      const pName = r.professional_name!;
      if (!profRevenueMap[pName]) {
        profRevenueMap[pName] = { count: 0, total: 0 };
      }
      profRevenueMap[pName].count += 1;
      profRevenueMap[pName].total += r.final_amount;
    });

  const topProfessionals = Object.entries(profRevenueMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);

  const maxProfTotal = topProfessionals[0]?.total || 1;

  // 4. Formas de Pagamento
  const methodMap: Record<string, { name: string; count: number; total: number; color: string }> = {
    pix: { name: 'Pix', count: 0, total: 0, color: 'bg-emerald-500' },
    credito: { name: 'Cartão de Crédito', count: 0, total: 0, color: 'bg-violet-500' },
    debito: { name: 'Cartão de Débito', count: 0, total: 0, color: 'bg-sky-500' },
    dinheiro: { name: 'Dinheiro', count: 0, total: 0, color: 'bg-amber-500' },
    transferencia: { name: 'Transferência', count: 0, total: 0, color: 'bg-indigo-500' },
    boleto: { name: 'Boleto', count: 0, total: 0, color: 'bg-zinc-400' },
  };

  receivables
    .filter((r) => r.status === 'paid' || r.status === 'partially_paid')
    .forEach((r) => {
      const m = r.payment_method || 'pix';
      if (methodMap[m]) {
        methodMap[m].count += 1;
        methodMap[m].total += r.amount_paid;
      }
    });

  const methodsList = Object.entries(methodMap)
    .filter(([_, data]) => data.total > 0)
    .sort((a, b) => b[1].total - a[1].total);

  const totalMethodAmount = methodsList.reduce((sum, item) => sum + item[1].total, 0) || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico 1: Receitas × Despesas */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <BarChart3 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Receitas × Despesas Liquidadas
              </h3>
              <p className="text-[11px] text-zinc-400">Comparativo no período selecionado</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {/* Receitas Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Receitas Realizadas
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {formatCurrency(totalIn)}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${inPercent}%` }}
              />
            </div>
          </div>

          {/* Despesas Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Despesas Pagas
              </span>
              <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                {formatCurrency(totalOut)}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                style={{ width: `${outPercent}%` }}
              />
            </div>
          </div>

          {/* Resultado Operacional */}
          <div className="p-3 rounded-xl bg-violet-50/50 dark:bg-zinc-900/60 border border-violet-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              Saldo do Período (Lucro):
            </span>
            <span
              className={`font-mono font-extrabold text-sm ${
                totalIn >= totalOut ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
              }`}
            >
              {formatCurrency(totalIn - totalOut)}
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico 2: Formas de Pagamento */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CreditCard size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Distribuição por Forma de Pagamento
              </h3>
              <p className="text-[11px] text-zinc-400">Volume recebido em cada canal</p>
            </div>
          </div>
        </div>

        {methodsList.length === 0 ? (
          <p className="text-xs text-zinc-400 italic text-center py-6">
            Nenhum recebimento registrado no período.
          </p>
        ) : (
          <div className="space-y-3 pt-1">
            {methodsList.map(([key, data]) => {
              const pct = Math.round((data.total / totalMethodAmount) * 100);
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${data.color}`} />
                      {data.name}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-zinc-400 font-normal">({pct}%)</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(data.total)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${data.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gráfico 3: Receitas por Serviço */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Scissors size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Top Serviços por Faturamento
              </h3>
              <p className="text-[11px] text-zinc-400">Ranking dos serviços mais rentáveis</p>
            </div>
          </div>
        </div>

        {topServices.length === 0 ? (
          <p className="text-xs text-zinc-400 italic text-center py-6">
            Nenhum serviço faturado no período.
          </p>
        ) : (
          <div className="space-y-3 pt-1">
            {topServices.slice(0, 5).map((srv, idx) => {
              const pct = Math.round((srv.total / maxServiceTotal) * 100);
              return (
                <div key={srv.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {srv.name}
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(srv.total)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gráfico 4: Receitas por Profissional */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Faturamento por Profissional
              </h3>
              <p className="text-[11px] text-zinc-400">Produção da equipe no período</p>
            </div>
          </div>
        </div>

        {topProfessionals.length === 0 ? (
          <p className="text-xs text-zinc-400 italic text-center py-6">
            Nenhum atendimento registrado no período.
          </p>
        ) : (
          <div className="space-y-3 pt-1">
            {topProfessionals.map((prof) => {
              const pct = Math.round((prof.total / maxProfTotal) * 100);
              return (
                <div key={prof.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {prof.name}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[10px] text-zinc-400 font-normal">
                        ({prof.count} atend.)
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(prof.total)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
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
