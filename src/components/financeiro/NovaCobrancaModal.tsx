import React, { useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useServiceStore } from '../../stores/serviceStore';
import { useProfessionalStore } from '../../stores/professionalStore';
import { useUIStore } from '../../stores/uiStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../utils/format';
import { PaymentMethod, ReceivableStatus } from '../../types/financeiro';
import { DollarSign, Check, User, Scissors, Calendar } from 'lucide-react';

interface NovaCobrancaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NovaCobrancaModal({ isOpen, onClose }: NovaCobrancaModalProps) {
  const { addReceivable, depositConfig } = useFinancialStore();
  const { customers } = useCustomerStore();
  const { services } = useServiceStore();
  const { professionals } = useProfessionalStore();
  const { addToast } = useUIStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [professionalName, setProfessionalName] = useState('');
  const [description, setDescription] = useState('');
  const [originalAmount, setOriginalAmount] = useState<number>(80);
  const [discount, setDiscount] = useState<number>(0);
  const [surcharge, setSurcharge] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [dueDate, setDueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<ReceivableStatus>('paid');
  const [hasSignal, setHasSignal] = useState(false);
  const [signalAmount, setSignalAmount] = useState(25);
  const [notes, setNotes] = useState('');

  const finalAmount = Math.max(0, Number(originalAmount) - Number(discount) + Number(surcharge));

  const handleSelectCustomer = (id: string) => {
    const found = customers.find((c) => c.id === id);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
    }
  };

  const handleSelectService = (id: string) => {
    const found = services.find((s) => s.id === id);
    if (found) {
      setServiceName(found.name);
      setOriginalAmount(found.price);
      if (!description) setDescription(`Atendimento ${found.name}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || finalAmount <= 0) {
      addToast({
        type: 'error',
        title: 'Dados incompletos',
        message: 'Preencha o nome do cliente e um valor válido.',
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    addReceivable({
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || undefined,
      service_name: serviceName.trim() || undefined,
      professional_name: professionalName.trim() || undefined,
      description: description.trim() || `Cobrança ${serviceName || 'Atendimento'}`,
      original_amount: Number(originalAmount),
      discount: Number(discount),
      surcharge: Number(surcharge),
      final_amount: finalAmount,
      amount_paid: status === 'paid' ? finalAmount : hasSignal ? signalAmount : 0,
      payment_method: paymentMethod,
      due_date: dueDate,
      paid_at: status === 'paid' ? today : undefined,
      status: status,
      has_signal: hasSignal,
      signal_amount: hasSignal ? signalAmount : undefined,
      signal_paid: hasSignal,
      notes: notes.trim() || undefined,
    });

    addToast({
      type: 'success',
      title: 'Cobrança Lançada!',
      message: `Recebível de ${formatCurrency(finalAmount)} registrado para ${customerName}.`,
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Cobrança / Recebível"
      description="Lançamento manual de valor a receber ou recebido de cliente"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            leftIcon={<Check size={16} />}
          >
            Salvar Cobrança
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <User size={14} className="text-violet-500" />
            Cliente
          </label>
          {customers.length > 0 && (
            <Select
              label="Preencher com cliente cadastrado"
              value=""
              onChange={(e) => handleSelectCustomer(e.target.value)}
              options={[
                { value: '', label: 'Selecione um cliente cadastrado...' },
                ...customers.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` })),
              ]}
            />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              label="Nome do Cliente"
              placeholder="Ex: Ana Beatriz"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <Input
              label="WhatsApp / Telefone"
              placeholder="(11) 99999-9999"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Serviço & Profissional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Serviço Prestado
            </label>
            {services.length > 0 ? (
              <Select
                value={serviceName}
                onChange={(e) => handleSelectService(e.target.value)}
                options={[
                  { value: '', label: 'Outro / Personalizado' },
                  ...services.map((s) => ({ value: s.id, label: `${s.name} (${formatCurrency(s.price)})` })),
                ]}
              />
            ) : (
              <Input
                placeholder="Ex: Corte Masculino"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Profissional
            </label>
            <Select
              value={professionalName}
              onChange={(e) => setProfessionalName(e.target.value)}
              options={[
                { value: '', label: 'Sem profissional específico' },
                ...professionals.map((p) => ({ value: p.name, label: p.name })),
              ]}
            />
          </div>
        </div>

        {/* Valores: Original, Desconto, Acréscimo e Final */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">
                Valor Base
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={originalAmount}
                onChange={(e) => setOriginalAmount(Number(e.target.value))}
                className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-emerald-600 uppercase block mb-1">
                Desconto (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-amber-600 uppercase block mb-1">
                Acréscimo (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={surcharge}
                onChange={(e) => setSurcharge(Number(e.target.value))}
                className="w-full rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Valor Final a Cobrar:
            </span>
            <span className="text-xl font-black text-violet-600 dark:text-violet-400 font-mono">
              {formatCurrency(finalAmount)}
            </span>
          </div>
        </div>

        {/* Forma de Pagamento & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Select
            label="Forma de Pagamento"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={[
              { value: 'pix', label: 'Pix Instantâneo' },
              { value: 'credito', label: 'Cartão de Crédito' },
              { value: 'debito', label: 'Cartão de Débito' },
              { value: 'dinheiro', label: 'Dinheiro' },
              { value: 'transferencia', label: 'Transferência / TED' },
              { value: 'boleto', label: 'Boleto Bancário' },
              { value: 'outros', label: 'Outros' },
            ]}
          />

          <Select
            label="Status do Pagamento"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReceivableStatus)}
            options={[
              { value: 'paid', label: '🟢 Pago (Liquidado)' },
              { value: 'pending', label: '🟡 Pendente (A Receber)' },
              { value: 'partially_paid', label: '🔵 Parcialmente Pago' },
              { value: 'overdue', label: '🔴 Vencido em Atraso' },
            ]}
          />
        </div>

        {/* Data de Vencimento */}
        <Input
          label="Data de Vencimento"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />

        {/* Sinal de Agendamento */}
        <div className="p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-violet-900 dark:text-violet-300">
            <input
              type="checkbox"
              checked={hasSignal}
              onChange={(e) => setHasSignal(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-violet-300 accent-violet-600"
            />
            Cobrar / Considerar Sinal de Reserva (Sinal Pago)
          </label>
          {hasSignal && (
            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs text-zinc-500">Valor do Sinal: R$</span>
              <input
                type="number"
                min="0"
                max={finalAmount}
                value={signalAmount}
                onChange={(e) => setSignalAmount(Number(e.target.value))}
                className="w-24 rounded-lg bg-white dark:bg-zinc-800 border border-violet-200 dark:border-violet-800 px-2 py-1 text-xs font-bold"
              />
              <span className="text-[11px] text-zinc-400">
                Restante no atendimento: {formatCurrency(Math.max(0, finalAmount - signalAmount))}
              </span>
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Observações
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Pago com Pix antecipado para garantia do horário..."
            className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
          />
        </div>
      </form>
    </Drawer>
  );
}
