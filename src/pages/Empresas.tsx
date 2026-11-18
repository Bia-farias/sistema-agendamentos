import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserCheck,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Sparkles,
  Power,
} from 'lucide-react';
import { SaasCompany } from '../types';
import { tenantApiService } from '../services/api/tenantService';
import { useUIStore } from '../stores/uiStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { EmptyState } from '../components/ui/EmptyState';
import { formatPhone } from '../utils/format';

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  BEAUTY_SALON: 'Salão de Beleza & Studio',
  BARBERSHOP: 'Barbearia',
  AESTHETIC_CLINIC: 'Clínica de Estética',
  HEALTH_CLINIC: 'Clínica de Saúde & Bem-Estar',
  OTHER: 'Outro Segmento',
};

const PLAN_LABELS: Record<string, { label: string; color: 'primary' | 'success' | 'warning' | 'neutral' }> = {
  ENTERPRISE: { label: 'Enterprise', color: 'primary' },
  PRO: { label: 'Plano PRO', color: 'primary' },
  ADVANCE: { label: 'Advance', color: 'success' },
  STARTER: { label: 'Starter', color: 'warning' },
  FREE: { label: 'Gratuito', color: 'neutral' },
  FREE_SINGLE: { label: 'Free Single', color: 'neutral' },
};

