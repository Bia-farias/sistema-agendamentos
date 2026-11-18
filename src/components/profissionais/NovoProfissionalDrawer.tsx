import React, { useState, useEffect } from 'react';
import { useProfessionalStore } from '../../stores/professionalStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TimeSelect } from '../ui/TimeSelect';
import { Check, User, Phone, Mail, Percent, Sparkles, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

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
  const [accessPassword, setAccessPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [commission, setCommission] = useState('40');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('19:00');
  const [breakStart, setBreakStart] = useState('12:00');
  const [breakEnd, setBreakEnd] = useState('13:00');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [portfolioText, setPortfolioText] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProf) {
      setName(editingProf.name);
      setRole(editingProf.role);
      setPhone(editingProf.phone || '');
      setEmail(editingProf.email || '');
      setAccessPassword('');
      setShowPassword(false);
      setCommission(String(editingProf.commission_percentage));
      setSpecialtiesText(editingProf.specialties.join(', '));
      setStartTime(editingProf.working_hours?.start || '09:00');
      setEndTime(editingProf.working_hours?.end || '19:00');
      setBreakStart(editingProf.break_start || '12:00');
      setBreakEnd(editingProf.break_end || '13:00');
      setAvatarUrl(editingProf.avatar_url || '');
      setBio(editingProf.bio || '');
      setPortfolioText((editingProf.portfolio_urls || []).join('\n'));
      setColor(editingProf.color || '#8b5cf6');
    } else {
      setName('');
      setRole('');
      setPhone('');
      setEmail('');
      setAccessPassword('');
      setShowPassword(false);
      setCommission('40');
      setSpecialtiesText('');
      setStartTime('09:00');
      setEndTime('19:00');
      setBreakStart('12:00');
      setBreakEnd('13:00');
      setAvatarUrl('');
      setBio('');
      setPortfolioText('');
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

    if (accessPassword.trim()) {
      if (accessPassword.trim().length < 6) {
        addToast({
          type: 'error',
          title: 'Senha muito curta',
          message: 'A senha de acesso do profissional deve ter no mínimo 6 caracteres.',
        });
        return;
      }
      if (!email.trim()) {
        addToast({
          type: 'error',
          title: 'E-mail Obrigatório para Login',
          message: 'Informe o e-mail de login do profissional para definir a senha de acesso.',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const specialties = specialtiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const portfolioUrls = portfolioText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const hasPassword = accessPassword.trim().length >= 6;

      if (isEdit && editingProf) {
        await updateProfessional(editingProf.id, {
          name: name.trim(),
          role: role.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          ...(hasPassword ? { access_password: accessPassword.trim(), has_system_access: true } : {}),
          avatar_url: avatarUrl.trim() || undefined,
          bio: bio.trim() || undefined,
          portfolio_urls: portfolioUrls,
          commission_percentage: parseFloat(commission) || 0,
          specialties: specialties.length > 0 ? specialties : [role.trim()],
          color,
          working_hours: {
            start: startTime,
            end: endTime,
            days_of_week: [1, 2, 3, 4, 5, 6],
          },
          break_start: breakStart || undefined,
          break_end: breakEnd || undefined,
        });

        addToast({
          type: 'success',
          title: hasPassword ? 'Profissional e Senha Atualizados!' : 'Profissional Atualizado',
          message: hasPassword
            ? `O login (${email.trim()}) e a senha de acesso de ${name} foram configurados.`
            : `Os dados de ${name} foram atualizados.`,
        });
      } else {
        await addProfessional({
          tenant_id: tenant?.id || 'tenant-1001',
          name: name.trim(),
          role: role.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          ...(hasPassword ? { access_password: accessPassword.trim(), has_system_access: true } : {}),
          avatar_url: avatarUrl.trim() || undefined,
          bio: bio.trim() || undefined,
          portfolio_urls: portfolioUrls,
          commission_percentage: parseFloat(commission) || 0,
          specialties: specialties.length > 0 ? specialties : [role.trim()],
          color,
          is_active: true,
          working_hours: {
            start: startTime,
            end: endTime,
            days_of_week: [1, 2, 3, 4, 5, 6],
          },
          break_start: breakStart || undefined,
          break_end: breakEnd || undefined,
        });

        addToast({
          type: 'success',
          title: 'Profissional Cadastrado!',
          message: hasPassword
            ? `${name} foi adicionado com login e senha de acesso Profissional ativos!`
            : `${name} foi adicionado à equipe.`,
        });
      }

      closeDrawer();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: err?.message || 'Ocorreu um erro ao salvar o profissional.',
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

        {/* Bloco de Criação / Redefinição de Login e Senha do Profissional */}
        <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/70 dark:border-cyan-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={14} />
              Credenciais de Acesso (Perfil Profissional)
            </span>
            <button
              type="button"
              onClick={() => {
                const randomDigits = Math.floor(1000 + Math.random() * 9000);
                setAccessPassword(`Prof@${randomDigits}`);
                setShowPassword(true);
              }}
              className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 hover:underline cursor-pointer"
            >
              Gerar senha rápida
            </button>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {isEdit
              ? 'Altere o e-mail de login ou informe uma nova senha abaixo para criar ou redefinir o acesso deste profissional ao sistema.'
              : 'Defina o e-mail e a senha abaixo para que o profissional possa entrar no sistema com o acesso Profissional.'}
          </p>

          <Input
            label="E-mail de Login do Profissional"
            type="email"
            placeholder="profissional@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={16} />}
          />

          <Input
            label={isEdit ? 'Nova Senha de Acesso (deixe vazio para manter a atual)' : 'Senha de Acesso do Profissional'}
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo de 6 caracteres"
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
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
            <TimeSelect value={startTime} onChange={setStartTime} step={30} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Horário de Fim
            </label>
            <TimeSelect value={endTime} onChange={setEndTime} step={30} />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 space-y-3">
          <span className="text-xs font-extrabold text-violet-700 dark:text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} />
            Perfil Público no Mini-Site
          </span>

          <Input
            label="URL da Foto de Perfil"
            placeholder="https://exemplo.com/minha-foto.jpg"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Biografia / Apresentação
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Especialista em colorimetria e corte visagista com mais de 8 anos de experiência..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 text-xs p-3 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                Início Almoço
              </label>
              <TimeSelect value={breakStart} onChange={setBreakStart} step={15} size="sm" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                Fim Almoço
              </label>
              <TimeSelect value={breakEnd} onChange={setBreakEnd} step={15} size="sm" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
              Galeria de Trabalhos (uma URL por linha)
            </label>
            <textarea
              rows={2}
              placeholder="https://exemplo.com/trabalho1.jpg&#10;https://exemplo.com/trabalho2.jpg"
              value={portfolioText}
              onChange={(e) => setPortfolioText(e.target.value)}
              className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 text-xs p-3 focus:outline-none focus:ring-2 focus:ring-violet-400 font-mono"
            />
          </div>
        </div>
      </form>
    </Drawer>
  );
}
