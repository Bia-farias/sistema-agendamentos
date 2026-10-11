import React, { useState } from 'react';
import { useFinancialStore } from '../stores/financialStore';
import { useUIStore } from '../stores/uiStore';
import { FinancialPeriod } from '../types/financeiro';
import { FinancialAlerts } from '../components/financeiro/FinancialAlerts';
import { FinancialKPIsGrid } from '../components/financeiro/FinancialKPIsGrid';
import { FinancialCharts } from '../components/financeiro/FinancialCharts';
import { ContasReceberTab } from '../components/financeiro/ContasReceberTab';
import { ContasPagarTab } from '../components/financeiro/ContasPagarTab';
import { FluxoCaixaTab } from '../components/financeiro/FluxoCaixaTab';
import { FornecedoresMercadoriasTab } from '../components/financeiro/FornecedoresMercadoriasTab';
import { ComissoesTab } from '../components/financeiro/ComissoesTab';
import { FormasPagamentoTab } from '../components/financeiro/FormasPagamentoTab';
import { RelatoriosTab } from '../components/financeiro/RelatoriosTab';
import { NovaCobrancaModal } from '../components/financeiro/NovaCobrancaModal';
import { NovaDespesaModal } from '../components/financeiro/NovaDespesaModal';
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Scissors,
  Building2,
  CreditCard,
  FileText,
  Plus,
  Calendar,
  RotateCcw,
} from 'lucide-react';

export default function Financeiro() {
  const { activePeriod, setActivePeriod, clearAllFinancialData } = useFinancialStore();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const periods: { id: FinancialPeriod; label: string }[] = [
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mês' },
    { id: 'next_month', label: 'Próximo Mês' },
    { id: 'all', label: 'Todo o Período' },
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'receber', label: 'Contas a Receber', icon: ArrowUpRight },
    { id: 'pagar', label: 'Contas a Pagar', icon: ArrowDownLeft },
    { id: 'fluxo', label: 'Fluxo de Caixa', icon: Wallet },
    { id: 'comissoes', label: 'Comissões', icon: Scissors },
    { id: 'mercadorias', label: 'Fornecedores & Estoque', icon: Building2 },
    { id: 'formas_pagamento', label: 'Formas & Sinal', icon: CreditCard },
    { id: 'relatorios', label: 'Relatórios & DRE', icon: FileText },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2.5">
            Gestão Financeira & DRE
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Controle de receitas, contas a pagar, fluxo de caixa, fornecedores, comissões e sinal de agendamento.
          </p>
        </div>

        {/* Global Period Selector & Quick Add Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800 shadow-xs">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePeriod === p.id
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReceivableModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={15} />
              + Recebimento
            </button>

            <button
              onClick={() => setIsPayableModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={15} />
              + Despesa
            </button>

            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer"
              title="Limpar dados de teste e zerar lançamentos"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Financial Alerts */}
      <FinancialAlerts onNavigateTab={(tab) => setActiveTab(tab)} />

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Rendering */}
      <div>
        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <FinancialKPIsGrid />
            <FinancialCharts />
          </div>
        )}

        {/* 2. Contas a Receber Tab */}
        {activeTab === 'receber' && <ContasReceberTab />}

        {/* 3. Contas a Pagar Tab */}
        {activeTab === 'pagar' && <ContasPagarTab />}

        {/* 4. Fluxo de Caixa Tab */}
        {activeTab === 'fluxo' && <FluxoCaixaTab />}

        {/* 5. Comissões Tab */}
        {activeTab === 'comissoes' && <ComissoesTab />}

        {/* 6. Fornecedores & Mercadorias Tab */}
        {activeTab === 'mercadorias' && <FornecedoresMercadoriasTab />}

        {/* 7. Formas de Pagamento & Sinal Tab */}
        {activeTab === 'formas_pagamento' && <FormasPagamentoTab />}

        {/* 8. Relatórios & DRE Tab */}
        {activeTab === 'relatorios' && <RelatoriosTab />}
      </div>

      {/* Modais Globais de Lançamento */}
      <NovaCobrancaModal
        isOpen={isReceivableModalOpen}
        onClose={() => setIsReceivableModalOpen(false)}
      />
      <NovaDespesaModal
        isOpen={isPayableModalOpen}
        onClose={() => setIsPayableModalOpen(false)}
      />

      {/* Modal de Confirmação para Zerar Base */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#121215] rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Limpar Dados de Teste?
                </h3>
                <p className="text-xs text-zinc-400">Esta ação zera todos os lançamentos</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Deseja remover todos os lançamentos financeiros (contas a receber, contas a pagar, fornecedores cadastrados e estoque de mercadorias)? A base ficará completamente limpa para você cadastrar seus dados reais.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  clearAllFinancialData();
                  addToast({
                    type: 'success',
                    title: 'Base Zerada',
                    message: 'Todos os registros de teste foram removidos.',
                  });
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
