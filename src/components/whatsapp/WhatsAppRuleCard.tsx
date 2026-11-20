import React from 'react';
import {
  CheckCircle2,
  CalendarClock,
  Clock,
  Star,
  Sparkles,
  Edit3,
  Send,
  Zap,
} from 'lucide-react';
import { WhatsAppReminderRule, WhatsAppTemplate } from '../../types';
import { useWhatsAppStore } from '../../stores/whatsappStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../utils/cn';

interface WhatsAppRuleCardProps {
  rule: WhatsAppReminderRule;
  template?: WhatsAppTemplate;
  onSelectTemplate?: (templateId: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  CheckCircle2,
  CalendarClock,
  Clock,
  Star,
  Sparkles,
};

export function WhatsAppRuleCard({
  rule,
  template,
  onSelectTemplate,
}: WhatsAppRuleCardProps) {
  const { tenant } = useAuthStore();
  const { toggleRule, sendMessage } = useWhatsAppStore();
  const { addToast } = useUIStore();

  const Icon = iconMap[rule.iconName] || Zap;

  const handleToggle = () => {
    toggleRule(rule.id);
    addToast({
      type: 'info',
      message: rule.isActive
        ? `Regra "${rule.title}" foi desativada.`
        : `Regra "${rule.title}" agora está ativa e monitorando agendamentos.`,
    });
  };

  const handleTestTrigger = () => {
    if (!template) return;
    const testMsg = template.content
      .replace(/{cliente_nome}/g, 'Cliente Teste')
      .replace(/{empresa}/g, tenant?.name || 'Sua Empresa')
      .replace(/{data}/g, 'Hoje')
      .replace(/{horario}/g, '14:30')
      .replace(/{servico}/g, 'Corte & Escova')
      .replace(/{profissional}/g, 'Profissional Teste');

    sendMessage('Cliente Teste (Disparo Manual)', '11988887777', testMsg, template.name);

    addToast({
      type: 'success',
      title: 'Disparo de Teste Realizado',
      message: `Mensagem enviada com sucesso no log de histórico.`,
    });
  };

  return (
    <div
      className={cn(
        'p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group',
        rule.isActive
          ? 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-violet-300 dark:hover:border-violet-700/50 hover:shadow-violet-500/5'
          : 'bg-zinc-50/70 dark:bg-zinc-900/30 border-zinc-200/50 dark:border-zinc-800/40 opacity-70'
      )}
    >
      <div>
        {/* Card Header: Icon + Timing + Switch */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                rule.isActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-zinc-200/50 dark:bg-zinc-800 text-zinc-400'
              )}
            >
              <Icon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                {rule.timingDescription}
              </span>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden cursor-pointer shrink-0',
              rule.isActive ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
            )}
            title={rule.isActive ? 'Desativar Automação' : 'Ativar Automação'}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full bg-white shadow-md transition-transform',
                rule.isActive ? 'translate-x-6' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {/* Title & Description */}
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          {rule.title}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
          {rule.description}
        </p>
      </div>

      {/* Footer Details and Actions */}
      <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
        <span className="text-[11px] text-zinc-400 truncate">
          Template:{' '}
          <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">
            {template?.name || 'Padrão'}
          </strong>
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleTestTrigger}
            disabled={!rule.isActive}
            className="p-1.5 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-30"
            title="Enviar mensagem de teste para histórico"
          >
            <Send size={14} />
          </button>

          {onSelectTemplate && (
            <button
              type="button"
              onClick={() => onSelectTemplate(rule.templateId)}
              className="px-2.5 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors flex items-center gap-1"
            >
              <Edit3 size={12} />
              Editar Texto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
