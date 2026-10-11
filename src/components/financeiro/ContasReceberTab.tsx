import React, { useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency, formatDate, formatPhone } from '../../utils/format';
import { createWhatsAppLink } from '../../services/whatsapp';
import { Receivable, ReceivableStatus, PaymentMethod } from '../../types/financeiro';
import { NovaCobrancaModal } from './NovaCobrancaModal';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MessageCircle,
  Trash2,
  Filter,
  User,
  Scissors,
  Calendar,
} from 'lucide-react';

export function ContasReceberTab() {
  const { receivables, markReceivablePaid, deleteReceivable } = useFinancialStore();
  const { addToast } = useUIStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = receivables.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = r.customer_name.toLowerCase().includes(q);
      const matchService = r.service_name?.toLowerCase().includes(q);
      const matchProf = r.professional_name?.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      return matchName || matchService || matchProf || matchDesc;
    }
    return true;
  });

  const statusBadges: Record<
    ReceivableStatus,
    { label: string; bg: string; text: string; dot: string }
  > = {
    paid: {
      label: 'Pago',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    pending: {
      label: 'Pendente',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    partially_paid: {
      label: 'Sinal Pago',
      bg: 'bg-sky-500/10 dark:bg-sky-500/15',
      text: 'text-sky-700 dark:text-sky-300',
      dot: 'bg-sky-500',
    },
    overdue: {
      label: 'Vencido',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-500',
    },
    cancelled: {
      label: 'Cancelado',
      bg: 'bg-zinc-500/10 dark:bg-zinc-500/15',
      text: 'text-zinc-600 dark:text-zinc-400',
      dot: 'bg-zinc-400',
    },
  };

  const handleCobrarWhatsApp = (r: Receivable) => {
    let msg = `Olá, *${r.customer_name}*! Tudo bem? 👋\n\n`;
    msg += `Estamos passando com um lembrete sobre o pagamento do seu atendimento no *Studio Prime*:\n\n`;
    if (r.service_name) msg += `✂️ *Serviço:* ${r.service_name}\n`;
    if (r.professional_name) msg += `👤 *Profissional:* ${r.professional_name}\n`;
    msg += `🗓 *Vencimento:* ${formatDate(r.due_date)}\n`;
    msg += `💰 *Valor:* ${formatCurrency(r.final_amount - r.amount_paid)}\n\n`;

    if (r.status === 'partially_paid') {
      msg += `(Identificamos o pagamento do sinal de ${formatCurrency(r.amount_paid)}. Restante de ${formatCurrency(r.final_amount - r.amount_paid)})\n\n`;
    }

    msg += `Se preferir pagar via Pix agora mesmo, basta nos solicitar a chave! Caso já tenha pago, por favor desconsidere. Muito obrigado! ✨`;

    const phone = r.customer_phone || '11999999999';
    const link = createWhatsAppLink(phone, msg);
    window.open(link, '_blank', 'noopener,noreferrer');

    addToast({
      type: 'info',
      title: 'WhatsApp Aberto',
      message: `Enviando mensagem de cobrança para ${r.customer_name}...`,
    });
  };

  const handleMarkPaid = (id: string, name: string) => {
    markReceivablePaid(id);
    addToast({
      type: 'success',
      title: 'Pagamento Confirmado!',
      message: `Recebível de ${name} marcado como pago com sucesso.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Bar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#121215] p-3.5 rounded-2xl border border-violet-100/80 dark:border-zinc-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, serviço, profissional..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'paid', label: 'Pagos' },
            { id: 'pending', label: 'Pendentes' },
            { id: 'partially_paid', label: 'Com Sinal' },
            { id: 'overdue', label: 'Vencidos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={() => setIsModalOpen(true)}
            className="ml-auto sm:ml-2 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-violet-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} />
            + Nova Cobrança
          </button>
        </div>
      </div>

      {/* Receivables List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#121215] rounded-2xl border border-violet-100/80 dark:border-zinc-800 space-y-2">
          <DollarSign size={28} className="mx-auto text-zinc-400 opacity-60" />
          <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Nenhuma cobrança encontrada
          </h4>
          <p className="text-xs text-zinc-400">
            Tente mudar o filtro de status ou cadastre uma nova cobrança manual.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((r) => {
            const badge = statusBadges[r.status];
            const remaining = r.final_amount - r.amount_paid;

            return (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm hover:border-violet-300 dark:hover:border-violet-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left Side: Client & Service Info */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                      {r.customer_name}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                    {r.has_signal && r.status !== 'paid' && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-[10px] font-bold">
                        Sinal de {formatCurrency(r.signal_amount || 0)} pago
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {r.service_name && (
                      <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                        <Scissors size={12} className="text-violet-500" />
                        {r.service_name}
                      </span>
                    )}
                    {r.professional_name && (
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-zinc-400" />
                        {r.professional_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-zinc-400" />
                      Venc: {formatDate(r.due_date)}
                    </span>
                    <span className="capitalize px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                      {r.payment_method}
                    </span>
                  </div>

                  {r.notes && (
                    <p className="text-[11px] text-zinc-400 italic mt-0.5">{r.notes}</p>
                  )}
                </div>

                {/* Right Side: Values & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                  <div className="text-left sm:text-right">
                    <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 font-mono block">
                      {formatCurrency(r.final_amount)}
                    </span>
                    {r.status !== 'paid' && remaining > 0 ? (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                        Falta: {formatCurrency(remaining)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                        Quitado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botão de Cobrança / Envio de WhatsApp com dados do agendamento */}
                    <button
                      onClick={() => handleCobrarWhatsApp(r)}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200/80 dark:border-emerald-800/60 transition-all flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
                      title="Cobrar via WhatsApp com mensagem pronta"
                    >
                      <MessageCircle size={14} />
                      <span className="hidden md:inline">WhatsApp</span>
                    </button>

                    {/* Botão Baixa / Liquidar */}
                    {r.status !== 'paid' && (
                      <button
                        onClick={() => handleMarkPaid(r.id, r.customer_name)}
                        className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                        title="Marcar como pago / Liquidar"
                      >
                        <CheckCircle2 size={14} />
                        <span>Receber</span>
                      </button>
                    )}

                    {/* Excluir */}
                    <button
                      onClick={() => {
                        if (confirm(`Excluir cobrança de ${r.customer_name}?`)) {
                          deleteReceivable(r.id);
                        }
                      }}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                      title="Excluir cobrança"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova Cobrança */}
      <NovaCobrancaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
