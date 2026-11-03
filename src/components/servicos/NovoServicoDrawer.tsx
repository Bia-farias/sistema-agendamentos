import React, { useState, useEffect } from 'react';
import { useServiceStore } from '../../stores/serviceStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Check, Scissors, Clock, DollarSign, Tag } from 'lucide-react';

export function NovoServicoDrawer() {
  const { tenant } = useAuthStore();
  const { services, activeDrawer, closeDrawer, addService, updateService } =
    useServiceStore();
  const { addToast } = useUIStore();

  const isNew = activeDrawer.type === 'new';
  const isEdit = activeDrawer.type === 'edit';
  const isOpen = isNew || isEdit;

  const editingService = isEdit
    ? services.find((s) => s.id === activeDrawer.serviceId)
    : null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cabelo');
  const [price, setPrice] = useState('80');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [color, setColor] = useState('#8b5cf6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingService) {
      setName(editingService.name);
      setDescription(editingService.description || '');
      setCategory(editingService.category);
      setPrice(String(editingService.price));
      setDurationMinutes(String(editingService.duration_minutes));
      setColor(editingService.color || '#8b5cf6');
    } else {
      setName('');
      setDescription('');
      setCategory('Cabelo');
      setPrice('80');
      setDurationMinutes('45');
      setColor('#8b5cf6');
    }
  }, [editingService, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast({
        type: 'error',
        title: 'Nome obrigatório',
        message: 'Por favor preencha o nome do serviço.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedPrice = parseFloat(price) || 0;
      const parsedDuration = parseInt(durationMinutes) || 30;

      if (isEdit && editingService) {
        await updateService(editingService.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          price: parsedPrice,
          duration_minutes: parsedDuration,
          color,
        });

        addToast({
          type: 'success',
          title: 'Serviço Atualizado',
          message: `${name} foi atualizado com sucesso.`,
        });
      } else {
        await addService({
          tenant_id: tenant?.id || 'tenant-1001',
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          price: parsedPrice,
          duration_minutes: parsedDuration,
          color,
          is_active: true,
        });

        addToast({
          type: 'success',
          title: 'Serviço Criado!',
          message: `${name} foi adicionado ao catálogo.`,
        });
      }

      closeDrawer();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: 'Ocorreu um erro ao salvar o serviço.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title={isEdit ? 'Editar Serviço' : 'Novo Serviço'}
      description="Cadastre serviços e configure tempo de duração e valores"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={closeDrawer} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<Check size={16} />}
          >
            {isEdit ? 'Salvar Alterações' : 'Cadastrar Serviço'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome do Serviço *"
          placeholder="Ex: Corte Degradê + Barba"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<Scissors size={16} />}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'Cabelo', label: 'Cabelo' },
              { value: 'Barbearia', label: 'Barbearia' },
              { value: 'Unhas', label: 'Unhas / Podologia' },
              { value: 'Estética Facial', label: 'Estética Facial' },
              { value: 'Corporal', label: 'Corporal / Massagem' },
              { value: 'Outros', label: 'Outros' },
            ]}
          />

          <Input
            label="Preço (R$) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            leftIcon={<DollarSign size={16} />}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Duração Estimada"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            options={[
              { value: '15', label: '15 minutos' },
              { value: '30', label: '30 minutos' },
              { value: '45', label: '45 minutos' },
              { value: '60', label: '1 hora (60 min)' },
              { value: '90', label: '1h 30min (90 min)' },
              { value: '120', label: '2 horas (120 min)' },
              { value: '180', label: '3 horas (180 min)' },
            ]}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Cor do Card na Agenda
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs text-zinc-400 font-mono uppercase">{color}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Descrição do Procedimento
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Detalhes dos produtos inclusos, etapas do procedimento..."
            className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
          />
        </div>
      </form>
    </Drawer>
  );
}
