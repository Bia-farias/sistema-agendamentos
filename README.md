<div align="center">

# ⚡ Agenda AI — Plataforma SaaS Full-Stack de Agendamentos & Gestão com IA

**Solução completa Multi-Tenant com mini-sites exclusivos por assinante, ERP financeiro, motor anti-colisão de horários, automações WhatsApp e assistente inteligente (Llama 3.3) em conformidade com a LGPD.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-133%20Passed-emerald?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Security](https://img.shields.io/badge/Security-LGPD%20%26%20RBAC-blueviolet?style=for-the-badge&logo=shield&logoColor=white)](https://github.com/)

<br />

[Acesso à Demonstração](#-acesso-à-demonstração--credenciais) •
[Funcionalidades](#-principais-funcionalidades) •
[Testes Automatizados](#-testes-automatizados--qualidade-qa) •
[Arquitetura](#-arquitetura-do-projeto) •
[Instalação](#-como-executar-o-projeto) •
[Stack Tecnológica](#️-stack-tecnológica)

</div>

---

## 📌 Visão Geral do Produto

O **Agenda AI** é uma plataforma SaaS Full-Stack desenvolvida para salões de beleza, barbearias, clínicas de estética e profissionais autônomos.

O grande diferencial da plataforma é que **cada empresa assinante possui automaticamente o seu próprio mini-site exclusivo de agendamento online** (ex: `agendaai.com.br/espaco-belle`), personalizado com suas fotos de capa, galeria do espaço, catálogo de serviços, perfil individual de profissionais com portfólio de trabalhos, QR Code para balcão e botão de compartilhamento via WhatsApp.

Nos bastidores, o sistema conta com uma **arquitetura Multi-Tenant isolada**, **motor anti-colisão de horários**, **módulo ERP financeiro completo (DRE, contas a pagar/receber, estoque e comissões)**, **controle de acesso baseado em papéis (RBAC com 5 níveis)** e **IA com mascaramento de dados sensíveis em conformidade com a LGPD**.

---

## ✨ Principais Funcionalidades

### 🌐 1. Minha Página & Mini-Sites Exclusivos por Assinante
- **Página Pública Dedicada (`/agendar/:slug`):** Mini-site responsivo exclusivo para cada estabelecimento divulgar para seus clientes.
- **Painel de Personalização (`/minha-pagina`):** Área no painel administrativo onde o proprietário customiza foto de capa, logotipo, carrossel de fotos do ambiente, cores da marca, bio, endereço e redes sociais.
- **Divulgação & Balcão:** Geração automática de **QR Code** de alta definição para balcões e banners físicos, além de cópia de link e compartilhamento direto no WhatsApp com 1 clique.
- **Agendamento em 5 Etapas Sem Necessidade de Cadastro:** Experiência fluida para o cliente final: *Profissional ➔ Serviço ➔ Data ➔ Horário Livre ➔ Confirmação*.

### 📅 2. Motor de Agendamentos & Anti-Colisão Matemática
- **Prevenção de Duplicidade:** Algoritmo que impede qualquer sobreposição de horários para o mesmo profissional.
- **Bloqueio de Intervalo de Almoço:** Pausas programadas dos profissionais (`breakStart` e `breakEnd`) são automaticamente bloqueadas na grade pública de agendamento.
- **Visão Flexível:** Alternância instantânea entre modo **Semanal** e **Diário**.
- **Gavetas Laterais (Drawers):** Criação e edição ergonômica sem modais intrusivos.

### 💰 3. ERP Financeiro & Operacional
- **Contas a Receber & a Pagar:** Lançamentos com categorias contábeis (aluguel, salários, comissões, energia, fornecedores, etc.) e status de pagamento.
- **Comissões Automáticas:** Divisão percentual de faturamento por profissional calculada automaticamente após cada atendimento.
- **Gestão de Estoque & Mercadorias:** Controle de produtos com preço de custo, preço de venda, estoque mínimo e histórico de movimentações.
- **Política de Sinal (Depósito Prévio):** Configuração de adiantamento Pix para confirmação de agendamentos e redução de no-shows.

### 👥 4. Perfis Individuais & Portfólio dos Profissionais
- **Perfil Completo no Mini-Site:** Apresentação bio, especialidades, horários de trabalho e galeria de fotos de trabalhos realizados.
- **Gestão de Folgas:** Definição de dias de indisponibilidade e expediente semanal personalizado por profissional.

### 📊 5. Dashboard de Performance & KPIs
- **Métricas em Tempo Real:** Faturamento diário, total de agendamentos, atendimentos pendentes e taxa de ocupação da equipe.
- **Gráfico Semanal de Receita:** Acompanhamento visual da evolução diária do faturamento e volume de atendimentos.
- **Radar de Clientes VIP:** Destaque automático dos clientes com maior LTV (Lifetime Value).

### 💬 6. WhatsApp Hub & Automações
- **Simulador de Conexão com QR Code:** Pareamento de instância e logs de envio.
- **Editor de Modelos Dinâmicos:** Templates com tags automáticas (`{cliente_nome}`, `{data}`, `{horario}`, `{servico}`, `{profissional}`).
- **Preview Fiel do WhatsApp:** Visualização de balão com carimbos de entrega e leitura idênticos ao aplicativo.
- **Campanha de Reativação em Lote:** Resgate de clientes inativos há mais de 30 dias com um clique.

### 🤖 7. Inteligência Artificial com Proteção LGPD
- **Assistente Operacional (Llama 3.3 via Groq):** Resumo do dia, análises financeiras e sugestões inteligentes de promoções.
- **Higienização LGPD:** Algoritmo de mascaramento automático de dados pessoais sensíveis (telefones e CPFs) antes do envio para modelos de linguagem.

---

## 🔑 Acesso à Demonstração & Credenciais

O banco de dados já está configurado com dados de exemplo prontos para teste imediato:

| Perfil | E-mail de Teste | Senha Padrão | Permissões |
| :--- | :--- | :--- | :--- |
| **Proprietário (Owner)** | `admin@agendaai.com` | `123456` | Acesso irrestrito a todos os módulos, financeiro e página pública |
| **Administrador** | `admin@studio.com` | `123456` | Gestão de agenda, clientes, serviços e equipe |
| **Profissional** | `camila@studio.com` | `123456` | Visualização da própria agenda e atendimentos |
| **Recepcionista** | `recepcao@studio.com` | `123456` | Agendamentos, confirmações e cadastro de clientes |

> 🔗 **Página Pública Demo do Assinante:**  
> Acesse: `http://localhost:5173/#/agendar/espaco-belle` para experimentar o fluxo de agendamento online do cliente final.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Destaque |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript 5.5, Vite 5.4 | Arquitetura SPA componentizada com tipagem estrita |
| **Estilização** | Tailwind CSS 3.4, Lucide React | Design tokens personalizados, Dark Mode e responsividade total |
| **Gerenciamento de Estado** | Zustand 4.5 | Stores atômicas modulares e reativas |
| **Backend & API** | Node.js 20, Express 4.21, TypeScript | API RESTful modular, tratamento centralizado de erros e logging |
| **ORM & Banco de Dados** | Prisma ORM 5.22, PostgreSQL (Supabase) | Modelagem relacional multi-tenant com migrations e RLS |
| **Validação de Dados** | Zod 3.23 | Schemas com tipagem inferida e sanitização rigorosa |
| **Autenticação & Segurança** | JWT, BcryptJS, RBAC, Mascaramento LGPD | Hash salgado, permissões em 5 níveis e proteção de PII |
| **Qualidade & Testes** | Vitest 4.1, TSX | **133 testes automatizados** (Frontend unitário + Backend integração) |
| **Inteligência Artificial** | Groq SDK (Llama 3.3 70B) | Dual Engine (IA remota ou fallback de simulação local) |

---

## 🧪 Testes Automatizados & Qualidade (QA)

O projeto conta com **133 testes automatizados**, assegurando confiabilidade técnica de ponta a ponta:

### 1. Testes do Frontend (29 testes unitários com Vitest)
- `publicBookingSlots.test.ts` (5 testes): Cálculo de slots livres, bloqueio de horário de almoço e validação de slug multi-tenant.
- `appointmentCollision.test.ts` (9 testes): Colisão matemática de horários, sobreposição parcial, total e limites adjacentes.
- `rbacAndLgpd.test.ts` (5 testes): Controle de acesso por cargo e mascaramento de telefones/CPFs para a IA.
- `depositPolicy.test.ts` (4 testes): Cálculo de retenção de sinal e tolerâncias.
- `financialCommission.test.ts` (3 testes): Cálculo de comissões e repasses líquidos de profissionais.
- `whatsappFormatting.test.ts` (3 testes): Formatação e sanitização de links para mensagens.

### 2. Testes do Backend (104 testes de integração TypeScript)
- **Fase 1 (22 testes):** Health check, validação Zod de registros, autenticação JWT e segurança de rotas.
- **Fase 2 (21 testes):** CRUDs e RBAC de Clientes, Serviços e Profissionais.
- **Fase 4 (24 testes):** Agendamentos, motor anti-colisão em banco de dados e rotas públicas de agendamento.
- **Fase 5 (16 testes):** ERP Financeiro, Contas a Pagar/Receber, Fornecedores e Estoque.
- **Fase 6 (12 testes):** Chat de IA com pipeline de anonimização e conformidade com a LGPD.
- **Fase 7 (9 testes):** Mensageria WhatsApp, templates e logs de disparo.

---

## 💻 Como Executar o Projeto

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **npm** ou **yarn**

### 1. Clonar o repositório
```bash
git clone https://github.com/Bia-farias/sistema-agendamentos.git
cd sistema-agendamentos
```

### 2. Instalar dependências
```bash
# Frontend
npm install

# Backend
npm --prefix backend install
```

### 3. Iniciar os servidores de desenvolvimento
```bash
# Terminal 1 — Frontend:
npm run dev

# Terminal 2 — Backend:
npm --prefix backend run dev
```

Abra o navegador em: `http://localhost:5173`.

### 4. Rodar a suíte de testes
```bash
# Testes do Frontend (29 testes):
npm test -- --run

# Testes do Backend (104 testes):
npm --prefix backend run test:all
```

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais informações.

<div align="center">
Desenvolvido por <strong>Beatriz Farias</strong> — Engenharia de Software, Arquitetura Limpa e Soluções SaaS.
</div>
