import React, { useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { useCustomerStore } from '../../stores/customerStore';
import { formatCurrency, formatDate } from '../../utils/format';
import {
  FileText,
  Printer,
  Download,
  TrendingUp,
  Scissors,
  Users,
  AlertTriangle,
  Receipt,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

export function RelatoriosTab() {
  const {
    receivables,
    payables,
    getFinancialKPIs,
    getCommissionSummaries,
    activePeriod,
  } = useFinancialStore();
  const { customers } = useCustomerStore();

  const [reportSection, setReportSection] = useState<'financeiro' | 'servicos' | 'profissionais' | 'clientes'>('financeiro');

  const kpis = getFinancialKPIs(activePeriod);
  const commissionSummaries = getCommissionSummaries();

  // DRE Calculations
  const grossRevenue = kpis.totalRevenue;
  const cardFeesDeductions = Math.round((grossRevenue * 0.025) * 100) / 100; // Média estimada de taxas
  const netRevenue = grossRevenue - cardFeesDeductions;

  const supplierExpenses = payables
    .filter((p) => p.category === 'fornecedores' || p.category === 'materiais')
    .reduce((sum, p) => sum + p.amount, 0);

  const operationalExpenses = payables
    .filter((p) => p.category === 'aluguel' || p.category === 'energia' || p.category === 'internet' || p.category === 'marketing')
    .reduce((sum, p) => sum + p.amount, 0);

  const payrollAndCommissions = payables
    .filter((p) => p.category === 'salarios' || p.category === 'funcionarios' || p.category === 'comissoes')
    .reduce((sum, p) => sum + p.amount, 0);

  const taxes = payables
    .filter((p) => p.category === 'impostos')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDREExpenses = supplierExpenses + operationalExpenses + payrollAndCommissions + taxes;
  const netProfitDRE = netRevenue - totalDREExpenses;
  const profitMarginDRE = netRevenue > 0 ? Math.round((netProfitDRE / netRevenue) * 100) : 0;

  // Serviços Ranking
  const serviceStatsMap: Record<string, { count: number; total: number }> = {};
  receivables
    .filter((r) => r.service_name && r.status !== 'cancelled')
    .forEach((r) => {
      const s = r.service_name!;
      if (!serviceStatsMap[s]) serviceStatsMap[s] = { count: 0, total: 0 };
      serviceStatsMap[s].count += 1;
      serviceStatsMap[s].total += r.final_amount;
    });

  const servicesRanking = Object.entries(serviceStatsMap)
    .map(([name, data]) => ({
      name,
      count: data.count,
      total: data.total,
      ticketMedio: Math.round(data.total / data.count),
    }))
    .sort((a, b) => b.total - a.total);

  // Clientes Analysis: Top Spenders, Recurrentes, Inadimplentes
  const topSpenders = [...customers]
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 6);

  const recurrentCustomers = customers.filter((c) => c.appointments_count >= 3);

  const overdueClients = receivables
    .filter((r) => r.status === 'overdue')
    .map((r) => ({
      customer_name: r.customer_name,
      amount: r.final_amount - r.amount_paid,
      due_date: r.due_date,
      service: r.service_name || r.description,
    }));

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportSection === 'financeiro') {
      csvContent += 'Item,Valor\n';
      csvContent += `Receita Bruta,${grossRevenue}\n`;
      csvContent += `Deduções e Taxas,${cardFeesDeductions}\n`;
      csvContent += `Receita Líquida,${netRevenue}\n`;
      csvContent += `Custos com Fornecedores,${supplierExpenses}\n`;
      csvContent += `Despesas Operacionais,${operationalExpenses}\n`;
      csvContent += `Folha e Comissoes,${payrollAndCommissions}\n`;
      csvContent += `Impostos,${taxes}\n`;
      csvContent += `Lucro Liquido,${netProfitDRE}\n`;
    } else if (reportSection === 'servicos') {
      csvContent += 'Servico,Atendimentos,Faturamento Total,Ticket Medio\n';
      servicesRanking.forEach((s) => {
        csvContent += `"${s.name}",${s.count},${s.total},${s.ticketMedio}\n`;
      });
    } else if (reportSection === 'profissionais') {
      csvContent += 'Profissional,Atendimentos,Faturamento,Comissao Gerada,Comissao Paga,Pendente\n';
      commissionSummaries.forEach((p) => {
        csvContent += `"${p.professional_name}",${p.appointments_count},${p.total_revenue},${p.commission_generated},${p.commission_paid},${p.commission_pending}\n`;
      });
    } else {
      csvContent += 'Cliente,Total Gasto,Visitas,VIP\n';
      customers.forEach((c) => {
        csvContent += `"${c.name}",${c.total_spent || 0},${c.appointments_count || 0},${c.is_vip ? 'Sim' : 'Nao'}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_${reportSection}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Section Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#121215] p-3.5 rounded-2xl border border-violet-100/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'financeiro', label: '📊 DRE Financeiro' },
            { id: 'servicos', label: '✂️ Serviços' },
            { id: 'profissionais', label: '👤 Profissionais' },
            { id: 'clientes', label: '👥 Clientes & Inadimplência' },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setReportSection(sec.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                reportSection === sec.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Exportar para Excel / CSV"
          >
            <Download size={14} />
            Exportar CSV
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-violet-500/20 active:scale-95 transition-all cursor-pointer"
            title="Imprimir relatório"
          >
            <Printer size={14} />
            Imprimir
          </button>
        </div>
      </div>

      {/* SEÇÃO 1: DRE FINANCEIRO GERENCIAL */}
      {reportSection === 'financeiro' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              DRE Gerencial — Demonstrativo do Resultado do Exercício
            </h3>
            <p className="text-xs text-zinc-400">
              Visão estruturada de receitas, custos, despesas operacionais e resultado líquido
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* 1. Receita Bruta */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
              <span className="font-sans">(+) RECEITA BRUTA DE SERVIÇOS:</span>
              <span className="text-sm">{formatCurrency(grossRevenue)}</span>
            </div>

            {/* 2. Deduções */}
            <div className="px-3 flex items-center justify-between text-zinc-500">
              <span className="font-sans">(-) Taxas de Cartão & Descontos Comerciais:</span>
              <span className="text-rose-600 dark:text-rose-400">
                - {formatCurrency(cardFeesDeductions)}
              </span>
            </div>

            {/* 3. Receita Líquida */}
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
              <span className="font-sans">(=) RECEITA OPERACIONAL LÍQUIDA:</span>
              <span className="text-sm">{formatCurrency(netRevenue)}</span>
            </div>

            {/* 4. Custos com Fornecedores & Mercadorias */}
            <div className="px-3 flex items-center justify-between text-zinc-500">
              <span className="font-sans">(-) Custos com Fornecedores & Mercadorias:</span>
              <span className="text-rose-600 dark:text-rose-400">
                - {formatCurrency(supplierExpenses)}
              </span>
            </div>

            {/* 5. Despesas Operacionais */}
            <div className="px-3 flex items-center justify-between text-zinc-500">
              <span className="font-sans">(-) Despesas com Estrutura (Aluguel, Luz, Net, Mkt):</span>
              <span className="text-rose-600 dark:text-rose-400">
                - {formatCurrency(operationalExpenses)}
              </span>
            </div>

            {/* 6. Folha & Comissões */}
            <div className="px-3 flex items-center justify-between text-zinc-500">
              <span className="font-sans">(-) Salários da Equipe & Comissões:</span>
              <span className="text-rose-600 dark:text-rose-400">
                - {formatCurrency(payrollAndCommissions)}
              </span>
            </div>

            {/* 7. Tributos */}
            <div className="px-3 flex items-center justify-between text-zinc-500">
              <span className="font-sans">(-) Impostos & Tributos (DAS):</span>
              <span className="text-rose-600 dark:text-rose-400">
                - {formatCurrency(taxes)}
              </span>
            </div>

            {/* 8. Lucro Líquido Final */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-between shadow-md shadow-violet-500/20">
              <div>
                <span className="font-sans text-sm font-bold block">
                  (=) LUCRO LÍQUIDO DO PERÍODO
                </span>
                <span className="text-[11px] text-violet-200 font-sans">
                  Margem Líquida Real: {profitMarginDRE}%
                </span>
              </div>
              <span className="text-2xl font-black">{formatCurrency(netProfitDRE)}</span>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 2: RELATÓRIO DE SERVIÇOS */}
      {reportSection === 'servicos' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Performance de Serviços
            </h3>
            <p className="text-xs text-zinc-400">
              Volume de atendimentos, faturamento acumulado e ticket médio por procedimento
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-bold">Serviço</th>
                  <th className="pb-3 font-bold text-center">Atendimentos</th>
                  <th className="pb-3 font-bold text-right">Ticket Médio</th>
                  <th className="pb-3 font-bold text-right">Faturamento Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                {servicesRanking.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-zinc-400 italic font-sans">
                      Nenhum serviço faturado no período selecionado.
                    </td>
                  </tr>
                ) : (
                  servicesRanking.map((s, idx) => (
                    <tr key={s.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      <td className="py-3 font-sans font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        {s.name}
                      </td>
                      <td className="py-3 text-center font-bold text-zinc-700 dark:text-zinc-300">
                        {s.count}
                      </td>
                      <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">
                        {formatCurrency(s.ticketMedio)}
                      </td>
                      <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(s.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEÇÃO 3: RELATÓRIO DE PROFISSIONAIS */}
      {reportSection === 'profissionais' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Desempenho da Equipe de Profissionais
            </h3>
            <p className="text-xs text-zinc-400">
              Produção individual, faturamento bruto gerado e comissões apuradas
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-bold">Profissional</th>
                  <th className="pb-3 font-bold text-center">Atendimentos</th>
                  <th className="pb-3 font-bold text-right">Faturamento</th>
                  <th className="pb-3 font-bold text-center">Taxa (%)</th>
                  <th className="pb-3 font-bold text-right">Comissão Gerada</th>
                  <th className="pb-3 font-bold text-right">Saldo Pendente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                {commissionSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-zinc-400 italic font-sans">
                      Nenhum profissional com atendimentos no período selecionado.
                    </td>
                  </tr>
                ) : (
                  commissionSummaries.map((p) => (
                    <tr key={p.professional_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      <td className="py-3 font-sans">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          {p.professional_name}
                        </span>
                        <span className="text-[10px] text-zinc-400">{p.role}</span>
                      </td>
                      <td className="py-3 text-center font-bold text-zinc-700 dark:text-zinc-300">
                        {p.appointments_count}
                      </td>
                      <td className="py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(p.total_revenue)}
                      </td>
                      <td className="py-3 text-center text-violet-600 font-bold">
                        {p.commission_percentage}%
                      </td>
                      <td className="py-3 text-right font-bold text-zinc-800 dark:text-zinc-200">
                        {formatCurrency(p.commission_generated)}
                      </td>
                      <td className="py-3 text-right font-extrabold text-amber-600 dark:text-amber-400">
                        {formatCurrency(p.commission_pending)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEÇÃO 4: CLIENTES & INADIMPLÊNCIA */}
      {reportSection === 'clientes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Spenders */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Top Clientes (Maior Faturamento LTV)
              </h3>
              <p className="text-[11px] text-zinc-400">Clientes que mais investiram no negócio</p>
            </div>

            <div className="space-y-2.5">
              {topSpenders.length === 0 ? (
                <p className="text-xs text-zinc-400 italic text-center py-6">
                  Nenhum cliente com consumo registrado ainda.
                </p>
              ) : (
                topSpenders.map((c, idx) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {c.appointments_count} visitas realizadas
                        </span>
                      </div>
                    </div>

                    <span className="font-mono font-extrabold text-violet-600 dark:text-violet-400">
                      {formatCurrency(c.total_spent || 0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inadimplentes (Contas Vencidas) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-rose-100 dark:border-rose-950/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle size={16} />
                  Clientes com Pendências (Inadimplência)
                </h3>
                <p className="text-[11px] text-zinc-400">Cobranças vencidas aguardando liquidação</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                {overdueClients.length} em atraso
              </span>
            </div>

            {overdueClients.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
                Nenhum cliente inadimplente no momento!
              </div>
            ) : (
              <div className="space-y-2.5">
                {overdueClients.map((oc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-rose-900 dark:text-rose-200 block">
                        {oc.customer_name}
                      </span>
                      <span className="text-[10px] text-rose-700/80 dark:text-rose-400 font-mono">
                        {oc.service} • Venceu em {formatDate(oc.due_date)}
                      </span>
                    </div>

                    <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                      {formatCurrency(oc.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
