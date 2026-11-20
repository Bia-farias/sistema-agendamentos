import React, { useState } from 'react';
import {
  Users,
  Send,
  ExternalLink,
  Gift,
  CheckCircle2,
  Calendar,
  Sparkles,
  PhoneCall,
  Search,
} from 'lucide-react';
import { useCustomerStore } from '../../stores/customerStore';
import { useWhatsAppStore } from '../../stores/whatsappStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Button } from '../ui/Button';
import { WhatsAppBubblePreview } from './WhatsAppBubblePreview';
import { cn } from '../../utils/cn';

export function WhatsAppReactivationTab() {
  const { tenant } = useAuthStore();
  const { customers } = useCustomerStore();
  const { templates, runReactivation, openWhatsAppWeb } = useWhatsAppStore();
  const { addToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Recovery template
  const recoveryTemplate =
    templates.find((t) => t.category === 'recovery') || templates[0];

  // Inactive customers (no visits or last visit > 25 days ago)
  const inactiveCustomers = customers.filter((c) => {
    if (!c.last_visit_at) return true;
    const diffDays = Math.round(
      (Date.now() - new Date(c.last_visit_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 25;
  });

  const filtered = inactiveCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const toggleSelectAll = () => {
    if (selectedCustomerIds.length === filtered.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filtered.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkReactivation = () => {
    const targets = customers.filter((c) => selectedCustomerIds.includes(c.id));
    if (targets.length === 0) {
      addToast({
        type: 'warning',
        message: 'Selecione pelo menos um cliente para disparar a campanha.',
      });
      return;
    }

    setIsExecuting(true);
    setTimeout(() => {
      const names = targets.map((t) => t.name);
      runReactivation(names, recoveryTemplate.id);
      setIsExecuting(false);
      setSelectedCustomerIds([]);
      addToast({
        type: 'success',
        title: 'Campanha Disparada!',
        message: `${names.length} mensagens de reativação foram enviadas com sucesso!`,
      });
    }, 1200);
  };

  const handleDirectWhatsApp = (customer: (typeof customers)[0]) => {
    const personalized = recoveryTemplate.content
      .replace(/{cliente_nome}/g, customer.name.split(' ')[0])
      .replace(/{empresa}/g, tenant?.name || 'Sua Empresa');

    openWhatsAppWeb(customer.phone, personalized);
    addToast({
      type: 'info',
      message: `Abrindo WhatsApp Web para conversar com ${customer.name}...`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Smart Campaign Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-600 via-violet-500 to-purple-600 text-white shadow-xl shadow-violet-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
              <Gift size={13} className="text-amber-300" />
              Campanha de Retorno Automática
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              Reative {inactiveCustomers.length} clientes sumidos este mês
            </h2>
            <p className="text-sm text-violet-100 leading-relaxed">
              Clientes que não agendam há mais de 25 dias têm 3x mais chance de retornar quando recebem uma oferta carinhosa pelo WhatsApp.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Button
              variant="primary"
              onClick={handleBulkReactivation}
              disabled={selectedCustomerIds.length === 0 || isExecuting}
              className="bg-white text-violet-700 hover:bg-white/90 shadow-lg font-bold text-sm px-5 py-3 h-auto"
            >
              <Sparkles size={16} className="text-violet-600" />
              {isExecuting
                ? 'Disparando...'
                : `Disparar para Selecionados (${selectedCustomerIds.length})`}
            </Button>
          </div>
        </div>
      </div>

      {/* Grid: Client Selector & Live Template Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client List (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Users size={16} className="text-violet-500" />
                Clientes Elegíveis para Resgate ({filtered.length})
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Selecione os contatos para envio individual ou em lote
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-violet-400"
              />
            </div>
          </div>

          {/* Select All Bar */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-violet-50/40 dark:bg-zinc-900/60 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-violet-100/60 dark:border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedCustomerIds.length === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
              />
              <span>Selecionar todos ({filtered.length})</span>
            </label>

            <span className="text-[11px] text-zinc-400">
              {selectedCustomerIds.length} selecionado(s)
            </span>
          </div>

          {/* Table / List */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[380px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">
                Nenhum cliente inativo encontrado com este critério.
              </div>
            ) : (
              filtered.map((customer) => {
                const isSelected = selectedCustomerIds.includes(customer.id);
                return (
                  <div
                    key={customer.id}
                    className={cn(
                      'py-3 px-2 flex items-center justify-between gap-3 rounded-xl transition-colors hover:bg-violet-50/30 dark:hover:bg-zinc-900/40',
                      isSelected && 'bg-violet-50/60 dark:bg-violet-950/20'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(customer.id)}
                        className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {customer.name}
                          </p>
                          {customer.is_vip && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              VIP
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-2">
                          <span>{customer.phone}</span>
                          <span>•</span>
                          <span>
                            {customer.last_visit_at
                              ? `Última visita: ${new Date(customer.last_visit_at).toLocaleDateString('pt-BR')}`
                              : 'Nunca agendou'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDirectWhatsApp(customer)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                        title="Abrir no WhatsApp Web"
                      >
                        <ExternalLink size={12} />
                        <span className="hidden sm:inline">Conversar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Campaign Template Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Mensagem de Resgate
            </h4>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Cupom VOLTEI15
            </span>
          </div>

          <WhatsAppBubblePreview
            content={recoveryTemplate.content}
            templateName={recoveryTemplate.name}
            sampleData={{
              cliente_nome: 'Cliente',
              empresa: tenant?.name || 'Sua Empresa',
            }}
          />
        </div>
      </div>
    </div>
  );
}
