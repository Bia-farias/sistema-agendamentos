import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { authApiService, translateAuthError } from '../../services/api/authService';

export default function ForgotPassword() {
  const { addToast } = useUIStore();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await authApiService.resetPassword(email);
      setIsSent(true);
      addToast({
        type: 'success',
        title: 'Instruções enviadas!',
        message: 'Verifique sua caixa de entrada para redefinir a senha.',
      });
    } catch (err: any) {
      console.error('Erro na recuperação de senha:', err);
      addToast({
        type: 'error',
        title: 'Falha no Envio',
        message: translateAuthError(err?.message || 'Não foi possível enviar o e-mail de recuperação.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Recuperar Senha
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Informe seu e-mail cadastrado e enviaremos um link de acesso seguro.
        </p>
      </div>

      {isSent ? (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            E-mail enviado com sucesso!
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Enviamos um link de recuperação para <strong>{email}</strong>. Siga as instruções no e-mail para cadastrar uma nova senha.
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Voltar para o Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Seu E-mail Cadastrado"
            type="email"
            placeholder="seu.email@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={16} />}
            required
          />

          <Button
            type="submit"
            className="w-full shadow-lg shadow-violet-400/20"
            isLoading={isLoading}
          >
            Enviar Link de Recuperação
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Voltar ao Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
