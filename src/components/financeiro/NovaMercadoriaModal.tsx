import React, { useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { useUIStore } from '../../stores/uiStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../utils/format';
import { Package, Truck, Check, Building2 } from 'lucide-react';

interface NovaMercadoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NovaMercadoriaModal({ isOpen, onClose }: NovaMercadoriaModalProps) {
  const { addMerchandise, suppliers } = useFinancialStore();
  const { addToast } = useUIStore();

  const [name, setName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [minQuantity, setMinQuantity] = useState<number>(3);
  const [unit, setUnit] = useState('un');
  const [costPrice, setCostPrice] = useState<number>(50);
  const [salePrice, setSalePrice] = useState<number>(100);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const handleSelectSupplier = (id: string) => {
    setSupplierId(id);
    const found = suppliers.find((s) => s.id === id);
    if (found && found.carrier_name) {
      setCarrierName(found.carrier_name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || quantity < 0 || costPrice < 0) {
      addToast({
        type: 'error',
        title: 'Dados incompletos',
        message: 'Preencha o nome do produto, quantidade e custo.',
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    addMerchandise({
      name: name.trim(),
      supplier_id: supplierId || undefined,
      supplier_name: selectedSupplier ? (selectedSupplier.trade_name || selectedSupplier.name) : undefined,
      carrier_name: carrierName.trim() || (selectedSupplier?.carrier_name) || undefined,
      quantity: Number(quantity),
      min_quantity: Number(minQuantity),
      unit: unit.trim() || 'un',
      cost_price: Number(costPrice),
      sale_price: salePrice ? Number(salePrice) : undefined,
      last_restock_date: today,
    });

    addToast({
      type: 'success',
      title: 'Mercadoria Cadastrada!',
      message: `${name} adicionado ao controle de estoque.`,
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Mercadoria / Estoque"
      description="Cadastre produtos para uso interno no salão/clínica ou para revenda"
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
            Cadastrar Mercadoria
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome do Produto */}
        <Input
          label="Nome da Mercadoria / Insumo"
          placeholder="Ex: Shampoo Reconstrutor 1L, Luvas Nitrila, Pó Descolorante..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Fornecedor */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} className="text-violet-500" />
            Fornecedor Responsável
          </label>
          <Select
            value={supplierId}
            onChange={(e) => handleSelectSupplier(e.target.value)}
            options={[
              { value: '', label: 'Sem fornecedor específico' },
              ...suppliers.map((s) => ({
                value: s.id,
                label: `${s.trade_name || s.name} (${s.category})`,
              })),
            ]}
          />
        </div>

        {/* Transportadora */}
        <Input
          label="Nome da Transportadora"
          placeholder="Ex: Braspress, Jadlog, Total Express..."
          value={carrierName}
          onChange={(e) => setCarrierName(e.target.value)}
          leftIcon={<Truck size={14} />}
        />

        {/* Quantidades e Unidade */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase block mb-1">
              Qtd Inicial
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-amber-600 uppercase block mb-1">
              Estoque Mínimo
            </label>
            <input
              type="number"
              min="0"
              value={minQuantity}
              onChange={(e) => setMinQuantity(Number(e.target.value))}
              className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-900 dark:text-zinc-100"
              title="Avisa quando a quantidade estiver igual ou abaixo deste número"
              required
            />
          </div>

          <Select
            label="Unidade"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            options={[
              { value: 'un', label: 'Unidade (un)' },
              { value: 'cx', label: 'Caixa (cx)' },
              { value: 'pct', label: 'Pacote (pct)' },
              { value: 'kg', label: 'Quilo (kg)' },
              { value: 'litro', label: 'Litro (L)' },
              { value: 'ml', label: 'Mililitro (ml)' },
            ]}
          />
        </div>

        {/* Custos e Preço de Venda */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase block mb-1">
              Preço de Custo (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm font-bold text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-emerald-600 uppercase block mb-1">
              Preço de Venda (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={salePrice}
              onChange={(e) => setSalePrice(Number(e.target.value))}
              placeholder="Opcional se for revenda"
              className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm font-bold text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Resumo do Valor Total em Estoque */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-500">Valor Imobilizado no Estoque:</span>
          <span className="font-mono font-extrabold text-base text-violet-600 dark:text-violet-400">
            {formatCurrency(quantity * costPrice)}
          </span>
        </div>
      </form>
    </Drawer>
  );
}
