import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { UserRole } from '../../types';

export default function Login() {
  const navigate = useNavigate();
  const { login, quickLogin } = useAuthStore();
  const { addToast } = useUIStore();

  const [email, setEmail] = useState('admin@agendaai.com');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({
        type: 'error',
        title: 'Preencha os campos',
        message: 'Informe seu e-mail e senha para continuar.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      setIsLoading(false);

      if (res.success) {
        addToast({
          type: 'success',
          title: 'Bem-vindo de volta!',
          message: 'Acesso realizado com sucesso.',
        });
        navigate('/dashboard');
      } else {
        addToast({
          type: 'error',
          title: 'Falha no Acesso',
          message: res.message || 'Credenciais inválidas.',
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      addToast({
        type: 'error',
        title: 'Erro de Conexão',
        message: err?.message || 'Não foi possível validar as credenciais.',
      });
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    quickLogin(role);
    addToast({
      type: 'success',
      title: 'Acesso Demo Ativado!',
      message: `Conectado com perfil ${role.toUpperCase()}.`,
    });
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Acesse sua conta
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Entre com seu e-mail e senha ou use o acesso rápido demonstrativo abaixo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu.email@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
          required
        />

        <div className="space-y-1">
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
            required
          />
          <div className="flex justify-end pt-1">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full shadow-lg shadow-violet-500/25"
          isLoading={isLoading}
          rightIcon={<ArrowRight size={16} />}
        >
          Entrar na Plataforma
        </Button>
      </form>

      {/* Acesso Rápido com 1 Clique */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={14} className="text-violet-500" />
          Acesso Rápido com 1 Clique (Demonstração)
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('owner')}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/40 transition-all text-left group"
          >
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 block">
              👑 Proprietária
            </span>
            <span className="text-[10px] text-zinc-400">Acesso Total</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('professional')}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/40 transition-all text-left group"
          >
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 block">
              ✂️ Profissional
            </span>
            <span className="text-[10px] text-zinc-400">Minha Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('receptionist')}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/40 transition-all text-left group"
          >
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 block">
              📋 Recepção
            </span>
            <span className="text-[10px] text-zinc-400">Atendimentos</span>
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 text-center flex items-center justify-center gap-2">
        <Shield size={14} className="text-violet-600 dark:text-violet-400 shrink-0" />
        <span className="text-[11px] font-semibold text-violet-900 dark:text-violet-300">
          Acesso seguro protegido por criptografia e Supabase Auth.
        </span>
      </div>

      <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Não possui uma conta?{' '}
        <Link
          to="/register"
          className="font-bold text-violet-600 dark:text-violet-400 hover:underline"
        >
          Cadastre seu estabelecimento
        </Link>
      </div>
    </div>
  );
}
