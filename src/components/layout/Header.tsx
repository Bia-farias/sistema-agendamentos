import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Plus,
  Search,
  Calendar,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useCustomerStore } from '../../stores/customerStore';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';

export function Header() {
  const { tenant, profile, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { openNewAppointmentDrawer } = useAppointmentStore();
  const { openNewCustomerDrawer } = useCustomerStore();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isQuickMenuOpen) return;

    const handleOutsideInteraction = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (quickMenuRef.current && target && !quickMenuRef.current.contains(target)) {
        setIsQuickMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsQuickMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isQuickMenuOpen]);

  const notifications = [
    {
      id: 'n1',
      title: 'Novo Agendamento Confirmado',
      description: 'Juliana Mendes confirmou Corte + Escova às 09:00.',
      time: 'Há 10 minutos',
      unread: true,
    },
    {
      id: 'n2',
      title: 'Lembrete de Retorno',
      description: 'Larissa Vasconcelos completou 20 dias da última sessão de unhas.',
      time: 'Há 1 hora',
      unread: true,
    },
    {
      id: 'n3',
      title: 'Meta Diária Atingida! 🎯',
      description: 'O faturamento de hoje ultrapassou R$ 1.000,00.',
      time: 'Há 3 horas',
      unread: false,
    },
  ];

  return (
    <>
      <header className="h-16 border-b border-violet-100/70 dark:border-violet-900/20 bg-white/90 dark:bg-[#13101e]/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_12px_rgba(139,92,246,0.04)]">
        {/* Left Side: Mobile Logo & Global Search */}
        <div className="flex items-center gap-3">
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-400 to-violet-300 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-violet-300/30">
              A
            </div>
            <span className="font-extrabold text-sm tracking-tight text-zinc-800 dark:text-zinc-50">
              Agenda AI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50/60 dark:bg-violet-500/5 border border-violet-100/80 dark:border-violet-800/30 text-xs text-zinc-400 w-64 lg:w-80 transition-all hover:border-violet-200/80 hover:bg-violet-50 dark:hover:bg-violet-500/10 cursor-pointer">
            <Search size={13} className="shrink-0 text-violet-300 dark:text-violet-500" />
            <span className="truncate">Buscar clientes, horários ou serviços...</span>
            <kbd className="hidden lg:inline-block ml-auto text-[10px] bg-white dark:bg-violet-500/10 border border-violet-100 dark:border-violet-700/30 px-1.5 py-0.5 rounded text-violet-400 font-mono shadow-sm">
              Ctrl K
            </kbd>
          </div>
        </div>

        {/* Right Side: Actions, Notifications, Theme Toggle, Profile */}
        <div className="flex items-center gap-2">
          {/* Quick Action Button: New Appointment */}
          <Button
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => openNewAppointmentDrawer()}
            className="hidden sm:inline-flex shadow-sm shadow-violet-400/20"
          >
            Novo Agendamento
          </Button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-400 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all duration-150"
            title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            aria-label="Alternar tema"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-xl text-zinc-400 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all duration-150"
            title="Notificações"
            aria-label="Notificações"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-400 ring-2 ring-white dark:ring-[#13101e]" />
          </button>

          {/* User Avatar Menu Trigger */}
          <div
            ref={quickMenuRef}
            className="relative pl-2 border-l border-violet-100/80 dark:border-violet-800/30"
          >
            <button
              type="button"
              onClick={() => setIsQuickMenuOpen((prev) => !prev)}
              aria-expanded={isQuickMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all duration-150"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-400 to-violet-300 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-violet-300/30">
                {profile?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="hidden xl:block text-left text-xs pr-1">
                <p className="font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">
                  {profile?.full_name || 'Admin'}
                </p>
                <p className="text-[10px] text-zinc-400">{tenant?.name || 'Studio'}</p>
              </div>
            </button>

            {/* Quick Menu Dropdown */}
            {isQuickMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#1a1626] border border-violet-100/80 dark:border-violet-800/30 shadow-xl shadow-violet-200/30 dark:shadow-violet-900/20 py-2 z-50 animate-fade-in text-xs"
              >
                <div className="px-4 py-2.5 border-b border-violet-50 dark:border-violet-800/20">
                  <p className="font-bold text-zinc-800 dark:text-zinc-100">{profile?.full_name}</p>
                  <p className="text-zinc-400 text-[11px] truncate">{profile?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsQuickMenuOpen(false);
                      openNewAppointmentDrawer();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-violet-50 dark:hover:bg-violet-500/10 text-zinc-600 dark:text-zinc-300 flex items-center gap-2 transition-colors"
                  >
                    <Calendar size={14} className="text-violet-400" />
                    Agendar Horário
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsQuickMenuOpen(false);
                      openNewCustomerDrawer();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-violet-50 dark:hover:bg-violet-500/10 text-zinc-600 dark:text-zinc-300 flex items-center gap-2 transition-colors"
                  >
                    <UserPlus size={14} className="text-emerald-500" />
                    Cadastrar Cliente
                  </button>
                </div>
                <div className="pt-1 border-t border-violet-50 dark:border-violet-800/20">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsQuickMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 dark:text-rose-400 font-medium transition-colors"
                  >
                    Sair da Conta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Slide-Over Drawer */}
      <Drawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Bell size={17} className="text-violet-400" />
            Notificações Recentes
          </span>
        }
        description="Fique por dentro das atualizações da sua agenda e clientes"
        size="sm"
      >
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all ${
                n.unread
                  ? 'bg-violet-50/60 dark:bg-violet-500/5 border-violet-200/50 dark:border-violet-500/15'
                  : 'bg-white dark:bg-white/5 border-zinc-100 dark:border-zinc-800/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-100">
                  {n.title}
                </h4>
                {n.unread && (
                  <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0 mt-1" />
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {n.description}
              </p>
              <span className="text-[10px] text-zinc-400 mt-2 block font-medium">
                {n.time}
              </span>
            </div>
          ))}
        </div>
      </Drawer>
    </>
  );
}
