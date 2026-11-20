import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Calendar,
  Users,
  Scissors,
  UserCheck,
  Building2,
  DollarSign,
  MessageCircle,
  Settings,
  Globe,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCustomerStore } from '../../stores/customerStore';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useServiceStore } from '../../stores/serviceStore';
import { useProfessionalStore } from '../../stores/professionalStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../utils/format';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  category: 'Ação Rápida' | 'Cliente' | 'Serviço' | 'Profissional' | 'Agendamento' | 'Navegação';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { customers } = useCustomerStore();
  const { appointments, openNewAppointmentDrawer, openDetailDrawer } = useAppointmentStore();
  const { services, openNewServiceDrawer } = useServiceStore();
  const { professionals, openNewProfessionalDrawer } = useProfessionalStore();
  const { profile } = useAuthStore();

  const isOwner =
    (profile?.role || '').toLowerCase() === 'owner' ||
    (profile?.role || '').toLowerCase() === 'super_admin';

  // Foco automático ao abrir e reset do termo
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Itens de navegação padrão
  const navigationItems: SearchItem[] = useMemo(() => {
    const list: SearchItem[] = [
      {
        id: 'nav-agenda',
        category: 'Navegação',
        title: 'Agenda & Horários',
        subtitle: 'Ver calendário de atendimentos',
        icon: <Calendar size={16} className="text-violet-500" />,
        onSelect: () => {
          navigate('/agenda');
          onClose();
        },
      },
      {
        id: 'nav-dashboard',
        category: 'Navegação',
        title: 'Dashboard Operacional',
        subtitle: 'Métricas, faturamento e resumo diário',
        icon: <Sparkles size={16} className="text-violet-500" />,
        onSelect: () => {
          navigate('/dashboard');
          onClose();
        },
      },
      {
        id: 'nav-clientes',
        category: 'Navegação',
        title: 'Base de Clientes',
        subtitle: 'Listagem de clientes e históricos',
        icon: <Users size={16} className="text-emerald-500" />,
        onSelect: () => {
          navigate('/clientes');
          onClose();
        },
      },
      {
        id: 'nav-servicos',
        category: 'Navegação',
        title: 'Catálogo de Serviços',
        subtitle: 'Preços, durações e categorias',
        icon: <Scissors size={16} className="text-pink-500" />,
        onSelect: () => {
          navigate('/servicos');
          onClose();
        },
      },
      {
        id: 'nav-profissionais',
        category: 'Navegação',
        title: 'Equipe de Profissionais',
        subtitle: 'Especialistas, horários e comissões',
        icon: <UserCheck size={16} className="text-sky-500" />,
        onSelect: () => {
          navigate('/profissionais');
          onClose();
        },
      },
      {
        id: 'nav-financeiro',
        category: 'Navegação',
        title: 'Gestão Financeira & Caixa',
        subtitle: 'Fluxo de caixa, despesas e comissões',
        icon: <DollarSign size={16} className="text-emerald-500" />,
        onSelect: () => {
          navigate('/financeiro');
          onClose();
        },
      },
      {
        id: 'nav-whatsapp',
        category: 'Navegação',
        title: 'WhatsApp & Mensagens Automáticas',
        subtitle: 'Lembretes, confirmações e resgate de clientes',
        icon: <MessageCircle size={16} className="text-emerald-500" />,
        onSelect: () => {
          navigate('/whatsapp');
          onClose();
        },
      },
      {
        id: 'nav-minha-pagina',
        category: 'Navegação',
        title: 'Minha Página & Agendamento Online',
        subtitle: 'Link público do mini-site para os clientes',
        icon: <Globe size={16} className="text-indigo-500" />,
        onSelect: () => {
          navigate('/minha-pagina');
          onClose();
        },
      },
      {
        id: 'nav-configuracoes',
        category: 'Navegação',
        title: 'Configurações da Empresa',
        subtitle: 'Horários de funcionamento, dados e políticas',
        icon: <Settings size={16} className="text-zinc-500" />,
        onSelect: () => {
          navigate('/configuracoes');
          onClose();
        },
      },
    ];

    if (isOwner) {
      list.unshift({
        id: 'nav-empresas',
        category: 'Navegação',
        title: 'Empresas & Acessos (SaaS)',
        subtitle: 'Gestão Master de empresas e logins Admin',
        icon: <Building2 size={16} className="text-purple-500" />,
        onSelect: () => {
          navigate('/empresas');
          onClose();
        },
      });
    }

    return list;
  }, [navigate, onClose, isOwner]);

  // Ações Rápidas
  const quickActions: SearchItem[] = useMemo(
    () => [
      {
        id: 'act-new-apt',
        category: 'Ação Rápida',
        title: 'Novo Agendamento',
        subtitle: 'Marcar um novo horário na agenda',
        icon: <Plus size={16} className="text-violet-500" />,
        onSelect: () => {
          openNewAppointmentDrawer();
          onClose();
        },
      },
      {
        id: 'act-new-client',
        category: 'Ação Rápida',
        title: 'Cadastrar Novo Cliente',
        subtitle: 'Adicionar novo cliente à base',
        icon: <Plus size={16} className="text-emerald-500" />,
        onSelect: () => {
          navigate('/clientes');
          onClose();
        },
      },
      {
        id: 'act-new-service',
        category: 'Ação Rápida',
        title: 'Cadastrar Novo Serviço',
        subtitle: 'Adicionar serviço com preço e duração',
        icon: <Plus size={16} className="text-pink-500" />,
        onSelect: () => {
          openNewServiceDrawer();
          onClose();
        },
      },
      {
        id: 'act-new-pro',
        category: 'Ação Rápida',
        title: 'Cadastrar Novo Profissional',
        subtitle: 'Adicionar membro à equipe',
        icon: <Plus size={16} className="text-sky-500" />,
        onSelect: () => {
          openNewProfessionalDrawer();
          onClose();
        },
      },
    ],
    [openNewAppointmentDrawer, openNewServiceDrawer, openNewProfessionalDrawer, navigate, onClose]
  );

  // Filtragem dinâmica por termo de busca
  const results = useMemo<SearchItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Estado inicial: ações rápidas principais + navegação
      return [...quickActions, ...navigationItems];
    }

    const items: SearchItem[] = [];

    // 1. Filtrar Ações Rápidas e Navegação
    quickActions.forEach((act) => {
      if (act.title.toLowerCase().includes(q) || (act.subtitle && act.subtitle.toLowerCase().includes(q))) {
        items.push(act);
      }
    });

    navigationItems.forEach((nav) => {
      if (nav.title.toLowerCase().includes(q) || (nav.subtitle && nav.subtitle.toLowerCase().includes(q))) {
        items.push(nav);
      }
    });

    // 2. Filtrar Clientes Reais
    (customers || []).forEach((c) => {
      if (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      ) {
        items.push({
          id: `cust-${c.id}`,
          category: 'Cliente',
          title: c.name,
          subtitle: `${c.phone || 'Sem telefone'}${c.email ? ` • ${c.email}` : ''}`,
          icon: <Users size={16} className="text-emerald-500" />,
          onSelect: () => {
            navigate('/clientes');
            onClose();
          },
        });
      }
    });

    // 3. Filtrar Serviços Reais
    (services || []).forEach((s) => {
      if (
        s.name.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q))
      ) {
        items.push({
          id: `srv-${s.id}`,
          category: 'Serviço',
          title: s.name,
          subtitle: `${s.category || 'Serviço'} • ${formatCurrency(s.price)} (${s.duration_minutes} min)`,
          icon: <Scissors size={16} className="text-pink-500" />,
          onSelect: () => {
            navigate('/servicos');
            onClose();
          },
        });
      }
    });

    // 4. Filtrar Profissionais Reais
    (professionals || []).forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        (p.role && p.role.toLowerCase().includes(q)) ||
        (p.specialties && p.specialties.some((spec) => spec.toLowerCase().includes(q)))
      ) {
        items.push({
          id: `pro-${p.id}`,
          category: 'Profissional',
          title: p.name,
          subtitle: `${p.role || 'Especialista'}${
            p.specialties?.length ? ` • ${p.specialties.join(', ')}` : ''
          }`,
          icon: <UserCheck size={16} className="text-sky-500" />,
          onSelect: () => {
            navigate('/profissionais');
            onClose();
          },
        });
      }
    });

    // 5. Filtrar Agendamentos Reais
    (appointments || []).forEach((a) => {
      if (
        a.customer_name?.toLowerCase().includes(q) ||
        a.service_name?.toLowerCase().includes(q) ||
        a.professional_name?.toLowerCase().includes(q) ||
        a.date?.includes(q)
      ) {
        items.push({
          id: `apt-${a.id}`,
          category: 'Agendamento',
          title: `${a.customer_name} • ${a.service_name}`,
          subtitle: `${a.date} às ${a.start_time} com ${a.professional_name}`,
          icon: <Clock size={16} className="text-amber-500" />,
          onSelect: () => {
            openDetailDrawer(a.id);
            onClose();
          },
        });
      }
    });

    return items;
  }, [
    query,
    quickActions,
    navigationItems,
    customers,
    services,
    professionals,
    appointments,
    navigate,
    openDetailDrawer,
    onClose,
  ]);

  // Controle de navegação por teclado (Cima, Baixo, Enter, ESC)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].onSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  const categoryBadgeColors: Record<string, string> = {
    'Ação Rápida': 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    Cliente: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    Serviço: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
    Profissional: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    Agendamento: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    Navegação: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#13101e] border border-violet-100 dark:border-violet-900/30 rounded-3xl shadow-2xl shadow-violet-950/20 overflow-hidden flex flex-col max-h-[80vh] z-10">
        {/* Search Header Input */}
        <div className="relative flex items-center gap-3 px-5 py-4 border-b border-violet-100/70 dark:border-violet-900/30">
          <Search size={20} className="text-violet-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar clientes, serviços, horários ou telas..."
            className="w-full bg-transparent text-sm sm:text-base text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              title="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {results.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Search size={28} className="mx-auto text-zinc-300 dark:text-zinc-700" />
              <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                Nenhum resultado encontrado
              </p>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Não encontramos registros correspondentes a &quot;{query}&quot;. Tente outro termo.
              </p>
            </div>
          ) : (
            results.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onSelect}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                  selectedIndex === idx
                    ? 'bg-violet-500/10 dark:bg-violet-500/15 text-violet-900 dark:text-violet-100 ring-1 ring-violet-500/30'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedIndex === idx
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      categoryBadgeColors[item.category] || 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {item.category}
                  </span>
                  <ArrowRight
                    size={13}
                    className={`transition-transform ${
                      selectedIndex === idx ? 'translate-x-0.5 text-violet-500' : 'opacity-0'
                    }`}
                  />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Modal Footer with Keyboard Shortcuts */}
        <div className="px-5 py-2.5 border-t border-violet-100/60 dark:border-violet-900/20 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono shadow-xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono shadow-xs">
                ↓
              </kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono shadow-xs">
                ↵
              </kbd>
              <span>Selecionar</span>
            </span>
          </div>

          <span className="hidden sm:inline">Pesquisa Unificada Agenda AI</span>
        </div>
      </div>
    </div>
  );
}
