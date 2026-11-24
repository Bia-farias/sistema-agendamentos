import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { ToastContainer } from '../ui/Toast';
import { NovoAgendamentoDrawer } from '../agenda/NovoAgendamentoDrawer';
import { AgendamentoDetalheDrawer } from '../agenda/AgendamentoDetalheDrawer';
import { NovoClienteDrawer } from '../clientes/NovoClienteDrawer';
import { ClienteDetalheDrawer } from '../clientes/ClienteDetalheDrawer';
import { NovoServicoDrawer } from '../servicos/NovoServicoDrawer';
import { NovoProfissionalDrawer } from '../profissionais/NovoProfissionalDrawer';
import { AIChatPanel } from '../ai/AIChatPanel';
import { AIFloatingButton } from '../ai/AIFloatingButton';
import { useVisualViewport } from '../../hooks/useVisualViewport';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

export function AppLayout() {
  useVisualViewport();
  const navigate = useNavigate();
  const { isImpersonating, tenant, profile, exitImpersonation } = useAuthStore();
  const { addToast } = useUIStore();

  const handleExitImpersonation = () => {
    exitImpersonation();
    addToast({
      type: 'info',
      title: 'Sessão Master Restaurada',
      message: 'Você retornou ao Painel de Controle Master SaaS.',
    });
    navigate('/empresas');
  };

  const handleMainFocusCapture = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT')
    ) {
      setTimeout(() => {
        target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 220);
    }
  };

  return (
    <div className="flex h-dvh-safe w-full max-w-full overflow-hidden bg-[#faf9ff] dark:bg-[#0d0b14] text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        {/* Banner de Modo de Acesso Master SaaS */}
        {isImpersonating && (
          <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 text-white px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shadow-md z-40 text-xs sm:text-sm shrink-0 border-b border-white/10 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="p-1.5 bg-white/20 rounded-xl shrink-0 backdrop-blur-xs flex items-center justify-center">
                <Building2 size={16} className="text-white" />
              </span>
              <div className="truncate">
                <span className="font-semibold text-violet-200">Acesso Master SaaS:</span>{' '}
                <span className="font-black text-white">
                  Visualizando {tenant?.name || 'Empresa'}
                </span>{' '}
                <span className="hidden sm:inline text-violet-200 font-medium">
                  • Perfil Admin ({profile?.email || ''})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExitImpersonation}
              className="shrink-0 ml-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-violet-900 hover:bg-violet-100 font-extrabold text-xs shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Encerrar visualização e retornar para a lista de Empresas Master"
            >
              <ArrowLeft size={14} className="stroke-[2.5]" />
              <span>Voltar ao Painel Master</span>
            </button>
          </div>
        )}

        <Header />

        <main
          onFocusCapture={handleMainFocusCapture}
          className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:pb-8 p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-7xl mx-auto w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Interactive Drawers (No central modals!) */}
      <NovoAgendamentoDrawer />
      <AgendamentoDetalheDrawer />
      <NovoClienteDrawer />
      <ClienteDetalheDrawer />
      <NovoServicoDrawer />
      <NovoProfissionalDrawer />

      {/* Toast Notification Layer */}
      <ToastContainer />

      {/* AI Assistant */}
      <AIFloatingButton />
      <AIChatPanel />
    </div>
  );
}
