import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  QrCode,
  Zap,
  FileText,
  Clock,
  History,
  CheckCircle2,
  CheckCheck,
  AlertCircle,
  TrendingUp,
  Smartphone,
  Send,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';
import { useWhatsAppStore } from '../stores/whatsappStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/ui/Button';
import { WhatsAppRuleCard } from '../components/whatsapp/WhatsAppRuleCard';
import { WhatsAppBubblePreview } from '../components/whatsapp/WhatsAppBubblePreview';
import { WhatsAppQRCodeModal } from '../components/whatsapp/WhatsAppQRCodeModal';
import { WhatsAppReactivationTab } from '../components/whatsapp/WhatsAppReactivationTab';
import { cn } from '../utils/cn';

export default function WhatsAppPage() {
  const {
    connection,
    rules,
    templates,
    logs,
    setQrModalOpen,
    updateTemplate,
    createTemplate,
    deleteTemplate,
    disconnectWhatsApp,
    clearLogs,
    sendMessage,
    fetchWhatsAppStatus,
    fetchLogs,
  } = useWhatsAppStore();

  const { addToast } = useUIStore();

  useEffect(() => {
    fetchWhatsAppStatus();
    fetchLogs();
  }, [fetchWhatsAppStatus, fetchLogs]);

  const [activeTab, setActiveTab] = useState<
    'rules' | 'templates' | 'recovery' | 'logs' | 'connection'
  >('rules');

  // Template editor states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || 'tpl-1'
  );
  const [editingContent, setEditingContent] = useState<string>(
    templates[0]?.content || ''
  );
  const [editingName, setEditingName] = useState<string>(
    templates[0]?.name || ''
  );
  const [isSaved, setIsSaved] = useState(false);

  // Quick message modal / trigger state
  const [logFilter, setLogFilter] = useState<'all' | 'delivered' | 'read' | 'failed'>('all');

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const target = templates.find((t) => t.id === id);
    if (target) {
      setEditingContent(target.content);
      setEditingName(target.name);
    }
  };

  const handleInsertTag = (tag: string) => {
    setEditingContent((prev) => `${prev} ${tag}`);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    updateTemplate(selectedTemplate.id, editingContent, editingName);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    addToast({
      type: 'success',
      title: 'Modelo Salvo',
      message: 'O modelo de mensagem foi atualizado com sucesso!',
    });
  };

  const activeRulesCount = rules.filter((r) => r.isActive).length;

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.status === logFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              Automação & WhatsApp
            </h1>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                connection.status === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  connection.status === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-rose-500'
                )}
              />
              {connection.status === 'connected'
                ? `Conectado: ${connection.phoneNumber}`
                : 'Desconectado'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Reduza faltas em até 85% com lembretes automáticos e mensagens no WhatsApp dos seus clientes
          </p>
        </div>

        <div className="flex items-center gap-3">
          {connection.status === 'connected' ? (
            <Button
              variant="outline"
              onClick={disconnectWhatsApp}
              className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-900/30"
            >
              Desconectar
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setQrModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 text-xs font-bold"
            >
              <QrCode size={16} />
              Conectar WhatsApp (QR Code)
            </Button>
          )}
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#121216] border border-violet-100/70 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Disparos este mês</span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <MessageSquare size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
            {connection.totalSentThisMonth}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <TrendingUp size={12} />
            +28% em relação ao mês anterior
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#121216] border border-violet-100/70 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Taxa de Confirmação</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
            {connection.confirmationRate}%
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Faltas reduzidas a menos de 8%
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#121216] border border-violet-100/70 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Automações Ativas</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
            {activeRulesCount} <span className="text-sm font-semibold text-zinc-400">/ {rules.length}</span>
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Monitoramento 24h ativado
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-[#121216] border border-violet-100/70 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Clientes Resgatados</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <RefreshCw size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
            12
          </p>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
            +R$ 1.840 gerados em retornos
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-violet-100 dark:border-zinc-800/80 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('rules')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'rules'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <Clock size={16} />
          Lembretes Automáticos ({activeRulesCount})
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'templates'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <FileText size={16} />
          Modelos de Mensagens ({templates.length})
        </button>

        <button
          onClick={() => setActiveTab('recovery')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'recovery'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <Zap size={16} />
          Campanhas & Reativação
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold border border-violet-500/20">
            PRO
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'logs'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <History size={16} />
          Histórico de Envios ({logs.length})
        </button>

        <button
          onClick={() => setActiveTab('connection')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer',
            activeTab === 'connection'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <Smartphone size={16} />
          Conexão & API
        </button>
      </div>

      {/* TAB CONTENT: RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Réguas de Disparo Automático
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ative ou desative os momentos exatos em que as mensagens serão enviadas aos clientes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rules.map((rule) => {
              const ruleTemplate = templates.find((t) => t.id === rule.templateId);
              return (
                <WhatsAppRuleCard
                  key={rule.id}
                  rule={rule}
                  template={ruleTemplate}
                  onSelectTemplate={(templateId) => {
                    handleSelectTemplate(templateId);
                    setActiveTab('templates');
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TEMPLATES EDITOR */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Template Selection Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Escolher Modelo
            </h3>

            <div className="space-y-2">
              {templates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={cn(
                      'w-full text-left p-3.5 rounded-2xl border transition-all text-xs flex flex-col gap-1 cursor-pointer',
                      isSelected
                        ? 'bg-violet-50/80 dark:bg-violet-950/30 border-violet-400 text-violet-950 dark:text-violet-200 shadow-xs'
                        : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{tpl.name}</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {tpl.content.replace(/\n/g, ' ')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block mb-1">
                  Nome do Modelo
                </label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-violet-400 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Mensagem
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Use *negrito* e quebras de linha
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full text-xs px-3.5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-violet-400 focus:outline-hidden resize-none font-mono"
                  placeholder="Digite a mensagem..."
                />
              </div>

              {/* Dynamic Variables Pill Toolbar */}
              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block mb-2">
                  Inserir Tags Dinâmicas (clique para adicionar):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '{cliente_nome}',
                    '{data}',
                    '{horario}',
                    '{servico}',
                    '{profissional}',
                    '{empresa}',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 border border-zinc-200 dark:border-zinc-700 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
                <Button
                  variant="primary"
                  onClick={handleSaveTemplate}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
                >
                  {isSaved ? (
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <Check size={14} /> Salvo!
                    </span>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* WhatsApp Bubble Live Preview */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Preview Realista
            </h3>
            <WhatsAppBubblePreview
              content={editingContent}
              templateName={editingName}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: RECOVERY / CAMPAIGNS */}
      {activeTab === 'recovery' && <WhatsAppReactivationTab />}

      {/* TAB CONTENT: LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Histórico de Mensagens Enviadas
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Registro de todas as confirmações e lembretes disparados pelo sistema
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter pills */}
              <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
                {(['all', 'read', 'delivered'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setLogFilter(filter)}
                    className={cn(
                      'px-3 py-1 rounded-lg transition-colors cursor-pointer',
                      logFilter === filter
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    )}
                  >
                    {filter === 'all'
                      ? 'Todos'
                      : filter === 'read'
                      ? 'Lidos'
                      : 'Entregues'}
                  </button>
                ))}
              </div>

              {logs.length > 0 && (
                <button
                  onClick={clearLogs}
                  className="p-2 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  title="Limpar Histórico"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-medium">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Telefone</th>
                  <th className="py-3 px-4">Tipo de Mensagem</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Enviado em</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400">
                      Nenhum registro de envio com esse filtro.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        {log.customerName}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                        {log.customerPhone}
                      </td>
                      <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                        {log.templateName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold',
                            log.status === 'read'
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                              : log.status === 'delivered'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20'
                          )}
                        >
                          {log.status === 'read' ? (
                            <>
                              <CheckCheck size={12} className="text-sky-500" /> Lido
                            </>
                          ) : log.status === 'delivered' ? (
                            <>
                              <CheckCheck size={12} /> Entregue
                            </>
                          ) : (
                            <>
                              <Check size={12} /> Enviado
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">{log.sentAt}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            sendMessage(
                              log.customerName,
                              log.customerPhone,
                              log.message,
                              log.templateName
                            );
                            addToast({
                              type: 'info',
                              message: `Reenviando mensagem para ${log.customerName}...`,
                            });
                          }}
                          className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                        >
                          Reenviar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CONNECTION & API */}
      {activeTab === 'connection' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Instância WhatsApp */}
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Instância WhatsApp Business
                </h3>
                <p className="text-xs text-zinc-500">
                  {connection.status === 'connected' ? 'Sessão Ativa' : 'Desconectado'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Instância:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {connection.instanceName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Telefone Conectado:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {connection.phoneNumber || 'Não conectado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Bateria do Celular:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {connection.batteryLevel}% (Carregando)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Última Sincronização:</span>
                <span className="text-zinc-500">{connection.lastSyncAt}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {connection.status === 'connected' ? (
                <Button
                  variant="outline"
                  onClick={disconnectWhatsApp}
                  className="w-full text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30 text-xs"
                >
                  Desconectar Instância
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setQrModalOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Conectar via QR Code
                </Button>
              )}
            </div>
          </div>

          {/* Card 2: Detalhes Técnicos & Webhook */}
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Configuração de Webhook
                </h3>
                <p className="text-xs text-zinc-500">
                  Respostas dos clientes como confirmações e cancelamentos
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">
                  URL de Webhook (Evolution / Z-API):
                </span>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                  <span className="truncate flex-1">
                    https://api.agendaai.com.br/v1/webhook/whatsapp/studio-prime
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        'https://api.agendaai.com.br/v1/webhook/whatsapp/studio-prime'
                      );
                      addToast({
                        type: 'success',
                        message: 'URL do Webhook copiada!',
                      });
                    }}
                    className="p-1 hover:text-violet-600 text-zinc-400"
                    title="Copiar URL"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 size={14} />
                <span>Webhooks ativos: Mensagens recebidas, Alterações de status</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              O sistema detecta automaticamente se o cliente respondeu "1" (Confirmar) ou "2" (Remarcar) e atualiza o status do agendamento em tempo real na sua Agenda.
            </p>
          </div>
        </div>
      )}

      {/* QR Code Connection Modal */}
      <WhatsAppQRCodeModal />
    </div>
  );
}
