import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, ArrowRight, Shield, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useUIStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      addToast({
        type: 'error',
        title: 'Preencha os campos',
        message: 'Informe seu e-mail e senha para continuar.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email.trim(), password);
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
          message: res.message || 'E-mail ou senha incorretos.',
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      addToast({
        type: 'error',
        title: 'Erro de Conexão',
        message: err?.message || 'Não foi possível validar as credenciais com o servidor.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Acesse sua conta
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Entre com seu e-mail e senha cadastrados no sistema.
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
            type={showPassword ? 'text' : 'password'}
            placeholder="Sua senha secreta"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer p-0.5"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
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

      <div className="p-3.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 text-center flex items-center justify-center gap-2">
        <Shield size={14} className="text-violet-600 dark:text-violet-400 shrink-0" />
        <span className="text-[11px] font-semibold text-violet-900 dark:text-violet-300">
          Acesso seguro protegido por criptografia de ponta a ponta e Supabase Auth.
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
