import React, { useState, useEffect } from 'react';
import { useProfessionalStore } from '../../stores/professionalStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Check, User, Phone, Mail, Percent, Sparkles, Clock } from 'lucide-react';

export function NovoProfissionalDrawer() {
  const { tenant } = useAuthStore();
  const { professionals, activeDrawer, closeDrawer, addProfessional, updateProfessional } =
    useProfessionalStore();
  const { addToast } = useUIStore();

  const isNew = activeDrawer.type === 'new';
  const isEdit = activeDrawer.type === 'edit';
  const isOpen = isNew || isEdit;

  const editingProf = isEdit
    ? professionals.find((p) => p.id === activeDrawer.professionalId)
    : null;

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [commission, setCommission] = useState('40');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('19:00');
  const [color, setColor] = useState('#8b5cf6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProf) {
      setName(editingProf.name);
      setRole(editingProf.role);
      setPhone(editingProf.phone || '');
      setEmail(editingProf.email || '');
      setCommission(String(editingProf.commission_percentage));
      setSpecialtiesText(editingProf.specialties.join(', '));
      setStartTime(editingProf.working_hours?.start || '09:00');
      setEndTime(editingProf.working_hours?.end || '19:00');
      setColor(editingProf.color || '#8b5cf6');
    } else {
      setName('');
      setRole('');
      setPhone('');
      setEmail('');
      setCommission('40');
      setSpecialtiesText('');
      setStartTime('09:00');
      setEndTime('19:00');
      setColor('#8b5cf6');
    }
  }, [editingProf, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !role.trim()) {
      addToast({
        type: 'error',
        title: 'Campos Obrigatórios',
        message: 'Preencha o nome e a especialidade principal do profissional.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const specialties = specialtiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (isEdit && editingProf) {
        await updateProfessional(editingProf.id, {
          name: name.trim(),
          role: role.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          commission_percentage: parseFloat(commission) || 0,
          specialties: specialties.length > 0 ? specialties : [role.trim()],
          color,
          working_hours: {
            start: startTime,
            end: endTime,
            days_of_week: [1, 2, 3, 4, 5, 6],
          },
        });

        addToast({
          type: 'success',
          title: 'Profissional Atualizado',
          message: `Os dados de ${name} foram atualizados.`,
        });
      } else {
        await addProfessional({
          tenant_id: tenant?.id || 'tenant-1001',
          name: name.trim(),
          role: role.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          commission_percentage: parseFloat(commission) || 0,
          specialties: specialties.length > 0 ? specialties : [role.trim()],
          color,
          is_active: true,
          working_hours: {
            start: startTime,
            end: endTime,
            days_of_week: [1, 2, 3, 4, 5, 6],
          },
        });

        addToast({
          type: 'success',
          title: 'Profissional Cadastrado!',
          message: `${name} foi adicionado à equipe.`,
        });
      }

      closeDrawer();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: 'Ocorreu um erro ao salvar o profissional.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title={isEdit ? 'Editar Profissional' : 'Novo Profissional'}
      description="Gerencie membros da equipe, especialidades e comissões"
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
            {isEdit ? 'Salvar Alterações' : 'Cadastrar Membro'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome Completo *"
          placeholder="Ex: Lucas Ferreira"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<User size={16} />}
          required
        />

        <Input
          label="Cargo / Especialidade Principal *"
          placeholder="Ex: Barbeiro Master & Visagista"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          leftIcon={<Sparkles size={16} />}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="WhatsApp"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone size={16} />}
          />

          <Input
            label="Comissão Padrão (%)"
            type="number"
            min="0"
            max="100"
            placeholder="40"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            leftIcon={<Percent size={16} />}
          />
        </div>

        <Input
          label="E-mail de Acesso"
          type="email"
          placeholder="profissional@agendaai.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Especialidades (separadas por vírgula)
          </label>
          <Input
            placeholder="Ex: Corte Degrade, Barba Terapia, Luzes"
            value={specialtiesText}
            onChange={(e) => setSpecialtiesText(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Horário de Início
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Horário de Fim
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
            />
          </div>
        </div>
      </form>
    </Drawer>
  );
}
