import React, { useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency } from '../../utils/format';
import { createWhatsAppLink } from '../../services/whatsapp';
import {
  Scissors,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  User,
  Users,
  MessageCircle,
  Percent,
} from 'lucide-react';

export function ComissoesTab() {
  const { getCommissionSummaries, payCommission } = useFinancialStore();
  const { addToast } = useUIStore();

  const summaries = getCommissionSummaries();

  const totalGenerated = summaries.reduce((sum, c) => sum + c.commission_generated, 0);
  const totalPaid = summaries.reduce((sum, c) => sum + c.commission_paid, 0);
  const totalPending = summaries.reduce((sum, c) => sum + c.commission_pending, 0);

  const handlePayCommission = (
    profId: string,
    profName: string,
    pendingAmount: number
  ) => {
    if (pendingAmount <= 0) {
      addToast({
        type: 'info',
        title: 'Sem pendências',
        message: `As comissões de ${profName} já estão totalmente quitadas.`,
      });
      return;
    }

    if (
      confirm(
        `Confirmar pagamento de ${formatCurrency(pendingAmount)} de comissão para ${profName}?\nUma despesa será lançada automaticamente no Contas a Pagar.`
      )
    ) {
      payCommission(profId, profName, pendingAmount);
      addToast({
        type: 'success',
        title: 'Comissão Paga!',
        message: `Pagamento de ${formatCurrency(pendingAmount)} lançado para ${profName}.`,
      });
    }
  };

  const handleSendReportWhatsApp = (summary: (typeof summaries)[0]) => {
    let msg = `Olá, *${summary.professional_name}*! 👋\n\n`;
    msg += `Aqui está o seu demonstrativo de comissões do período no *Studio Prime*:\n\n`;
    msg += `✂️ *Atendimentos Realizados:* ${summary.appointments_count}\n`;
    msg += `💰 *Faturamento Gerado:* ${formatCurrency(summary.total_revenue)}\n`;
    msg += `📊 *Taxa de Comissão:* ${summary.commission_percentage}%\n`;
    msg += `💵 *Comissão Total Gerada:* ${formatCurrency(summary.commission_generated)}\n`;
    msg += `✅ *Comissão Já Paga:* ${formatCurrency(summary.commission_paid)}\n`;
    msg += `⏳ *Saldo a Receber:* *${formatCurrency(summary.commission_pending)}*\n\n`;
    msg += `Qualquer dúvida sobre os atendimentos, estamos à disposição na recepção! ✨`;

    const link = createWhatsAppLink('11999999999', msg);
    window.open(link, '_blank', 'noopener,noreferrer');

    addToast({
      type: 'info',
      title: 'WhatsApp Aberto',
      message: `Enviando demonstrativo de comissão para ${summary.professional_name}...`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
            Comissões Geradas
          </span>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1 font-mono">
            {formatCurrency(totalGenerated)}
          </p>
          <span className="text-[11px] text-zinc-400 block mt-1">
            Total acumulado com base nos atendimentos
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
            Comissões Já Pagas
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {formatCurrency(totalPaid)}
          </p>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400 block mt-1">
            Lançadas e liquidadas em Contas a Pagar
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
            Comissões Pendentes
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {formatCurrency(totalPending)}
          </p>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-400 block mt-1">
            Aguardando repasse aos profissionais
          </span>
        </div>
      </div>

      {/* Professionals Commission Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Fechamento por Profissional ({summaries.length})
          </h3>
          <span className="text-xs text-zinc-400">Comissões configuráveis por profissional</span>
        </div>

        {summaries.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#121215] rounded-2xl border border-violet-100/80 dark:border-zinc-800 space-y-2">
            <Users size={28} className="mx-auto text-zinc-400 opacity-60" />
            <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Nenhum profissional encontrado
            </h4>
            <p className="text-xs text-zinc-400">
              Cadastre sua equipe na aba Equipe e lance atendimentos para acompanhar as comissões.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summaries.map((s) => (
              <div
                key={s.professional_id}
                className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-4 hover:border-violet-300 dark:hover:border-violet-500/40 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-violet-500/25">
                      {s.professional_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {s.professional_name}
                      </h4>
                      <p className="text-xs text-zinc-400">{s.role}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold text-xs">
                    {s.commission_percentage}% comissão
                  </span>
                </div>

                {/* Metrics Grid matching user example: Atendimentos, Faturamento, Gerada, Paga, Pendente */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60">
                    <span className="text-[10px] text-zinc-400 block font-sans">Atendimentos</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {s.appointments_count}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60">
                    <span className="text-[10px] text-zinc-400 block font-sans">Faturamento</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {formatCurrency(s.total_revenue)}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60">
                    <span className="text-[10px] text-zinc-400 block font-sans">Comissão Gerada</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(s.commission_generated)}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-sans">
                      Já Paga
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(s.commission_paid)}
                    </span>
                  </div>
                </div>

                {/* Pending Highlight & Action */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block uppercase tracking-wider">
                      Saldo Pendente a Pagar:
                    </span>
                    <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                      {formatCurrency(s.commission_pending)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendReportWhatsApp(s)}
                      className="p-2 rounded-xl bg-white dark:bg-zinc-800 text-emerald-600 hover:bg-emerald-50 border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer"
                      title="Enviar extrato de comissão no WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </button>

                    <button
                      onClick={() =>
                        handlePayCommission(
                          s.professional_id,
                          s.professional_name,
                          s.commission_pending
                        )
                      }
                      disabled={s.commission_pending <= 0}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      Pagar Comissão
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
