import React, { useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { useUIStore } from '../../stores/uiStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Building2, Truck, Check, Phone, Mail, MapPin } from 'lucide-react';

interface NovoFornecedorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NovoFornecedorModal({ isOpen, onClose }: NovoFornecedorModalProps) {
  const { addSupplier } = useFinancialStore();
  const { addToast } = useUIStore();

  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      addToast({
        type: 'error',
        title: 'Dados incompletos',
        message: 'Preencha a Razão Social/Nome e o Telefone do fornecedor.',
      });
      return;
    }

    addSupplier({
      name: name.trim(),
      trade_name: tradeName.trim() || undefined,
      document: document.trim() || 'Não informado',
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      carrier_name: carrierName.trim() || undefined,
      category: category.trim() || 'Geral / Cosméticos',
      notes: notes.trim() || undefined,
    });

    addToast({
      type: 'success',
      title: 'Fornecedor Cadastrado!',
      message: `${tradeName || name} adicionado à lista de parceiros.`,
    });

    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Fornecedor"
      description="Cadastre parceiros, distribuidores e informe a transportadora de frete"
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
            Salvar Fornecedor
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nomes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Input
            label="Razão Social / Nome da Empresa"
            placeholder="Ex: L'Oréal Brasil Cosméticos Ltda"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Nome Fantasia / Marca"
            placeholder="Ex: L'Oréal Pro"
            value={tradeName}
            onChange={(e) => setTradeName(e.target.value)}
          />
        </div>

        {/* Documento & Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Input
            label="CNPJ ou CPF"
            placeholder="00.000.000/0001-00"
            value={document}
            onChange={(e) => setDocument(e.target.value)}
          />
          <Input
            label="Linha / Categoria de Fornecimento"
            placeholder="Ex: Colorações, Shampoos, Descartáveis"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        {/* Contato */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Input
            label="Telefone / WhatsApp Comercial"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone size={14} />}
            required
          />
          <Input
            label="E-mail de Pedidos"
            placeholder="pedidos@fornecedor.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={14} />}
          />
        </div>

        {/* Transportadora Parceira */}
        <div className="p-3.5 rounded-2xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 space-y-1.5">
          <label className="text-xs font-bold text-violet-900 dark:text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
            <Truck size={15} className="text-violet-600 dark:text-violet-400" />
            Nome da Transportadora Parceira
          </label>
          <Input
            placeholder="Ex: Braspress, Jadlog, Total Express, Loggi..."
            value={carrierName}
            onChange={(e) => setCarrierName(e.target.value)}
          />
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            A transportadora utilizada nas entregas das mercadorias deste fornecedor.
          </p>
        </div>

        {/* Endereço */}
        <Input
          label="Endereço / Cidade / Estado"
          placeholder="Ex: Av. Paulista, 1000 - São Paulo/SP"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          leftIcon={<MapPin size={14} />}
        />

        {/* Observações */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Observações Comerciais & Prazos
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Pedido mínimo de R$ 500, frete grátis, faturamento em 28 dias..."
            className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
          />
        </div>
      </form>
    </Drawer>
  );
}
