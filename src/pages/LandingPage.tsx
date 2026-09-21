import React, { useEffect } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { About } from '../components/landing/About';
import { Features } from '../components/landing/Features';
import { InteractivePreview } from '../components/landing/InteractivePreview';
import { Benefits } from '../components/landing/Benefits';
import { Pricing } from '../components/landing/Pricing';
import { HowItWorks } from '../components/landing/HowItWorks';
import { FAQ } from '../components/landing/FAQ';
import { CTASection } from '../components/landing/CTASection';
import { ContactSection } from '../components/landing/ContactSection';
import { Footer } from '../components/landing/Footer';

export default function LandingPage() {
  useEffect(() => {
    // Definir título SEO dinâmico da página
    document.title = 'Agenda AI — Sistema Inteligente de Agendamento e Gestão';
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9ff] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-violet-500 selection:text-white antialiased transition-colors duration-200 overflow-x-hidden">
      {/* Header Institucional com Navegação */}
      <Navbar />

      {/* Conteúdo Principal */}
      <main>
        {/* Seção Hero com Mockup do Sistema */}
        <Hero />

        {/* Sobre a Plataforma */}
        <About />

        {/* Funcionalidades Reais */}
        <Features />

        {/* Preview Interativo (Agenda, WhatsApp, KPIs) */}
        <InteractivePreview />

        {/* Benefícios e Métricas de Negócio */}
        <Benefits />

        {/* Como Funciona em 4 Passos */}
        <HowItWorks />

        {/* Tabela de Planos e Preços */}
        <Pricing />

        {/* Perguntas Frequentes */}
        <FAQ />

        {/* Chamada para Ação (CTA) */}
        <CTASection />

        {/* Área de Contato e Dúvidas */}
        <ContactSection />
      </main>

      {/* Rodapé Profissional */}
      <Footer />
    </div>
  );
}
