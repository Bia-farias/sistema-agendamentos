import React, { useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency, formatDate, formatPhone } from '../../utils/format';
import { createWhatsAppLink } from '../../services/whatsapp';
import { NovoFornecedorModal } from './NovoFornecedorModal';
import { NovaMercadoriaModal } from './NovaMercadoriaModal';
import {
  Building2,
  Package,
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  Trash2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

export function FornecedoresMercadoriasTab() {
  const {
    suppliers,
    merchandise,
    adjustStock,
    deleteMerchandise,
    deleteSupplier,
  } = useFinancialStore();
  const { addToast } = useUIStore();

  const [activeSubTab, setActiveSubTab] = useState<'merchandise' | 'suppliers'>('merchandise');
  const [search, setSearch] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isMerchandiseModalOpen, setIsMerchandiseModalOpen] = useState(false);

  // Filter merchandise
  const filteredMerchandise = merchandise.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.supplier_name?.toLowerCase().includes(q) ||
      m.carrier_name?.toLowerCase().includes(q)
    );
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.trade_name?.toLowerCase().includes(q) ||
      s.document.includes(q) ||
      s.carrier_name?.toLowerCase().includes(q)
    );
  });

  const totalStockValue = merchandise.reduce((sum, m) => sum + m.total_cost, 0);
  const totalStockUnits = merchandise.reduce((sum, m) => sum + m.quantity, 0);
  const lowStockCount = merchandise.filter((m) => m.quantity <= m.min_quantity).length;

  const handleCallSupplierWhatsApp = (phone: string, supplierName: string) => {
    const msg = `Olá, equipe da *${supplierName}*! Tudo bem? 👋\n\nAqui é do salão/clínica *Studio Prime*. Gostaríamos de solicitar uma cotação e novo pedido de reposição de mercadorias. Poderiam nos atender? ✨`;
    const link = createWhatsAppLink(phone, msg);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Selector & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#121215] p-3.5 rounded-2xl border border-violet-100/80 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <button
            onClick={() => setActiveSubTab('merchandise')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'merchandise'
                ? 'bg-white dark:bg-[#181424] text-violet-600 dark:text-violet-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Package size={14} />
            Mercadorias & Estoque ({merchandise.length})
          </button>

          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'suppliers'
                ? 'bg-white dark:bg-[#181424] text-violet-600 dark:text-violet-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Building2 size={14} />
            Fornecedores & Transportadoras ({suppliers.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={
                activeSubTab === 'merchandise'
                  ? 'Buscar mercadoria, fornecedor...'
                  : 'Buscar fornecedor, CNPJ, frete...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
            />
          </div>

          {activeSubTab === 'merchandise' ? (
            <button
              onClick={() => setIsMerchandiseModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-violet-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus size={14} />
              + Nova Mercadoria
            </button>
          ) : (
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-violet-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus size={14} />
              + Novo Fornecedor
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: MERCADORIAS & ESTOQUE */}
      {activeSubTab === 'merchandise' && (
        <div className="space-y-4">
          {/* Quick Stock Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Valor Total em Mercadorias
              </span>
              <span className="text-xl font-extrabold text-violet-600 dark:text-violet-400 font-mono mt-1 block">
                {formatCurrency(totalStockValue)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Volume de Itens em Estoque
              </span>
              <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono mt-1 block">
                {totalStockUnits} itens
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                Itens com Estoque Baixo
              </span>
              <span className="text-xl font-extrabold text-orange-600 font-mono mt-1 block">
                {lowStockCount} produtos
              </span>
            </div>
          </div>

          {/* Merchandise Items List */}
          {filteredMerchandise.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#121215] rounded-2xl border border-violet-100/80 dark:border-zinc-800 text-xs text-zinc-400">
              Nenhuma mercadoria encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredMerchandise.map((m) => {
                const isLow = m.quantity <= m.min_quantity;

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-[#121215] border shadow-sm transition-all space-y-3 ${
                      isLow
                        ? 'border-orange-300/80 dark:border-orange-900/50 bg-orange-50/10'
                        : 'border-violet-100/80 dark:border-zinc-800 hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {m.name}
                          </h4>
                          {isLow && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-[10px] font-bold shrink-0">
                              <AlertTriangle size={11} /> Repor!
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {m.supplier_name && (
                            <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                              <Building2 size={12} className="text-violet-500" />
                              {m.supplier_name}
                            </span>
                          )}
                          {m.carrier_name && (
                            <span className="flex items-center gap-1 text-zinc-500">
                              <Truck size={12} className="text-zinc-400" />
                              {m.carrier_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock Quantity Adjuster */}
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 shrink-0">
                        <button
                          onClick={() => adjustStock(m.id, -1)}
                          className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                          title="Dar saída de 1 item"
                        >
                          <MinusCircle size={15} />
                        </button>
                        <span className="font-mono font-extrabold text-sm px-1.5 text-zinc-900 dark:text-zinc-100">
                          {m.quantity} {m.unit}
                        </span>
                        <button
                          onClick={() => adjustStock(m.id, 1)}
                          className="p-1 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-emerald-600 transition-colors cursor-pointer"
                          title="Dar entrada de 1 item"
                        >
                          <PlusCircle size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Financial details & delete */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 font-mono">
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Custo Unit:</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {formatCurrency(m.cost_price)}
                          </span>
                        </div>
                        {m.sale_price && (
                          <div>
                            <span className="text-[10px] text-zinc-400 block">Preço Venda:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(m.sale_price)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Total em Estoque:</span>
                          <span className="font-extrabold text-violet-600 dark:text-violet-400">
                            {formatCurrency(m.total_cost)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Remover mercadoria \"${m.name}\"?`)) {
                            deleteMerchandise(m.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                        title="Remover mercadoria"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: FORNECEDORES & TRANSPORTADORAS */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-4">
          {filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#121215] rounded-2xl border border-violet-100/80 dark:border-zinc-800 text-xs text-zinc-400">
              Nenhum fornecedor encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuppliers.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-3 hover:border-violet-300 dark:hover:border-violet-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        {s.trade_name || s.name}
                      </h4>
                      {s.trade_name && (
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">{s.name}</p>
                      )}
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 text-[10px] font-semibold">
                        {s.category}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCallSupplierWhatsApp(s.phone, s.trade_name || s.name)}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {/* Transportadora Parceira Highlight Card */}
                  {s.carrier_name && (
                    <div className="p-2.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 flex items-center gap-2 text-xs">
                      <Truck size={15} className="text-violet-600 dark:text-violet-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-zinc-400 block font-medium">
                          Transportadora Parceira:
                        </span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {s.carrier_name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-zinc-400">CNPJ/CPF:</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">{s.document}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone size={12} className="text-zinc-400" />
                      <span>{formatPhone(s.phone)}</span>
                    </p>
                    {s.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail size={12} className="text-zinc-400" />
                        <span>{s.email}</span>
                      </p>
                    )}
                    {s.address && (
                      <p className="text-[11px] text-zinc-400 truncate mt-1">{s.address}</p>
                    )}
                  </div>

                  {/* Footer & Delete */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                    {s.notes && (
                      <span className="text-[10px] text-zinc-400 italic truncate max-w-[240px]">
                        {s.notes}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Excluir fornecedor \"${s.trade_name || s.name}\"?`)) {
                          deleteSupplier(s.id);
                        }
                      }}
                      className="ml-auto p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Excluir fornecedor"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <NovoFornecedorModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
      />
      <NovaMercadoriaModal
        isOpen={isMerchandiseModalOpen}
        onClose={() => setIsMerchandiseModalOpen(false)}
      />
    </div>
  );
}