export default function Empresas() {
  const { addToast } = useUIStore();

  const [companies, setCompanies] = useState<SaasCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<SaasCompany | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('BEAUTY_SALON');
  const [plan, setPlan] = useState('PRO');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await tenantApiService.listSaasCompanies();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao carregar empresas',
        message: err?.message || 'Não foi possível consultar a lista de empresas.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const openCreateDrawer = () => {
    setEditingCompany(null);
    setCompanyName('');
    setBusinessType('BEAUTY_SALON');
    setPlan('PRO');
    setPhone('');
    setAddress('');
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    setShowPassword(false);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (company: SaasCompany) => {
    setEditingCompany(company);
    setCompanyName(company.name);
    setBusinessType(company.businessType || 'BEAUTY_SALON');
    setPlan(company.plan || 'PRO');
    setPhone(company.phone || '');
    setAddress(company.address || '');
    setAdminName(company.admin?.fullName || `Admin ${company.name}`);
    setAdminEmail(company.admin?.email || company.email || '');
    setAdminPassword('');
    setShowPassword(false);
    setIsDrawerOpen(true);
  };

  const handleCopyEmail = (id: string, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    addToast({
      type: 'info',
      title: 'Login Copiado!',
      message: `O e-mail "${email}" foi copiado para a área de transferência.`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGeneratePassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setAdminPassword(`Admin@${randomNum}`);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim() || !adminName.trim() || !adminEmail.trim()) {
      addToast({
        type: 'error',
        title: 'Campos Obrigatórios',
        message: 'Preencha o nome da empresa, nome do responsável e o e-mail de login do Admin.',
      });
      return;
    }

    if (!editingCompany && adminPassword.trim().length < 6) {
      addToast({
        type: 'error',
        title: 'Senha Obrigatória',
        message: 'Defina uma senha com no mínimo 6 caracteres para o login Admin da empresa.',
      });
      return;
    }

    if (editingCompany && adminPassword.trim().length > 0 && adminPassword.trim().length < 6) {
      addToast({
        type: 'error',
        title: 'Senha muito curta',
        message: 'A nova senha do Admin deve ter no mínimo 6 caracteres.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCompany) {
        const updated = await tenantApiService.updateSaasCompany(editingCompany.id, {
          name: companyName.trim(),
          businessType,
          plan,
          phone: phone.trim() || null,
          address: address.trim() || null,
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim().toLowerCase(),
          ...(adminPassword.trim().length >= 6
            ? { adminPassword: adminPassword.trim() }
            : {}),
        });

        setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        addToast({
          type: 'success',
          title: 'Empresa e Acesso Atualizados!',
          message:
            adminPassword.trim().length >= 6
              ? `Os dados e a nova senha do Admin (${updated.admin?.email}) foram salvos.`
              : `As informações de ${updated.name} foram atualizadas.`,
        });
      } else {
        const created = await tenantApiService.createSaasCompany({
          name: companyName.trim(),
          businessType,
          plan,
          phone: phone.trim() || null,
          address: address.trim() || null,
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim().toLowerCase(),
          adminPassword: adminPassword.trim(),
        });

        setCompanies((prev) => [created, ...prev]);
        addToast({
          type: 'success',
          title: 'Empresa Criada com Sucesso!',
          message: `O login Admin (${created.admin?.email}) já está pronto para uso.`,
        });
      }

      setIsDrawerOpen(false);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Falha ao salvar empresa',
        message: err?.message || 'Verifique os dados informados e tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCompanyStatus = async (company: SaasCompany) => {
    const nextActive = !company.isActive;
    try {
      const updated = await tenantApiService.updateSaasCompany(company.id, {
        isActive: nextActive,
      });
      setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      addToast({
        type: nextActive ? 'success' : 'warning',
        title: nextActive ? 'Acesso da Empresa Liberado' : 'Acesso da Empresa Suspenso',
        message: nextActive
          ? `O login Admin e equipe de ${company.name} foram reativados.`
          : `Os acessos de ${company.name} foram temporariamente bloqueados.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao alterar status',
        message: err?.message || 'Não foi possível alterar o status da empresa.',
      });
    }
  };

  const handleDeleteCompany = async (company: SaasCompany) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a empresa "${company.name}" e todos os seus acessos?`
      )
    ) {
      return;
    }

    try {
      await tenantApiService.deleteSaasCompany(company.id);
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
      addToast({
        type: 'info',
        title: 'Empresa Removida',
        message: `${company.name} foi excluída da plataforma.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Não permitido',
        message: err?.message || 'Não foi possível excluir esta empresa.',
      });
    }
  };

  // Filtered companies
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.admin?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.admin?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return c.isActive;
    if (statusFilter === 'suspended') return !c.isActive;
    return true;
  });

  // Global SaaS Metrics
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.isActive).length;
  const totalProfessionals = companies.reduce(
    (acc, c) => acc + (c.metrics?.professionalsCount || 0),
    0
  );
  const totalAppointments = companies.reduce(
    (acc, c) => acc + (c.metrics?.appointmentsCount || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Banner Master Owner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 sm:p-8 text-white shadow-lg shadow-violet-500/20">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Acesso Master (OWNER) • Controle SaaS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Gestão de Empresas & Logins Admin
            </h1>
            <p className="text-xs sm:text-sm text-violet-100 leading-relaxed">
              Crie novas empresas clientes, gerencie o status de assinatura e defina o{' '}
              <strong>Login e Senha do ADMIN</strong> de cada empresa. O <strong>ADMIN</strong> de
              cada empresa terá acesso a todas as funcionalidades operacionais e criará os acessos
              dos seus próprios profissionais.
            </p>
          </div>

          <Button
            onClick={openCreateDrawer}
            leftIcon={<Plus size={18} />}
            className="bg-white !text-violet-700 hover:bg-violet-50 font-extrabold shadow-md shrink-0 self-start lg:self-center"
          >
            Nova Empresa + Login Admin
          </Button>
        </div>
      </div>

      {/* KPIs Globais da Plataforma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-200/60 dark:border-violet-500/20">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Empresas Clientes
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{totalCompanies}</p>
            <p className="text-[11px] text-zinc-400">Cadastradas no sistema</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-500/20">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Acessos Admin Ativos
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{activeCompanies}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Liberados para operação
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200/60 dark:border-cyan-500/20">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Profissionais Totais
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {totalProfessionals}
            </p>
            <p className="text-[11px] text-zinc-400">Criados pelos Admins</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-500/20">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Agendamentos Gerados
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {totalAppointments}
            </p>
            <p className="text-[11px] text-zinc-400">Em todas as empresas</p>
          </div>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar empresa, responsável ou e-mail do Admin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/70 dark:border-zinc-800 self-start">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'active', label: 'Ativas' },
            { id: 'suspended', label: 'Suspensas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Empresas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 animate-pulse border border-zinc-200/60 dark:border-zinc-800"
            />
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          badge="Gestão SaaS"
          title="Nenhuma empresa encontrada"
          description="Cadastre uma nova empresa cliente para gerar o login e senha de acesso do Administrador (ADMIN)."
          actionLabel="Cadastrar Nova Empresa"
          onAction={openCreateDrawer}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCompanies.map((company) => {
            const planInfo = PLAN_LABELS[company.plan] || {
              label: company.plan,
              color: 'primary' as const,
            };

            return (
              <Card
                key={company.id}
                hoverEffect
                className="flex flex-col justify-between space-y-4"
              >
                {/* Topo do Card: Empresa + Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-500 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm shadow-violet-500/30">
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-zinc-50 truncate">
                        {company.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
                        <span>
                          {BUSINESS_TYPE_LABELS[company.businessType] || company.businessType}
                        </span>
                        <span>•</span>
                        <a
                          href={`/#/agendar/${company.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          /{company.slug}
                          <ExternalLink size={11} />
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={planInfo.color} size="sm">
                      {planInfo.label}
                    </Badge>
                    <Badge variant={company.isActive ? 'success' : 'danger'} size="sm">
                      {company.isActive ? 'Ativa' : 'Suspensa'}
                    </Badge>
                  </div>
                </div>

                {/* Bloco de Credenciais do ADMIN da Empresa */}
                <div className="p-3.5 rounded-2xl bg-violet-50/70 dark:bg-violet-950/25 border border-violet-200/70 dark:border-violet-800/40 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                      <KeyRound size={13} />
                      Acesso da Empresa (Perfil ADMIN)
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                      {company.admin?.fullName || 'Administrador'}
                    </span>
                  </div>

                  {company.admin ? (
                    <div className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl border border-violet-100 dark:border-violet-900/40">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-zinc-400">
                          E-mail de Login do Admin
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">
                          {company.admin.email}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(company.id, company.admin!.email)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors cursor-pointer"
                          title="Copiar e-mail de login"
                        >
                          {copiedId === company.id ? (
                            <Check size={15} className="text-emerald-500" />
                          ) : (
                            <Copy size={15} />
                          )}
                        </button>
                        <Button
                          size="xs"
                          variant="secondary"
                          leftIcon={<KeyRound size={12} />}
                          onClick={() => openEditDrawer(company)}
                        >
                          Alterar Login / Senha
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-xl border border-amber-200/70 dark:border-amber-800/40">
                      <span className="text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5">
                        <ShieldAlert size={14} />
                        Nenhum login ADMIN configurado para esta empresa
                      </span>
                      <Button size="xs" variant="primary" onClick={() => openEditDrawer(company)}>
                        Criar Login Admin
                      </Button>
                    </div>
                  )}
                </div>

                {/* Indicadores Operacionais da Empresa */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80">
                    <p className="text-xs font-black text-zinc-800 dark:text-zinc-100">
                      {company.metrics?.professionalsCount || 0}
                    </p>
                    <p className="text-[10px] text-zinc-500">Profissionais</p>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80">
                    <p className="text-xs font-black text-zinc-800 dark:text-zinc-100">
                      {company.metrics?.clientsCount || 0}
                    </p>
                    <p className="text-[10px] text-zinc-500">Clientes</p>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80">
                    <p className="text-xs font-black text-zinc-800 dark:text-zinc-100">
                      {company.metrics?.appointmentsCount || 0}
                    </p>
                    <p className="text-[10px] text-zinc-500">Agendamentos</p>
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="text-zinc-400 flex items-center gap-2 truncate">
                    {company.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {formatPhone(company.phone)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleCompanyStatus(company)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        company.isActive
                          ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                      }`}
                      title={
                        company.isActive
                          ? 'Suspender acesso da empresa'
                          : 'Reativar acesso da empresa'
                      }
                    >
                      <Power size={13} />
                      <span>{company.isActive ? 'Suspender' : 'Ativar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditDrawer(company)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Editar Empresa e Credenciais"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCompany(company)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Excluir Empresa"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Drawer de Criação / Edição de Empresa + Acesso ADMIN */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          editingCompany
            ? `Gerenciar ${editingCompany.name}`
            : 'Nova Empresa + Acesso Admin'
        }
        description="Configure os dados da empresa cliente e defina o login e senha do seu Administrador (ADMIN)."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setIsDrawerOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={<Check size={16} />}
            >
              {editingCompany ? 'Salvar Alterações' : 'Criar Empresa e Acesso'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seção 1: Dados do Estabelecimento */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Building2 size={14} className="text-violet-500" />
              1. Dados da Empresa Cliente
            </h4>

            <Input
              label="Nome da Empresa / Estabelecimento *"
              placeholder="Ex: Studio Glamour & Estética"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              leftIcon={<Building2 size={16} />}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Segmento de Atuação
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                >
                  <option value="BEAUTY_SALON">Salão de Beleza & Studio</option>
                  <option value="BARBERSHOP">Barbearia</option>
                  <option value="AESTHETIC_CLINIC">Clínica de Estética</option>
                  <option value="HEALTH_CLINIC">Clínica de Saúde</option>
                  <option value="OTHER">Outro Segmento</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Plano Liberado
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                >
                  <option value="PRO">Plano PRO (Completo)</option>
                  <option value="ENTERPRISE">Enterprise (Multi-equipe)</option>
                  <option value="ADVANCE">Advance</option>
                  <option value="STARTER">Starter</option>
                  <option value="FREE">Gratuito / Teste</option>
                </select>
              </div>
            </div>

            <Input
              label="WhatsApp / Telefone Comercial"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone size={16} />}
            />

            <Input
              label="Endereço Completo"
              placeholder="Rua, Número, Bairro, Cidade - UF"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Seção 2: Credenciais de Acesso do ADMIN */}
          <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/50 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                <KeyRound size={14} />
                2. Login e Senha da Empresa (Acesso ADMIN)
              </h4>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-bold text-violet-600 dark:text-violet-300 hover:underline cursor-pointer"
              >
                Gerar senha segura
              </button>
            </div>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Esta conta terá o papel <strong>ADMIN</strong>: acesso total às funcionalidades da
              empresa (Agenda, Financeiro, Clientes, Serviços, WhatsApp) e permissão para criar os
              logins e senhas dos seus <strong>Profissionais</strong>.
            </p>

            <Input
              label="Nome do Gestor / Administrador *"
              placeholder="Ex: Fernanda Oliveira"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              leftIcon={<Users size={16} />}
              required
            />

            <Input
              label="E-mail de Login do Admin *"
              type="email"
              placeholder="admin@nomedaempresa.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
              required
            />

            <Input
              label={
                editingCompany
                  ? 'Nova Senha do Admin (deixe em branco para manter a atual)'
                  : 'Senha de Acesso do Admin *'
              }
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo de 6 caracteres"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required={!editingCompany}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer p-0.5"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
}
