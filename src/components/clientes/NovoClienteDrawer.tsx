import React, { useState, useEffect } from 'react';
import { useCustomerStore } from '../../stores/customerStore';
import { useUIStore } from '../../stores/uiStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { maskPhone } from '../../utils/masks';
import { Check, User, Phone, Mail, Calendar, Sparkles } from 'lucide-react';

export function NovoClienteDrawer() {
  const { customers, activeDrawer, closeDrawer, addCustomer, updateCustomer } =
    useCustomerStore();
  const { addToast } = useUIStore();

  const isNew = activeDrawer.type === 'new';
  const isEdit = activeDrawer.type === 'edit';
  const isOpen = isNew || isEdit;

  const editingCustomer = isEdit
    ? customers.find((c) => c.id === activeDrawer.customerId)
    : null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone);
      setEmail(editingCustomer.email || '');
      setBirthDate(editingCustomer.birth_date || '');
      setNotes(editingCustomer.notes || '');
      setIsVip(editingCustomer.is_vip || false);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setBirthDate('');
      setNotes('');
      setIsVip(false);
    }
  }, [editingCustomer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      addToast({
        type: 'error',
        title: 'Campos Obrigatórios',
        message: 'Preencha o nome e o número de WhatsApp do cliente.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && editingCustomer) {
        updateCustomer(editingCustomer.id, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          birth_date: birthDate || undefined,
          notes: notes.trim() || undefined,
          is_vip: isVip,
        });

        addToast({
          type: 'success',
          title: 'Cliente Atualizado',
          message: `Os dados de ${name} foram salvos com sucesso.`,
        });
      } else {
        addCustomer({
          tenant_id: 'tenant-1001',
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          birth_date: birthDate || undefined,
          notes: notes.trim() || undefined,
          is_vip: isVip,
        });

        addToast({
          type: 'success',
          title: 'Cliente Cadastrado!',
          message: `${name} foi adicionado à sua base de clientes.`,
        });
      }

      closeDrawer();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: 'Ocorreu um erro ao salvar o cliente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title={isEdit ? 'Editar Cliente' : 'Novo Cliente'}
      description={
        isEdit
          ? 'Atualize as informações de contato e preferências do cliente'
          : 'Cadastre um novo cliente no CRM do seu negócio'
      }
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
            {isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome Completo *"
          placeholder="Ex: Amanda Silva"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<User size={16} />}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="WhatsApp / Celular *"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            leftIcon={<Phone size={16} />}
            required
          />

          <Input
            label="Data de Nascimento"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            leftIcon={<Calendar size={16} />}
          />
        </div>

        <Input
          label="E-mail"
          type="email"
          placeholder="cliente@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
        />

        {/* VIP Switch */}
        <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Cliente VIP</p>
              <p className="text-[11px] text-zinc-400">
                Destaque este cliente com atendimento prioritário
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isVip}
              onChange={(e) => setIsVip(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Observações e Preferências
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Ex: Prefere tons nudes, alérgica a esmalte tradicional, café com adoçante..."
            className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
          />
        </div>
      </form>
    </Drawer>
  );
}
