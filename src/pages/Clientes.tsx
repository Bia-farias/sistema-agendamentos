import { useState } from 'react';
import { useCustomerStore } from '../stores/customerStore';
import { useAuthStore } from '../stores/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  MessageCircle,
  ArrowRight,
  Edit2,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { formatCurrency, formatDate, formatPhone } from '../utils/format';
import {
  createWhatsAppLink,
  generateReactivationMessage,
  openWhatsAppForAppointment,
} from '../services/whatsapp';
import { useAppointmentStore } from '../stores/appointmentStore';
import { useUIStore } from '../stores/uiStore';

export default function Clientes() {
  const { tenant } = useAuthStore();
  const { appointments } = useAppointmentStore();
  const { addToast } = useUIStore();
  const {
    searchQuery,
    setSearchQuery,
    filterTab,
    setFilterTab,
    openNewCustomerDrawer,
    openDetailDrawer,
    openEditCustomerDrawer,
    getFilteredCustomers,
    customers,
  } = useCustomerStore();

  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');

  const filteredCustomers = getFilteredCustomers();

  const tabs = [
    { id: 'all', label: 'Todos os Clientes', count: customers.length },
    {
      id: 'active',
      label: 'Frequentes',
      count: customers.filter((c) => c.appointments_count > 2).length,
    },
    {
      id: 'vip',
      label: 'VIPs',
      count: customers.filter((c) => c.is_vip).length,
    },
    {
      id: 'inactive',
      label: 'Inativos / Retorno',
      count: customers.filter((c) => c.appointments_count <= 2).length,
    },
  ];

  const handleDirectWhatsApp = (e: React.MouseEvent, customer: any) => {
    e.stopPropagation();

    // Localiza agendamento futuro ou o mais recente do cliente
    const customerApts = appointments.filter(
      (a) => a.customer_id === customer.id || a.customer_phone === customer.phone
    );

    const upcomingApt = customerApts
      .filter((a) => a.status !== 'cancelled' && a.status !== 'completed')
      .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))[0];

    const lastApt = !upcomingApt
      ? customerApts.sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time))[0]
      : undefined;

    const targetApt = upcomingApt || lastApt;

    if (targetApt) {
      openWhatsAppForAppointment(
        targetApt,
        tenant?.name || 'Studio Prime',
        targetApt.status === 'confirmed' ? 'confirmation' : 'reminder'
      );
      addToast({
        type: 'success',
        title: 'WhatsApp Aberto',
        message: `Redirecionando com os dados do agendamento de ${customer.name}...`,
      });
    } else {
      const message = generateReactivationMessage(customer, tenant?.name || 'Studio Prime');
      const link = createWhatsAppLink(customer.phone, message);
      window.open(link, '_blank', 'noopener,noreferrer');
      addToast({
        type: 'info',
        title: 'WhatsApp Aberto',
        message: `Iniciando conversa no WhatsApp com ${customer.name}...`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2.5">
            Gestão de Clientes & CRM
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Histórico completo, controle de frequência e comunicação ágil via WhatsApp.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => openNewCustomerDrawer()}
          leftIcon={<Plus size={16} />}
          className="shadow-sm shadow-violet-400/20"
        >
          + Novo Cliente
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full md:w-80">
          <Input
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 justify-between md:justify-end overflow-x-auto">
          <Tabs
            tabs={tabs}
            activeTab={filterTab}
            onChange={(id: any) => setFilterTab(id)}
          />

          {/* Layout View Mode Switch */}
          <div className="hidden sm:flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewLayout === 'grid'
                  ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-zinc-400'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`p-2 rounded-lg transition-all ${
                viewLayout === 'table'
                  ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-zinc-400'
              }`}
              title="Visualização em Tabela"
            >
              <TableIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Content Display */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="Nenhum cliente encontrado"
          description={
            searchQuery
              ? `Não foram encontrados resultados para "${searchQuery}".`
              : 'Cadastre seus clientes para gerenciar histórico e preferências.'
          }
          actionLabel="+ Cadastrar Cliente"
          onAction={() => openNewCustomerDrawer()}
        />
      ) : viewLayout === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              hoverEffect
              onClick={() => openDetailDrawer(customer.id)}
              className="cursor-pointer group relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={customer.name} size="md" />
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex items-center gap-1.5">
                        {customer.name}
                        {customer.is_vip && (
                          <Sparkles size={13} className="text-amber-500" />
                        )}
                      </h3>
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Phone size={12} /> {formatPhone(customer.phone)}
                      </p>
                    </div>
                  </div>

                  {customer.is_vip ? (
                    <Badge variant="warning" size="sm">
                      VIP
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      {customer.appointments_count} visitas
                    </Badge>
                  )}
                </div>

                {customer.notes && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-3 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60">
                    {customer.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium">Investimento</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    {formatCurrency(customer.total_spent || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleDirectWhatsApp(e, customer)}
                    className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                    title="Chamar no WhatsApp"
                  >
                    <MessageCircle size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditCustomerDrawer(customer.id);
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Editar Cliente"
                  >
                    <Edit2 size={15} />
                  </button>
                  <span className="text-xs text-violet-500 font-semibold flex items-center gap-0.5 ml-1">
                    Ver <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Contato</th>
                  <th className="px-5 py-3.5">Atendimentos</th>
                  <th className="px-5 py-3.5">Total Investido</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => openDetailDrawer(customer.id)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name} size="sm" />
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                            {customer.name}
                          </span>
                          {customer.email && (
                            <span className="text-[11px] text-zinc-400">{customer.email}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-600 dark:text-zinc-300">
                      {formatPhone(customer.phone)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-zinc-800 dark:text-zinc-200">
                      {customer.appointments_count} visitas
                    </td>
                    <td className="px-5 py-3.5 font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(customer.total_spent || 0)}
                    </td>
                    <td className="px-5 py-3.5">
                      {customer.is_vip ? (
                        <Badge variant="warning" size="sm">
                          VIP
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Ativo
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleDirectWhatsApp(e, customer)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          title="WhatsApp"
                        >
                          <MessageCircle size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCustomerDrawer(customer.id);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
