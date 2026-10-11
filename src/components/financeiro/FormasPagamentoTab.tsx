import React, { useState } from 'react';
import { useFinancialStore } from '../../stores/financialStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency } from '../../utils/format';
import {
  CreditCard,
  DollarSign,
  Percent,
  Calculator,
  ShieldCheck,
  Save,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export function FormasPagamentoTab() {
  const {
    paymentSettings,
    depositConfig,
    updatePaymentSetting,
    updateDepositConfig,
  } = useFinancialStore();
  const { addToast } = useUIStore();

  // Local state for deposit config editing
  const [depositEnabled, setDepositEnabled] = useState(depositConfig.enabled);
  const [depositType, setDepositType] = useState(depositConfig.type);
  const [depositValue, setDepositValue] = useState(depositConfig.value);
  const [depositInstructions, setDepositInstructions] = useState(
    depositConfig.instructions
  );

  // Card Simulator states
  const [simAmount, setSimAmount] = useState<number>(300);
  const [simInstallments, setSimInstallments] = useState<number>(3);

  const handleSaveDepositConfig = () => {
    updateDepositConfig({
      enabled: depositEnabled,
      type: depositType,
      value: Number(depositValue),
      instructions: depositInstructions,
    });
    addToast({
      type: 'success',
      title: 'Configuração de Sinal Salva!',
      message: depositEnabled
        ? `Sinal obrigatório configurado em ${depositType === 'percentage' ? `${depositValue}%` : formatCurrency(depositValue)}.`
        : 'Cobrança de sinal desativada para novos agendamentos.',
    });
  };

  // Card Simulator calculation
  const creditSetting = paymentSettings.find((s) => s.method === 'credito');
  const baseRate = creditSetting?.operator_fee_percentage || 3.19;
  const stepRate = creditSetting?.installments_fee_step || 0.99;

  // Rate increases slightly with installments if > 1
  const effectiveRate =
    simInstallments === 1
      ? baseRate
      : baseRate + (simInstallments - 1) * stepRate;

  const feeAmount = (simAmount * effectiveRate) / 100;
  const netAmount = Math.max(0, simAmount - feeAmount);
  const installmentAmount = simAmount / simInstallments;

  return (
    <div className="space-y-6">
      {/* 1. SEÇÃO SINAL PARA AGENDAMENTO */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-50/80 via-white to-purple-50/40 dark:from-violet-950/20 dark:via-[#121215] dark:to-[#181424] border border-violet-200/80 dark:border-violet-900/40 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-500/25">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Sinal de Agendamento (Reserva Garantida)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Exija um adiantamento no agendamento para reduzir faltas (no-show) a zero
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-auto p-1.5 px-3 rounded-xl bg-violet-100/70 dark:bg-violet-950/40">
            <input
              type="checkbox"
              checked={depositEnabled}
              onChange={(e) => setDepositEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 accent-violet-600"
            />
            <span className="text-xs font-bold text-violet-900 dark:text-violet-200">
              {depositEnabled ? 'Sinal Ativado' : 'Sinal Desativado'}
            </span>
          </label>
        </div>

        {depositEnabled && (
          <div className="space-y-4 pt-3 border-t border-violet-100 dark:border-violet-900/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo de Sinal: Percentual ou Valor Fixo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Modelo de Cobrança do Sinal
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositType('percentage')}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      depositType === 'percentage'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Percent size={14} />
                    Percentual (%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepositType('fixed')}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      depositType === 'fixed'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <DollarSign size={14} />
                    Valor Fixo (R$)
                  </button>
                </div>
              </div>

              {/* Valor do Sinal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  {depositType === 'percentage'
                    ? 'Porcentagem do Serviço (%)'
                    : 'Valor do Sinal em Reais (R$)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={depositType === 'percentage' ? 100 : 1000}
                    value={depositValue}
                    onChange={(e) => setDepositValue(Number(e.target.value))}
                    className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-sm font-extrabold text-zinc-900 dark:text-zinc-100"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    {depositType === 'percentage' ? '%' : 'BRL'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instruções para o Cliente */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Instruções de Pagamento e Chave Pix
              </label>
              <textarea
                rows={2}
                value={depositInstructions}
                onChange={(e) => setDepositInstructions(e.target.value)}
                placeholder="Ex: Chave Pix (CNPJ): 12.345.678/0001-90. Envie o comprovante em até 2 horas para segurar o horário."
                className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              />
            </div>

            {/* Exemplo de Aplicação */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs flex items-center justify-between">
              <span className="text-emerald-900 dark:text-emerald-300 font-medium">
                Simulação: Em um serviço de <strong>R$ 100,00</strong>, o cliente pagará{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {depositType === 'percentage'
                    ? formatCurrency((100 * depositValue) / 100)
                    : formatCurrency(depositValue)}
                </strong>{' '}
                de sinal e o restante no atendimento.
              </span>
              <button
                type="button"
                onClick={handleSaveDepositConfig}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              >
                <Save size={14} />
                Salvar Regra
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. CONFIGURAÇÃO DE FORMAS DE PAGAMENTO & TAXAS */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Formas de Pagamento & Taxas da Maquininha
            </h3>
            <p className="text-xs text-zinc-400">
              Ative os métodos aceitos e configure as taxas para calcular o lucro líquido real
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {paymentSettings.map((set) => (
            <div
              key={set.id}
              className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {set.name}
                </span>
                <input
                  type="checkbox"
                  checked={set.enabled}
                  onChange={(e) => updatePaymentSetting(set.id, { enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Taxa da Operadora:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={set.operator_fee_percentage}
                      onChange={(e) =>
                        updatePaymentSetting(set.id, {
                          operator_fee_percentage: Number(e.target.value),
                        })
                      }
                      className="w-16 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs font-mono font-bold"
                    />
                    <span className="font-bold text-zinc-500">%</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 block">Prazo Repasse:</span>
                  <span className="font-bold font-mono text-zinc-700 dark:text-zinc-300 mt-1 block">
                    {set.settlement_days === 0 ? 'Imediato (D+0)' : `D+${set.settlement_days}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SIMULADOR DE CARTÃO (Valor Bruto x Líquido x Parcelas) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
            <Calculator size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Simulador de Venda & Antecipação de Cartão
            </h3>
            <p className="text-xs text-zinc-400">
              Calcule exatamente o valor líquido que cai na conta bancária descontando a taxa
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase block mb-1">
                Valor Total da Venda (R$)
              </label>
              <input
                type="number"
                min="10"
                step="10"
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3.5 py-2.5 text-base font-extrabold text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                  Número de Parcelas:
                </span>
                <span className="font-bold text-violet-600 dark:text-violet-400">
                  {simInstallments}x de {formatCurrency(installmentAmount)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={simInstallments}
                onChange={(e) => setSimInstallments(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>1x (À vista)</span>
                <span>6x</span>
                <span>12x</span>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-sans">Valor Bruto Cobrado:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(simAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-sans">
                Taxa Operadora ({effectiveRate.toFixed(2)}%):
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                - {formatCurrency(feeAmount)}
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-sans">
                Valor Líquido na Conta:
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(netAmount)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between font-sans">
              <span>Data Prevista de Recebimento:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {simInstallments === 1 ? '30 dias (D+30)' : 'Mensal conforme parcelas'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
