import React, { useState } from 'react';
import {
  Building2,
  Clock,
  Coins,
  MessageSquare,
  ShieldCheck,
  Save,
  CheckCircle2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useFinancialStore } from '../stores/financialStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../utils/format';

type TabType = 'geral' | 'horarios' | 'sinal' | 'whatsapp' | 'plano';

export default function Configuracoes() {
  const { tenant, updateTenant, profile } = useAuthStore();
  const { depositConfig, updateDepositConfig } = useFinancialStore();
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabType>('geral');
  const [isSaving, setIsSaving] = useState(false);

  // Form State - Estabelecimento
  const [name, setName] = useState(tenant?.name || 'Meu Estabelecimento');
  const [businessType, setBusinessType] = useState(tenant?.business_type || 'beauty_salon');
  const [phone, setPhone] = useState(tenant?.phone || '11999998888');
  const [email, setEmail] = useState(tenant?.email || 'contato@estabelecimento.com');
  const [address, setAddress] = useState(tenant?.address || 'Av. Paulista, 1000 - São Paulo, SP');
  const [slug, setSlug] = useState(tenant?.slug || 'meu-estabelecimento');

  // Form State - Horários
  const [openingTime, setOpeningTime] = useState(tenant?.settings?.opening_time || '08:00');
  const [closingTime, setClosingTime] = useState(tenant?.settings?.closing_time || '20:00');
  const [intervalMinutes, setIntervalMinutes] = useState(
    tenant?.settings?.interval_minutes?.toString() || '30'
  );
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(
    tenant?.settings?.allow_online_booking ?? true
  );

  // Form State - Dias da Semana (0: Domingo, 1: Seg, ... 6: Sáb)
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  // Form State - Sinal / Pix
  const [depositEnabled, setDepositEnabled] = useState(depositConfig.enabled);
  const [depositType, setDepositType] = useState<'percentage' | 'fixed'>(depositConfig.type);
  const [depositValue, setDepositValue] = useState(depositConfig.value.toString());
  const [pixKeyType, setPixKeyType] = useState(depositConfig.pix_key_type || 'cnpj');
  const [pixKey, setPixKey] = useState(depositConfig.pix_key || '12.345.678/0001-90');
  const [depositInstructions, setDepositInstructions] = useState(
    depositConfig.instructions ||
      'Para confirmar seu agendamento, solicitamos um sinal via Pix. O restante do valor é acertado no dia do atendimento.'
  );

  const toggleDay = (dayIndex: number) => {
    if (workingDays.includes(dayIndex)) {
      if (workingDays.length === 1) {
        addToast({
          type: 'warning',
          title: 'Atenção',
          message: 'Selecione pelo menos um dia de funcionamento.',
        });
        return;
      }
      setWorkingDays(workingDays.filter((d) => d !== dayIndex));
    } else {
      setWorkingDays([...workingDays, dayIndex].sort());
    }
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Atualiza Tenant
      updateTenant({
        name,
        business_type: businessType as any,
        phone,
        email,
        address,
        slug,
        settings: {
          opening_time: openingTime,
          closing_time: closingTime,
          interval_minutes: parseInt(intervalMinutes) || 30,
          allow_online_booking: allowOnlineBooking,
        },
      });

      // 2. Atualiza Configuração de Sinal no Financeiro
      updateDepositConfig({
        enabled: depositEnabled,
        type: depositType,
        value: parseFloat(depositValue) || 0,
        pix_key_type: pixKeyType as any,
        pix_key: pixKey,
        instructions: depositInstructions,
      });

      addToast({
        type: 'success',
        title: 'Configurações Salvas com Sucesso! 💾',
        message: 'Todos os parâmetros da empresa e políticas de agendamento foram atualizados.',
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Erro ao Salvar',
        message: 'Não foi possível salvar as configurações.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const daysLabels = [
    { index: 0, label: 'Dom', full: 'Domingo' },
    { index: 1, label: 'Seg', full: 'Segunda-feira' },
    { index: 2, label: 'Ter', full: 'Terça-feira' },
    { index: 3, label: 'Qua', full: 'Quarta-feira' },
    { index: 4, label: 'Qui', full: 'Quinta-feira' },
    { index: 5, label: 'Sex', full: 'Sexta-feira' },
    { index: 6, label: 'Sáb', full: 'Sábado' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-violet-500/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 text-[10px] font-black uppercase tracking-wider bg-white/20 rounded-md backdrop-blur-sm">
              Gestão da Empresa
            </span>
            <Badge variant="neutral" className="bg-white/20 border-white/30 text-white text-[10px]">
              {profile?.role === 'super_admin' || profile?.role === 'owner' ? 'Proprietário' : 'Admin'}
            </Badge>
          </div>
          <h1 className="text-2xl font-black mt-1 tracking-tight">
            Configurações do Estabelecimento
          </h1>
          <p className="text-xs text-violet-100 max-w-xl mt-0.5">
            Personalize os dados comerciais, horários de expediente, regras de agendamento e políticas de sinal da sua empresa.
          </p>
        </div>

        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-white hover:bg-violet-50 text-violet-900 font-extrabold shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95 shrink-0"
          leftIcon={<Save size={16} />}
        >
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-zinc-100 dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('geral')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'geral'
              ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Building2 size={15} />
          Estabelecimento
        </button>

        <button
          onClick={() => setActiveTab('horarios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'horarios'
              ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Clock size={15} />
          Expediente & Agenda
        </button>

        <button
          onClick={() => setActiveTab('sinal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'sinal'
              ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Coins size={15} />
          Política de Sinal & Pix
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <MessageSquare size={15} />
          Mensagens WhatsApp
        </button>

        <button
          onClick={() => setActiveTab('plano')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'plano'
              ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <ShieldCheck size={15} />
          Plano & Sistema
        </button>
      </div>

      {/* Content Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* 1. ABA GERAL */}
        {activeTab === 'geral' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#13101e] border border-violet-100/80 dark:border-violet-900/30 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Building2 size={18} className="text-violet-500" />
                Dados do Estabelecimento
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Estas informações aparecem nos comprovantes, mensagens para clientes e na página pública.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Nome do Estabelecimento *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Studio Bella Donna, Barbearia Dom Pedro"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Segmento de Atuação
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="beauty_salon">Salão de Beleza & Cabelereiro</option>
                  <option value="barbershop">Barbearia & Barber Shop</option>
                  <option value="aesthetic_clinic">Clínica de Estética & Spa</option>
                  <option value="health_clinic">Saúde, Nutrição & Fisioterapia</option>
                  <option value="other">Outro Ramo de Atendimento</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Phone size={13} className="text-emerald-500" />
                  Telefone Comercial / WhatsApp *
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 11999998888"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Mail size={13} className="text-blue-500" />
                  E-mail de Contato
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: contato@studio.com"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <MapPin size={13} className="text-rose-500" />
                  Endereço Completo
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores, 123, Sala 4 - Centro, São Paulo - SP"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Globe size={13} className="text-indigo-500" />
                  Link Personalizado da Agenda Online (Slug)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono select-none">
                    agenda.ai/
                  </span>
                  <Input
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '')
                      )
                    }
                    placeholder="meu-estabelecimento"
                    className="flex-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ABA EXPEDIENTE & AGENDA */}
        {activeTab === 'horarios' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#13101e] border border-violet-100/80 dark:border-violet-900/30 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Clock size={18} className="text-violet-500" />
                Jornada de Trabalho e Horários
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Defina o expediente do estabelecimento. Agendamentos fora desse período serão bloqueados automaticamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Horário de Abertura *
                </label>
                <Input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Horário de Fechamento *
                </label>
                <Input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Intervalo entre Horários
                </label>
                <select
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos (Recomendado)</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos (1 hora)</option>
                </select>
              </div>
            </div>

            {/* Dias de Funcionamento */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                Dias da Semana em Funcionamento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {daysLabels.map((d) => {
                  const isSelected = workingDays.includes(d.index);
                  return (
                    <button
                      key={d.index}
                      type="button"
                      onClick={() => toggleDay(d.index)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 font-bold shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-400 font-medium hover:border-zinc-300'
                      }`}
                    >
                      <span className="text-xs uppercase">{d.label}</span>
                      <span className="text-[10px] text-zinc-400">
                        {isSelected ? 'Aberto' : 'Fechado'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto Agendamento Online Toggle */}
            <div className="p-4 rounded-xl bg-violet-50/30 dark:bg-violet-950/20 border border-violet-100/70 dark:border-violet-900/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                  Permitir Auto-Agendamento Online por Clientes
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Habilita o link público para seus clientes escolherem serviços e marcarem horários sozinhos.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowOnlineBooking}
                onChange={(e) => setAllowOnlineBooking(e.target.checked)}
                className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 3. ABA SINAL & PIX */}
        {activeTab === 'sinal' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#13101e] border border-violet-100/80 dark:border-violet-900/30 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Coins size={18} className="text-violet-500" />
                Política de Sinal e Cobrança Antecipada
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Exija um adiantamento via Pix para evitar faltas (*no-show*) e garantir o faturamento dos profissionais.
              </p>
            </div>

            {/* Toggle de Exigência */}
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                  Exigir Pagamento de Sinal para Confirmar Agendamentos?
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Quando ativo, o sistema gera a cobrança de sinal no Contas a Receber e anexa a chave Pix às mensagens.
                </span>
              </div>
              <input
                type="checkbox"
                checked={depositEnabled}
                onChange={(e) => setDepositEnabled(e.target.checked)}
                className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
              />
            </div>

            {depositEnabled && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Tipo de Cálculo do Sinal
                    </label>
                    <select
                      value={depositType}
                      onChange={(e) => setDepositType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    >
                      <option value="percentage">Percentual (%) do valor do serviço</option>
                      <option value="fixed">Valor Fixo (R$) por atendimento</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {depositType === 'percentage' ? 'Percentual do Sinal (%)' : 'Valor Fixo (R$)'}
                    </label>
                    <Input
                      type="number"
                      value={depositValue}
                      onChange={(e) => setDepositValue(e.target.value)}
                      min="1"
                      max={depositType === 'percentage' ? '100' : '1000'}
                      placeholder={depositType === 'percentage' ? 'Ex: 30' : 'Ex: 40'}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Tipo de Chave Pix do Estabelecimento
                    </label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    >
                      <option value="cnpj">CNPJ</option>
                      <option value="cpf">CPF</option>
                      <option value="phone">Telefone / Celular</option>
                      <option value="email">E-mail</option>
                      <option value="random">Chave Aleatória (EVP)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Chave Pix para Recebimento *
                    </label>
                    <Input
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Insira sua chave Pix cadastrada"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Instruções de Pagamento do Sinal (Enviadas ao Cliente)
                  </label>
                  <textarea
                    rows={3}
                    value={depositInstructions}
                    onChange={(e) => setDepositInstructions(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. ABA WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#13101e] border border-violet-100/80 dark:border-violet-900/30 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-500" />
                Templates e Automação de WhatsApp
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Mensagens geradas dinamicamente com informações do serviço, dia, horário e valores.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Prévia: Confirmação de Agendamento
                  </span>
                  <Badge variant="success">Ativo</Badge>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                  {`Olá, *[Nome do Cliente]*! Tudo bem? 👋\n\nSeu agendamento no *${name}* foi *CONFIRMADO* com sucesso! ✅\n\n🗓 *Data:* 28/09/2026 (Segunda-feira)\n⏰ *Horário:* 14:00 às 14:45\n✂️ *Serviço:* Corte & Barba\n👤 *Profissional:* Camila Silva\n💰 *Valor:* R$ 80,00\n📍 *Local:* ${address || name}\n\nEstamos ansiosos para te receber! ✨`}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-violet-50/30 dark:bg-violet-950/20 border border-violet-100/80 dark:border-violet-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-800 dark:text-violet-300">
                    Prévia: Lembrete de Horário com Resposta Rápida (1 / 2)
                  </span>
                  <Badge variant="info">Ativo</Badge>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                  {`Olá, *[Nome do Cliente]*! Tudo bem? 👋\n\nPassando para lembrar do seu agendamento no *${name}*! 🔔\n\n🗓 *Data:* 28/09/2026\n⏰ *Horário:* 14:00\n✂️ *Serviço:* Corte & Barba\n\nPodemos confirmar sua presença? Por favor, responda:\n*1* para Confirmar ✅\n*2* para Remarcar 🔄`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. ABA PLANO & SISTEMA */}
        {activeTab === 'plano' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#13101e] border border-violet-100/80 dark:border-violet-900/30 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck size={18} className="text-violet-500" />
                Informações da Assinatura & Sistema
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Status da sua licença multi-tenant e recursos disponíveis.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-violet-500/10">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Licença Ativa
                </span>
                <h3 className="text-xl font-black mt-1">Plano Pro Enterprise</h3>
                <p className="text-xs text-violet-100 mt-0.5">
                  Agendamentos ilimitados, WhatsApp integrado, inteligência artificial e financeiro completo.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-center shrink-0">
                <span className="text-[10px] text-violet-200 block uppercase font-bold">Status</span>
                <span className="text-sm font-extrabold text-white flex items-center gap-1 justify-center">
                  <CheckCircle2 size={15} className="text-emerald-400" /> Ativo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Tenant ID</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {tenant?.id || 'tenant-default'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-500 font-medium">Usuário Conectado</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {profile?.full_name || 'Administrador'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-8"
            leftIcon={<Save size={16} />}
          >
            {isSaving ? 'Salvando...' : 'Salvar Todas as Configurações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
