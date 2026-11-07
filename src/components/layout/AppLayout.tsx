import React from 'react';
import { Outlet } from 'react-router-dom';
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

export function AppLayout() {
  useVisualViewport();

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
