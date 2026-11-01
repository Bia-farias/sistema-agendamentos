import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { User, Mail, Lock, Building, Phone, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';

import { authApiService, translateAuthError } from '../../services/api/authService';

export default function Register() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('beauty_salon');
  const [businessPhone, setBusinessPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      addToast({
        type: 'error',
        title: 'Preencha os dados',
        message: 'Todos os campos são obrigatórios.',
      });
      return;
    }
    if (password.length < 6) {
      addToast({
        type: 'error',
        title: 'Senha muito curta',
        message: 'A senha deve possuir pelo menos 6 caracteres.',
      });
      return;
    }
    setStep(2);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !businessPhone) {
      addToast({
        type: 'error',
        title: 'Preencha os dados da empresa',
        message: 'Informe o nome e o WhatsApp do estabelecimento.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { user, profile, tenant } = await authApiService.signUpWithTenant({
        email,
        password,
        fullName,
        businessName,
        businessType,
        businessPhone,
      });

      useAuthStore.setState({
        user: { id: user.id, email: user.email },
        profile,
        tenant,
        loading: false,
      });

      addToast({
        type: 'success',
        title: 'Conta Criada com Sucesso!',
        message: `Bem-vindo ao Agenda AI! O estabelecimento ${businessName} foi cadastrado.`,
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      addToast({
        type: 'error',
        title: 'Erro ao Criar Conta',
        message: translateAuthError(err?.message || 'Falha ao cadastrar estabelecimento.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 1
                ? 'bg-violet-600 text-white'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {step === 1 ? '1' : <Check size={12} />}
          </span>
          <span className="text-xs text-zinc-400 font-semibold">
            Passo {step} de 2 — {step === 1 ? 'Dados Pessoais' : 'Seu Negócio'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          {step === 1 ? 'Crie sua conta' : 'Configure seu estabelecimento'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {step === 1
            ? 'Comece agora gratuitamente e automatize sua agenda com IA.'
            : 'Personalize o perfil do seu salão, barbearia ou clínica.'}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNextStep} className="space-y-4">
          <Input
            label="Seu Nome Completo"
            placeholder="Ex: Camila Albuquerque"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User size={16} />}
            required
          />

          <Input
            label="E-mail Corporativo"
            type="email"
            placeholder="seu.email@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={16} />}
            required
          />

          <Input
            label="Crie uma Senha Forte"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
            required
          />

          <Button
            type="submit"
            className="w-full shadow-lg shadow-violet-400/20"
            rightIcon={<ArrowRight size={16} />}
          >
            Avançar para Dados do Negócio
          </Button>
        </form>
      ) : (
        <form onSubmit={handleFinish} className="space-y-4">
          <Input
            label="Nome do Estabelecimento"
            placeholder="Ex: Barbearia Imperial, Studio Glamour"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            leftIcon={<Building size={16} />}
            required
          />

          <Select
            label="Segmento de Atuação"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            options={[
              { value: 'beauty_salon', label: 'Salão de Beleza / Cabelo' },
              { value: 'barbershop', label: 'Barbearia' },
              { value: 'aesthetic_clinic', label: 'Clínica de Estética / Spa' },
              { value: 'health_clinic', label: 'Clínica de Saúde / Consultório' },
              { value: 'other', label: 'Outro Profissional Autônomo' },
            ]}
          />

          <Input
            label="WhatsApp da Empresa"
            placeholder="(11) 99999-9999"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            leftIcon={<Phone size={16} />}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              leftIcon={<ArrowLeft size={16} />}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1 shadow-lg shadow-violet-400/20"
              isLoading={isLoading}
              rightIcon={<Sparkles size={16} />}
            >
              Finalizar e Abrir Sistema
            </Button>
          </div>
        </form>
      )}

      <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Já possui uma conta?{' '}
        <Link
          to="/login"
          className="font-bold text-violet-600 dark:text-violet-400 hover:underline"
        >
          Fazer login
        </Link>
      </div>
    </div>
  );
}
