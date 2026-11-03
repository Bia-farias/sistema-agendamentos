import { useState, useEffect } from 'react';
import { useServiceStore } from '../stores/serviceStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Scissors,
  Plus,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function Servicos() {
  const {
    fetchServices,
    services,
    selectedCategory,
    setSelectedCategory,
    openNewServiceDrawer,
    openEditServiceDrawer,
    toggleServiceActive,
    deleteService,
  } = useServiceStore();

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const categories = ['all', 'Cabelo', 'Barbearia', 'Unhas', 'Estética Facial', 'Corporal'];

  const filteredServices = services.filter((s) => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2.5">
            Catálogo de Serviços
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Configure procedimentos, tempos de execução e valores praticados no seu negócio.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => openNewServiceDrawer()}
          leftIcon={<Plus size={16} />}
          className="shadow-sm shadow-violet-400/20"
        >
          + Novo Serviço
        </Button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-400/25'
                : 'bg-white dark:bg-zinc-900 hover:bg-violet-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-violet-100/70 dark:border-zinc-800'
            }`}
          >
            {cat === 'all' ? 'Todos os Serviços' : cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <EmptyState
          icon={<Scissors size={24} />}
          title="Nenhum serviço nesta categoria"
          description="Adicione novos serviços ao catálogo para disponibilizá-los na agenda."
          actionLabel="+ Cadastrar Serviço"
          onAction={() => openNewServiceDrawer()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              hoverEffect
              className="flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">
                      {service.category}
                    </span>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {service.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => toggleServiceActive(service.id)}
                    className="shrink-0"
                    title={service.is_active ? 'Serviço Ativo' : 'Serviço Inativo'}
                  >
                    <Badge variant={service.is_active ? 'success' : 'neutral'} size="sm">
                      {service.is_active ? 'Ativo' : 'Pausado'}
                    </Badge>
                  </button>
                </div>

                {service.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2.5 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                    <Clock size={11} /> {service.duration_minutes} minutos
                  </span>
                  <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                    {formatCurrency(service.price)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditServiceDrawer(service.id)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Editar Serviço"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    title="Excluir Serviço"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
