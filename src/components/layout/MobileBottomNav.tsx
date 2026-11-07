import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Plus,
} from 'lucide-react';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useVisualViewport } from '../../hooks/useVisualViewport';
import { cn } from '../../utils/cn';

export function MobileBottomNav() {
  const { openNewAppointmentDrawer } = useAppointmentStore();
  const { isKeyboardOpen } = useVisualViewport();

  const navItems = [
    { label: 'Início', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Agenda', path: '/agenda', icon: Calendar },
    { label: 'Clientes', path: '/clientes', icon: Users },
    { label: 'Serviços', path: '/servicos', icon: Scissors },
  ];

  return (
    <div
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 w-full max-w-full z-40 bg-white/95 dark:bg-[#13101e]/95 backdrop-blur-md border-t border-violet-100/80 dark:border-violet-900/30 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-[0_-4px_16px_rgba(139,92,246,0.06)] transition-transform duration-200',
        isKeyboardOpen && 'translate-y-full pointer-events-none opacity-0'
      )}
    >
      {navItems.slice(0, 2).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 text-[10px] font-medium py-1 px-3 rounded-xl transition-colors',
                isActive
                  ? 'text-violet-600 dark:text-violet-300 font-bold'
                  : 'text-zinc-500 dark:text-zinc-400'
              )
            }
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      {/* Floating Center Plus Action */}
      <button
        onClick={() => openNewAppointmentDrawer()}
        className="w-12 h-12 rounded-full bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-400/30 -mt-5 border-4 border-[#faf9ff] dark:border-[#0d0b14] active:scale-95 transition-transform"
        aria-label="Novo Agendamento"
      >
        <Plus size={22} />
      </button>

      {navItems.slice(2, 4).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 text-[10px] font-medium py-1 px-3 rounded-xl transition-colors',
                isActive
                  ? 'text-violet-600 dark:text-violet-300 font-bold'
                  : 'text-zinc-500 dark:text-zinc-400'
              )
            }
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
