import React, { useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency, formatDate } from '../../utils/format';
import { Payable, PayableCategory, PayableStatus } from '../../types/financeiro';
import { NovaDespesaModal } from './NovaDespesaModal';
import {
  TrendingDown,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Trash2,
  Tag,
  Calendar,
} from 'lucide-react';

export function ContasPagarTab() {
  const { payables, markPayablePaid, deletePayable } = useFinancialStore();
  const { addToast } = useUIStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const today = new Date().toISOString().split('T')[0];

  const filtered = payables.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchSup = p.supplier_name?.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      return matchDesc || matchSup || matchCat;
    }
    return true;
  });

  const categoryLabels: Record<PayableCategory, { label: string; icon: string }> = {
    aluguel: { label: 'Aluguel', icon: '🏢' },
    salarios: { label: 'Salários', icon: '👥' },
    funcionarios: { label: 'Funcionários', icon: '💼' },
    fornecedores: { label: 'Fornecedores', icon: '📦' },
    materiais: { label: 'Materiais', icon: '🧴' },
    energia: { label: 'Energia & Água', icon: '💡' },
    internet: { label: 'Internet', icon: '🌐' },
    marketing: { label: 'Marketing', icon: '📢' },
    impostos: { label: 'Impostos (DAS)', icon: '🏛' },
    comissoes: { label: 'Comissões', icon: '✂️' },
    outros: { label: 'Outros', icon: '⚙️' },
  };

  const statusBadges: Record<
    PayableStatus,
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

  const handlePay = (id: string, description: string) => {
    markPayablePaid(id);
    addToast({
      type: 'success',
      title: 'Despesa Paga!',
      message: `Conta \"${description}\" liquidada com sucesso.`,
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
            placeholder="Buscar por descrição, fornecedor, categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-700 dark:text-zinc-300 px-3 py-1.5 focus:outline-none"
          >
            <option value="all">Todas as Categorias</option>
            <option value="aluguel">Aluguel & Estrutura</option>
            <option value="salarios">Salários</option>
            <option value="fornecedores">Fornecedores</option>
            <option value="materiais">Materiais</option>
            <option value="energia">Energia</option>
            <option value="internet">Internet</option>
            <option value="marketing">Marketing</option>
            <option value="impostos">Impostos (DAS)</option>
            <option value="comissoes">Comissões</option>
          </select>

          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: 'Pendentes' },
              { id: 'overdue', label: 'Vencidos' },
              { id: 'paid', label: 'Pagos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="ml-auto sm:ml-2 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-rose-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} />
            + Nova Despesa
          </button>
        </div>
      </div>

      {/* Payables List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#121215] rounded-2xl border border-violet-100/80 dark:border-zinc-800 space-y-2">
          <TrendingDown size={28} className="mx-auto text-zinc-400 opacity-60" />
          <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Nenhuma conta a pagar encontrada
          </h4>
          <p className="text-xs text-zinc-400">
            Tente alterar os filtros de categoria e status ou adicione uma nova despesa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((p) => {
            const badge = statusBadges[p.status];
            const cat = categoryLabels[p.category] || { label: p.category, icon: '🏷' };
            const isLate = p.status !== 'paid' && p.due_date < today;

            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm hover:border-rose-300 dark:hover:border-rose-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left Side: Description & Details */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                      {p.description}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                    {isLate && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                        Atrasada
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                      <span>{cat.icon}</span> {cat.label}
                    </span>
                    {p.supplier_name && (
                      <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <Building2 size={12} className="text-zinc-400" />
                        {p.supplier_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-zinc-400" />
                      Venc: {formatDate(p.due_date)}
                    </span>
                    {p.payment_method && (
                      <span className="capitalize px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium">
                        {p.payment_method}
                      </span>
                    )}
                  </div>

                  {p.notes && (
                    <p className="text-[11px] text-zinc-400 italic mt-0.5">{p.notes}</p>
                  )}
                </div>

                {/* Right Side: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                  <div className="text-left sm:text-right">
                    <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 font-mono block">
                      {formatCurrency(p.amount)}
                    </span>
                    {p.status === 'paid' ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                        Pago em {formatDate(p.paid_at || p.due_date)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 block">
                        Aguardando quitação
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {p.status !== 'paid' && (
                      <button
                        onClick={() => handlePay(p.id, p.description)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                        title="Marcar como paga / Liquidar"
                      >
                        <CheckCircle2 size={14} />
                        <span>Pagar</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Excluir despesa \"${p.description}\"?`)) {
                          deletePayable(p.id);
                        }
                      }}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                      title="Excluir despesa"
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

      {/* Modal Nova Despesa */}
      <NovaDespesaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
