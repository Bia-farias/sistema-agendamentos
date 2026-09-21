import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, Zap, Shield, Crown, ArrowRight } from 'lucide-react';
import { SITE_CONFIG } from '../../constants/siteConfig';

export const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      id: 'free_single',
      name: 'Free 7 Dias Single',
      tagline: 'Ideal para profissionais autônomos que desejam testar todo o poder da automação.',
      priceMonthly: 0,
      priceAnnual: 0,
      periodLabel: '7 dias grátis',
      badge: 'Teste Sem Cartão',
      badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      icon: Zap,
      highlight: false,
      ctaText: 'Começar 7 Dias Grátis',
      ctaVariant: 'outline',
      features: [
        '1 Profissional ativo (Single)',
        'Agendamentos ilimitados durante o teste',
        'Gestão completa de clientes (CRM)',
        'Catálogo de serviços personalizado',
        'Lembretes automáticos no WhatsApp',
        'Visualização diária, semanal e mensal',
        'Sem necessidade de cartão de crédito',
      ],
    },
    {
      id: 'advance',
      name: 'Advance',
      tagline: 'O plano mais escolhido por salões, barbearias e clínicas que buscam crescer rápido.',
      priceMonthly: 89.9,
      priceAnnual: 69.9,
      periodLabel: '/mês',
      badge: 'Mais Popular ⭐',
      badgeColor: 'bg-violet-600 text-white shadow-md shadow-violet-500/25',
      icon: Sparkles,
      highlight: true,
      ctaText: 'Assinar Plano Advance',
      ctaVariant: 'primary',
      features: [
        'Até 5 profissionais na equipe',
        'Agendamentos e clientes ilimitados',
        'WhatsApp automatizado completo (24h e 2h antes)',
        'Confirmação de presença automática (1 para sim, 2 para remarcar)',
        'Assistente de IA integrado (Llama 3.3)',
        'Controle automático de comissões por colaborador',
        'Painel com KPIs e métricas em tempo real',
        'Suporte prioritário via WhatsApp',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tagline: 'Para grandes redes, franquias e clínicas que precisam de escala máxima e recursos exclusivos.',
      priceMonthly: 199.9,
      priceAnnual: 159.9,
      periodLabel: '/mês',
      badge: 'Corporativo & Redes',
      badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
      icon: Crown,
      highlight: false,
      ctaText: 'Falar com Consultor VIP',
      ctaVariant: 'outline',
      features: [
        'Profissionais ilimitados',
        'Suporte a múltiplas unidades e filiais',
        'Disparos em massa para recuperação de inativos',
        'IA com personalização avançada do tom de voz',
        'Níveis de acesso personalizados (Super Adm, Adm, etc.)',
        'Relatórios financeiros avançados e DRE',
        'API aberta para integrações externas',
        'Gerente de conta dedicado & Onboarding VIP',
      ],
    },
  ];

  return (
    <section id="planos" className="py-24 relative overflow-hidden bg-white dark:bg-[#0d0a17]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-400/10 dark:bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100/80 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase tracking-wider border border-violet-200/60 dark:border-violet-800/40">
            <Sparkles size={14} className="text-violet-600 dark:text-violet-400" />
            Planos Transparentes e Sem Surpresas
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            Escolha o plano perfeito para o tamanho do seu negócio
          </h2>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
            Comece com 7 dias grátis sem colocar o cartão de crédito e faça upgrade quando sua agenda estiver cheia.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="pt-4 flex items-center justify-center">
            <div className="p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <span>Anual</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold uppercase">
                  -20% OFF
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-14 items-stretch">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-violet-500/10 via-white to-white dark:from-violet-950/40 dark:via-[#151124] dark:to-[#151124] border-2 border-violet-500 shadow-xl shadow-violet-500/10 scale-100 lg:-translate-y-2'
                    : 'bg-white dark:bg-[#120f20] border border-zinc-200/80 dark:border-zinc-800/80 hover:border-violet-300 dark:hover:border-violet-700/60 shadow-md'
                }`}
              >
                {/* Badge Top */}
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Icon size={24} />
                  </div>
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${plan.badgeColor}`}
                  >
                    {plan.badge}
                  </span>
                </div>

                {/* Plan Info */}
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 min-h-[36px]">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mt-6 mb-8 flex items-baseline gap-1.5">
                    {plan.priceMonthly === 0 ? (
                      <span className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                        Grátis
                      </span>
                    ) : (
                      <>
                        <span className="text-xs sm:text-sm font-bold text-zinc-500">R$</span>
                        <span className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                          {price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-zinc-500">
                          {plan.periodLabel}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 mb-6" />

                  {/* Features List */}
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                        <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action CTA */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                  <Link
                    to={
                      plan.id === 'enterprise'
                        ? `https://wa.me/${SITE_CONFIG.contact.whatsappNumber}?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20o%20plano%20Enterprise%20do%20Agenda%20AI.`
                        : `/register?plan=${plan.id}`
                    }
                    className={`w-full py-3.5 px-5 rounded-2xl text-center text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all duration-200 ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5'
                        : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 shadow-sm'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight size={16} />
                  </Link>

                  <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500 mt-2.5">
                    {plan.id === 'free_single'
                      ? 'Sem fidelidade • Cancele quando quiser'
                      : 'Ativação instantânea • Suporte humanizado'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
