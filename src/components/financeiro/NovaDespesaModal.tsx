import React, { useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { useUIStore } from '../../stores/uiStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../utils/format';
import { PayableCategory, PayableStatus, PaymentMethod } from '../../types/financeiro';
import { TrendingDown, Check, Building2, Calendar } from 'lucide-react';

interface NovaDespesaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NovaDespesaModal({ isOpen, onClose }: NovaDespesaModalProps) {
  const { addPayable, suppliers } = useFinancialStore();
  const { addToast } = useUIStore();

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PayableCategory>('fornecedores');
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState<number>(150);
  const [dueDate, setDueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<PayableStatus>('pending');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('boleto');
  const [notes, setNotes] = useState('');

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || amount <= 0) {
      addToast({
        type: 'error',
        title: 'Dados incompletos',
        message: 'Preencha a descrição da despesa e um valor válido.',
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    addPayable({
      description: description.trim(),
      category,
      supplier_id: supplierId || undefined,
      supplier_name: selectedSupplier ? (selectedSupplier.trade_name || selectedSupplier.name) : undefined,
      amount: Number(amount),
      paid_amount: status === 'paid' ? Number(amount) : 0,
      due_date: dueDate,
      paid_at: status === 'paid' ? today : undefined,
      status,
      payment_method: paymentMethod,
      notes: notes.trim() || undefined,
    });

    addToast({
      type: 'success',
      title: 'Despesa Registrada!',
      message: `${description} (${formatCurrency(amount)}) lançado em Contas a Pagar.`,
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Conta a Pagar"
      description="Lançamento de despesas, compras de produtos, contas de consumo e salários"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSubmit}
            leftIcon={<Check size={16} />}
          >
            Salvar Despesa
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Descrição */}
        <Input
          label="Descrição da Despesa"
          placeholder="Ex: Aluguel do Mês, Lote de Shampoos, Conta de Luz..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Categoria */}
        <Select
          label="Categoria da Despesa"
          value={category}
          onChange={(e) => setCategory(e.target.value as PayableCategory)}
          options={[
            { value: 'aluguel', label: '🏢 Aluguel & Estrutura' },
            { value: 'salarios', label: '👥 Salários & Folha' },
            { value: 'funcionarios', label: '💼 Funcionários & Benefícios' },
            { value: 'fornecedores', label: '📦 Fornecedores & Mercadorias' },
            { value: 'materiais', label: '🧴 Materiais & Descartáveis' },
            { value: 'energia', label: '💡 Energia Elétrica & Água' },
            { value: 'internet', label: '🌐 Internet & Telefonia' },
            { value: 'marketing', label: '📢 Marketing & Anúncios' },
            { value: 'impostos', label: '🏛 Impostos & Tributos (DAS)' },
            { value: 'comissoes', label: '✂️ Comissões de Profissionais' },
            { value: 'outros', label: '⚙️ Outros Gastos' },
          ]}
        />

        {/* Fornecedor (Opcional) */}
        {suppliers.length > 0 && (
          <Select
            label="Fornecedor Vinculado (Opcional)"
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              const found = suppliers.find((s) => s.id === e.target.value);
              if (found && !description) {
                setDescription(`Fatura ${found.trade_name || found.name}`);
              }
            }}
            options={[
              { value: '', label: 'Nenhum fornecedor vinculado' },
              ...suppliers.map((s) => ({
                value: s.id,
                label: `${s.trade_name || s.name} (${s.category})`,
              })),
            ]}
          />
        )}

        {/* Valor da Despesa */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Valor a Pagar (R$)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-base font-extrabold text-zinc-900 dark:text-zinc-100"
            required
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

        {/* Status & Forma de Pagamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Select
            label="Status da Conta"
            value={status}
            onChange={(e) => setStatus(e.target.value as PayableStatus)}
            options={[
              { value: 'pending', label: '🟡 Pendente (A Pagar)' },
              { value: 'paid', label: '🟢 Já Pago (Liquidado)' },
              { value: 'overdue', label: '🔴 Vencido em Atraso' },
            ]}
          />

          <Select
            label="Forma de Pagamento"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={[
              { value: 'boleto', label: 'Boleto Bancário' },
              { value: 'pix', label: 'Pix Instantâneo' },
              { value: 'transferencia', label: 'Transferência / TED' },
              { value: 'credito', label: 'Cartão de Crédito' },
              { value: 'debito', label: 'Cartão de Débito' },
              { value: 'dinheiro', label: 'Dinheiro em Espécie' },
              { value: 'outros', label: 'Outro' },
            ]}
          />
        </div>

        {/* Observações */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Observações / Número da Nota Fiscal
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: NF-e 45.120, código de barras do boleto, etc."
            className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
          />
        </div>
      </form>
    </Drawer>
  );
}
