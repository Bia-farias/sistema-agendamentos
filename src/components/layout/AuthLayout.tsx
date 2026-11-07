import { Outlet, Link } from 'react-router-dom';
import { Calendar, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { Sun, Moon } from 'lucide-react';
import { ToastContainer } from '../ui/Toast';

export function AuthLayout() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#faf9ff] dark:bg-[#0d0b14] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Left Branding Showcase Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#13101e] p-12 flex-col justify-between border-r border-violet-900/30">
        {/* Background ambient glowing gradients */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-400 via-violet-300 to-purple-300 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-violet-500/30">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Agenda AI
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  SaaS V1
                </span>
              </span>
              <span className="text-xs text-zinc-400">
                Plataforma Inteligente de Agendamentos & CRM
              </span>
            </div>
          </Link>
        </div>

        {/* Value Proposition Hero */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
            <Sparkles size={14} />
            Potencializado por Inteligência Artificial
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Transforme o agendamento do seu negócio com eficiência e IA.
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Elimine faltas com lembretes automáticos no WhatsApp, organize a escala dos seus profissionais e acompanhe o faturamento em tempo real através de painéis laterais ultra-rápidos.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Calendário interativo semanal e diário com slots inteligentes',
              'Gestão de clientes (CRM) e histórico completo de atendimentos',
              'Disparo de lembretes e confirmações direto no WhatsApp',
              'Controle de serviços, preços, comissões e horários da equipe',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs text-zinc-300">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 pt-6 border-t border-violet-900/30">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-violet-400" />
            <span>Dados protegidos com criptografia e RLS</span>
          </div>
          <span>© 2026 Agenda AI Inc.</span>
        </div>
      </div>

      {/* Right Side: Dynamic Form Container */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative">
        <div className="flex justify-end items-center">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
            title="Alternar tema"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
        </div>

        <div className="w-full max-w-md mx-auto my-auto">
          <Outlet />
        </div>

        <div className="text-center text-xs text-zinc-400 pt-6">
          Precisa de ajuda?{' '}
          <a href="mailto:suporte@agendaai.com" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
            Fale com nosso suporte
          </a>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
