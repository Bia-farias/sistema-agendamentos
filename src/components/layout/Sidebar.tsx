import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCheck,
  DollarSign,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useAIChatStore } from '../../stores/aiChatStore';
import { cn } from '../../utils/cn';

export function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar, addToast } = useUIStore();
  const { tenant, profile, logout } = useAuthStore();
  const { openChat } = useAIChatStore();

  interface NavItem {
    label: string;
    path: string;
    icon: any;
    badge?: string;
    highlight?: boolean;
    onClick?: (e: React.MouseEvent) => void;
  }

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Agenda', path: '/agenda', icon: Calendar },
    { label: 'Clientes', path: '/clientes', icon: Users },
    { label: 'Serviços', path: '/servicos', icon: Scissors },
    { label: 'Profissionais', path: '/profissionais', icon: UserCheck },
    { label: 'Financeiro', path: '/financeiro', icon: DollarSign },
    { label: 'WhatsApp', path: '/whatsapp', icon: MessageSquare },
    { label: 'Configurações', path: '/configuracoes', icon: Settings },
    {
      label: 'Assistente IA',
      path: '#ia',
      icon: Sparkles,
      highlight: true,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        openChat();
      },
    },
  ];

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-violet-100/80 dark:border-violet-900/30 bg-white dark:bg-[#13101e] backdrop-blur-md transition-all duration-300 z-30 shrink-0 select-none relative shadow-[1px_0_12px_rgba(139,92,246,0.04)]',
        isSidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-violet-100/60 dark:border-violet-900/20">
        <NavLink to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-400 via-violet-300 to-purple-300 flex items-center justify-center text-white font-black text-xl shadow-sm shadow-violet-300/40 shrink-0">
            A
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-zinc-800 dark:text-zinc-50 flex items-center gap-1.5">
                Agenda AI
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300 border border-violet-200/80 dark:border-violet-500/20">
                  PRO
                </span>
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate max-w-[130px]">
                {tenant?.name || 'Meu Estabelecimento'}
              </span>
            </div>
          )}
        </NavLink>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 rounded-lg text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 flex items-center justify-center transition-all duration-150"
          title={isSidebarOpen ? 'Recolher Menu' : 'Expandir Menu'}
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={item.onClick}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative',
                isActive
                  ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200/70 dark:border-violet-500/20 shadow-sm'
                  : item.highlight
                  ? 'text-violet-600 dark:text-violet-400 hover:bg-violet-50/80 dark:hover:bg-violet-500/10 border border-transparent'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-violet-50/60 dark:hover:bg-violet-500/5 border border-transparent'
              )}
            >
              {/* Active left accent bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-violet-400 dark:bg-violet-400" />
              )}
              <Icon
                size={18}
                className={cn(
                  'shrink-0 transition-transform group-hover:scale-105',
                  isActive
                    ? 'text-violet-600 dark:text-violet-300'
                    : item.highlight
                    ? 'text-violet-500 dark:text-violet-400'
                    : 'text-zinc-400 dark:text-zinc-500 group-hover:text-violet-500'
                )}
              />
              {isSidebarOpen && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-200/60 dark:border-violet-500/20">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100/80 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300">
                      IA
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Mini Card de Plano Atual & Upgrade */}
      {isSidebarOpen ? (
        <div className="mx-3 mb-3 p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border border-violet-200/70 dark:border-violet-800/40">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1">
              <Sparkles size={11} />
              Plano Ativo
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
              Free 7 Dias
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Single • 7 dias de avaliação
          </p>
          <a
            href="/#planos"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 block w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-[11px] font-extrabold text-center shadow-xs shadow-violet-500/20 hover:shadow-violet-500/30 transition-all"
          >
            Fazer Upgrade ⚡
          </a>
        </div>
      ) : (
        <div className="mb-3 flex justify-center">
          <a
            href="/#planos"
            target="_blank"
            rel="noopener noreferrer"
            title="Ver Planos e Upgrade"
            className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Sparkles size={16} />
          </a>
        </div>
      )}

      {/* Footer User Profile & Logout */}
      <div className="p-3 border-t border-violet-100/60 dark:border-violet-900/20 bg-violet-50/30 dark:bg-violet-500/5">
        <div className={cn('flex items-center gap-3', !isSidebarOpen && 'justify-center')}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-400 to-violet-300 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm shadow-violet-300/30">
            {profile?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          {isSidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">
                {profile?.full_name || 'Super Administrador'}
              </p>
              <span
                className={cn(
                  'inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-md mt-0.5',
                  profile?.role === 'super_admin' || profile?.role === 'owner'
                    ? 'bg-amber-100/90 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40'
                    : profile?.role === 'admin'
                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40'
                    : profile?.role === 'professional'
                    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                )}
              >
                {profile?.role === 'super_admin' || profile?.role === 'owner'
                  ? 'Super Adm 👑'
                  : profile?.role === 'admin'
                  ? 'Admin 🛡️'
                  : profile?.role === 'professional'
                  ? 'Profissional'
                  : 'Recepção'}
              </span>
            </div>
          )}
          {isSidebarOpen && (
            <button
              onClick={logout}
              title="Sair da Conta"
              className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
