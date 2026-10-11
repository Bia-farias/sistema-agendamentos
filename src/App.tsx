import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Lazy Loaded Pages
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Agenda = React.lazy(() => import('./pages/Agenda'));
const Clientes = React.lazy(() => import('./pages/Clientes'));
const Servicos = React.lazy(() => import('./pages/Servicos'));
const Profissionais = React.lazy(() => import('./pages/Profissionais'));
const Financeiro = React.lazy(() => import('./pages/Financeiro'));
const WhatsApp = React.lazy(() => import('./pages/WhatsApp'));
const Configuracoes = React.lazy(() => import('./pages/Configuracoes'));
const AgendamentoCliente = React.lazy(() => import('./pages/AgendamentoCliente'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <HashRouter>
      <React.Suspense
        fallback={
          <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-[#09090b]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-zinc-400">Carregando Agenda AI...</p>
            </div>
          </div>
        }
      >
        <Routes>
          {/* Website Institucional e Comercial */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/site" element={<LandingPage />} />

          {/* Página Pública de Agendamento Online para Clientes */}
          <Route path="/agendar" element={<AgendamentoCliente />} />
          <Route path="/agendar/:slug" element={<AgendamentoCliente />} />

          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Authenticated Application Routes with Drawers and Sidebar */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/profissionais" element={<Profissionais />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </HashRouter>
  );
}
