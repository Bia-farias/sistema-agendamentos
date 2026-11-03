import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#faf9ff] dark:bg-[#0d0b14]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-zinc-500">Carregando Agenda AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (profile?.role || 'receptionist').toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    const hasAccess = normalizedAllowed.includes(userRole);

    if (!hasAccess) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-sm border border-rose-200/60 dark:border-rose-900/40">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Acesso Restrito
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md">
            Seu perfil atual (<span className="font-semibold text-zinc-700 dark:text-zinc-200">{userRole}</span>) não possui permissão para acessar esta área restrita a administradores.
          </p>
          <button
            onClick={() => navigate('/agenda')}
            className="mt-6 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-violet-600/30 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            Voltar para a Agenda
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
}
