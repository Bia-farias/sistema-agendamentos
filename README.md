# ⚡ Agenda AI — Plataforma SaaS de Agendamentos & Gestão com IA
Plataforma completa de agendamento online, gestão operacional e ERP financeiro para salões de beleza, barbearias e clínicas de estética, desenvolvida com React 18, Node.js/Express, TypeScript, Prisma ORM e PostgreSQL (Supabase).

React 18 Node.js TypeScript Prisma PostgreSQL Tailwind CSS Vitest Groq

---

## 📑 Índice
- [Documentação para IA](#-documentação-para-ia)
- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#️-tecnologias)
- [Módulos do Sistema](#-módulos-do-sistema)
- [Estrutura do Projeto](#️-estrutura-do-projeto)
- [Configuração e Instalação](#️-configuração-e-instalação)
- [Execução Local](#️-execução-local)
- [Deploy](#-deploy)
- [Scripts Úteis](#-scripts-úteis)
- [Controle de Acesso (RBAC)](#-controle-de-acesso-rbac)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🤖 Documentação para IA
Este projeto adota boas práticas de governança de contexto para manter sincronia arquitetural entre modelos e turnos de desenvolvimento.

Antes de iniciar qualquer tarefa ou modificação profunda, consulte:
- `docs/CONTEXTO-IA.md` — modelo mental permanente da arquitetura multi-tenant e segurança
- `docs/ESTADO-PROJETO.md` — status atual dos módulos, cobertura de testes e build de produção
- `docs/ROADMAP.md` — próximos passos, melhorias de features e otimizações contínuas

Estes registros servem de fonte de verdade para estabilidade do código, isolamento multi-tenant por RLS, anti-colisão matemática de horários e regras de conformidade LGPD.

---

## 📖 Sobre o Projeto
O **Agenda AI** é uma plataforma SaaS Full-Stack multi-tenant desenvolvida para resolver as dores operacionais e financeiras do segmento de estética, beleza e bem-estar.

Cada estabelecimento cadastrado ganha automaticamente um **mini-site exclusivo de agendamento online** (`/#/agendar/:slug`), com catálogo de serviços, fotos do ambiente, horários dos profissionais e portfólio individual. Internamente, o sistema unifica **gestão de clientes (CRM)**, **motor de agenda anti-colisão**, **WhatsApp Hub** para lembretes automáticos e um **ERP Financeiro integrado (Fluxo de Caixa, DRE, Comissões e Estoque)**, potencializado por um **Assistente de IA inteligente (Llama 3.3 via Groq)** com proteção e anonimização de dados pessoais sensíveis.

- **Repositório:** `https://github.com/Bia-farias/sistema-agendamentos.git`
- **Frontend em Produção:** Vercel (`https://sistema-de-agendamentos-tau.vercel.app`)
- **Backend em Produção:** Railway (`https://sistema-agendamentos-production.up.railway.app/api`)
- **Banco de Dados Cloud:** PostgreSQL no Supabase com Row Level Security (RLS)

---

## ✨ Funcionalidades

| Área | Descrição |
| :--- | :--- |
| 📅 **Agenda Anti-Colisão** | Motor com validação matemática de intervalos, bloqueio de almoço e visualização em grade semanal e diária |
| 🌐 **Minha Página (Mini-Site)** | Página pública dedicada (`/agendar/:slug`) com gerador de QR Code para balcão, banner, galeria e link WhatsApp |
| 👥 **Clientes & CRM** | Histórico de atendimentos, total investido (LTV), radar de clientes VIP e identificação de inativos |
| ✂️ **Catálogo de Serviços** | Gestão de preços, categorias, tempo de execução e cores de identificação visual na grade |
| 👨‍💼 **Profissionais & Equipe** | Escalas de trabalho semanais, horários de almoço, especialidades, galeria de fotos e comissões |
| 💰 **Financeiro & Fluxo de Caixa** | Visão Geral unificada, Contas a Pagar, Contas a Receber, DRE, saldo de abertura e extrato com exportação CSV |
| 💵 **Comissões Automáticas** | Cálculo percentual automático por profissional pós-atendimento com registro de baixa |
| 📦 **Fornecedores & Estoque** | Cadastro de parceiros comerciais, estoque de produtos/mercadorias, alertas de estoque mínimo e movimentações |
| 🔒 **Política de Sinal (Pix)** | Configuração de adiantamento financeiro percentual/fixo para reduzir faltas (no-shows) |
| 💬 **WhatsApp Hub** | Modelos dinâmicos (`{cliente_nome}`, `{data}`, `{horario}`), simulador visual fiel e reativação em lote |
| 🤖 **Assistente IA (Llama 3.3)** | Análise em linguagem natural de faturamento, fluxo de caixa, agenda e sugestões de reativação |
| 🛡️ **Proteção LGPD** | Pipeline automático de higienização de telefones e CPFs antes de qualquer processamento por IA |
| 📱 **Mobile First & Viewport** | Layout adaptável com `useVisualViewport` e suporte a teclado virtual sem deslocamentos em iOS/Android |
| 🏢 **Multi-Tenant Seguro** | Separação lógica por `tenantId` e proteção de dados a nível de banco de dados com Supabase RLS |

---

## 🏛️ Arquitetura
O Agenda AI adota arquitetura desacoplada Full-Stack com frontend SPA de alta performance e backend API RESTful:

```text
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                        │
│          React 18 + TypeScript + Zustand + Tailwind CSS         │
│          (Painel Administrativo + Mini-Site Público SPA)         │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP / REST (apiClient + Axios)
┌───────────────────────────────▼─────────────────────────────────┐
│                       BACKEND (API REST)                        │
│                   Node.js 20 + Express + Zod                    │
│   ┌──────────────┐   ┌──────────────┐   ┌───────────────────┐   │
│   │ Middlewares  │   │  Validators  │   │  LGPD Sanitizer   │   │
│   │ (JWT / Auth) │   │ (Zod Schemas)│   │ (Anti-leak PII)   │   │
│   └──────────────┘   └──────────────┘   └───────────────────┘   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   Controladores e Serviços              │   │
│   │ auth │ appointments │ clients │ services │ financial    │   │
│   │ professionals │ tenants │ whatsapp │ ai (Groq SDK)      │   │
│   └─────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                       Prisma ORM                        │   │
│   └─────────────────────────────────────────────────────────┘   │
└───────────────┬─────────────────────────────────┬───────────────┘
                │                                 │
┌───────────────▼───────────────┐ ┌───────────────▼───────────────┐
│     PostgreSQL (Supabase)     │ │        Groq Cloud API         │
│  (Multi-Tenant + RLS Policies)│ │     (Llama 3.3 70B Engine)    │
└───────────────────────────────┘ └───────────────────────────────┘
```

**Padrões adotados:**
- **Multi-Tenant Isolado:** todas as entidades vinculadas a um `tenantId` com Row Level Security (RLS) habilitado.
- **RBAC Seguro:** autorização em 5 níveis hierárquicos com guards no frontend e middlewares de validação no backend.
- **Clean State Management:** stores atômicas com Zustand para atualização reativa instantânea sem renderizações desnecessárias.
- **Dual Engine IA:** integração remota com Groq API e fallback contextual local inteligente com dados reais.

---

## 🛠️ Tecnologias

### Frontend
| Categoria | Tecnologia |
| :--- | :--- |
| Framework | React 18.3 |
| Linguagem | TypeScript 5.5 (strict mode) |
| Bundler & Dev Server | Vite 5.4 |
| Roteamento | React Router Dom v6 |
| Gerenciamento de Estado | Zustand 4.5 |
| Estilização | Tailwind CSS 3.4 + Tailwind Merge + Clsx |
| Ícones | Lucide React |
| Testes Unitários | Vitest 4.1 |

### Backend & Banco de Dados
| Categoria | Tecnologia |
| :--- | :--- |
| Runtime | Node.js 20.x |
| Framework Web | Express 4.21 |
| Linguagem | TypeScript 5.5 |
| ORM | Prisma 5.22 |
| Banco de Dados | PostgreSQL 15+ (Supabase) |
| Autenticação | JWT (`jsonwebtoken`) + BcryptJS |
| Validação de Schemas | Zod 3.23 |
| Motor de IA | Groq Cloud SDK (`llama-3.3-70b-versatile`) |
| Testes de Integração | TSX + Test Runner integrado |

---

## 📦 Módulos do Sistema

### Backend — Módulos Express (`backend/src/`)
```text
controllers/          # Controladores HTTP de autenticação, agendamentos, financeiro, clientes e IA
middlewares/          # Middleware de autenticação JWT, isolamento de tenant e validação Zod
routes/               # Rotas RESTful (/api/auth, /api/appointments, /api/financial, /api/ai, etc.)
schemas/              # Schemas de validação estrita com Zod (appointmentSchema, financialSchema, etc.)
services/             # Regras de negócio, motor anti-colisão, higienização LGPD e mensageria
config/               # Configuração e parsing tipado de variáveis de ambiente (env.ts)
tests/                # Testes automatizados divididos em fases operacionais (Fases 1 a 7)
```

### Frontend — Componentes & Telas (`src/`)
```text
pages/                # Dashboard, Agenda, Clientes, Servicos, Profissionais, Financeiro, WhatsApp, MinhaPagina
components/agenda/    # Grade interativa semanal, timeline de horários, filtros e drawers de agendamento
components/financeiro/# Visão Geral & Caixa, Contas a Pagar/Receber, Comissões, Estoque e Relatórios DRE
components/dashboard/ # Cards de KPIs, Gráfico de Faturamento Semanal e Widget Executivo de Fluxo de Caixa
components/ai/        # AIChatPanel (drawer adaptável a viewport mobile), AIFloatingButton e renderizador markdown
components/layout/    # AppLayout, AuthLayout, Header, Sidebar colapsável e MobileBottomNav
components/ui/        # Design system reutilizável (Button, Card, Drawer, EmptyState, Input, Select, Badge, Toast)
stores/               # Stores globais Zustand (authStore, appointmentStore, financialStore, aiChatStore, etc.)
```

---

## 🗂️ Estrutura do Projeto
```text
sistema-agendamentos/
├── backend/                    # API REST Node.js + Express + Prisma
│   ├── prisma/
│   │   └── schema.prisma       # Modelagem relacional multi-tenant do banco
│   ├── src/
│   │   ├── config/             # Configurações de ambiente
│   │   ├── controllers/        # Controladores das rotas
│   │   ├── middlewares/        # Autenticação e validação
│   │   ├── routes/             # Definição dos endpoints REST
│   │   ├── schemas/            # Schemas Zod de entrada
│   │   ├── services/           # Regras de negócio e IA
│   │   ├── tests/              # Suítes de integração (Fases 1 a 7)
│   │   └── server.ts           # Ponto de entrada do servidor HTTP
│   ├── package.json
│   └── tsconfig.json
├── src/                        # SPA Frontend React 18 + Vite
│   ├── __tests__/              # Suíte de testes unitários com Vitest (44 testes)
│   ├── components/             # Componentes organizados por domínio de negócio
│   ├── hooks/                  # Custom hooks (useVisualViewport, etc.)
│   ├── pages/                  # Telas completas da aplicação
│   ├── services/               # Clientes de API, WhatsApp helpers e motor Groq
│   ├── stores/                 # Stores reativas Zustand
│   ├── types/                  # Definições TypeScript
│   ├── utils/                  # Utilitários de data, moeda, cn e fluxo de caixa
│   ├── App.tsx                 # Roteamento e lazy-loading de rotas
│   └── main.tsx                # Bootstrap da aplicação React
├── supabase/                   # Migrations SQL e scripts PostgreSQL
├── public/                     # Assets estáticos e ilustrações
├── index.html                  # Shell HTML com meta tags viewport mobile-first
├── package.json                # Dependências e scripts do frontend
├── vite.config.ts              # Configurações do Vite e Vitest
└── README.md                   # Este arquivo
```

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
- **Node.js 18+** (recomendado v20.x LTS)
- **npm** (incluso com Node) ou **pnpm**
- **Git**
- Conta gratuita no [Supabase](https://supabase.com) (ou instância PostgreSQL local)
- *(Opcional)* Chave de API no [console.groq.com](https://console.groq.com/keys) para IA generativa Llama 3.3

### Variáveis de Ambiente

#### Backend (`backend/.env`)
```env
# Porta do Servidor Express
PORT=3001

# Banco de Dados PostgreSQL (Supabase ou Local)
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.SEU_PROJETO.supabase.co:5432/postgres?sslmode=require"

# Chave Secreta para Assinatura de Tokens JWT (mínimo 32 caracteres)
JWT_SECRET="agenda_ai_jwt_secret_token_key_dev_2026_super_secure!"
JWT_EXPIRES_IN="7d"

# URL do Frontend permitida pelo CORS
FRONTEND_URL="http://localhost:5173"

# Chave da API Groq Cloud (Opcional - mantida com segurança no servidor)
GROQ_API_KEY="gsk_sua_chave_groq_aqui"
```

#### Frontend (`.env`)
```env
# URL base da API Backend (em desenvolvimento local ou produção)
VITE_API_URL="http://localhost:3001/api"

# Credenciais Públicas Supabase
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-publica-anon-aqui"
```

---

## ▶️ Execução Local

### 1. Instalação das Dependências
```bash
# Na raiz do projeto (Frontend)
npm install

# No diretório do Backend
npm --prefix backend install
```

### 2. Banco de Dados & Prisma
```bash
# Gerar o client tipado do Prisma
npm --prefix backend run prisma:generate

# Sincronizar o schema com o PostgreSQL
npm --prefix backend run prisma:push
```

### 3. Iniciar a Aplicação
```bash
# Terminal 1 — Backend (API na porta 3001):
npm --prefix backend run dev

# Terminal 2 — Frontend (Vite na porta 5173):
npm run dev
```

Acesse no navegador: **`http://localhost:5173`**

---

## 🚀 Deploy

O projeto está estruturado para deploy contínuo (CI/CD via Git) com separação segura entre camadas:

- **Frontend:** Conectado à [Vercel](https://vercel.com). Qualquer push na branch `main` dispara o build automático (`tsc && vite build`).
- **Backend:** Conectado à [Railway](https://railway.app). O serviço executa `npm run build` (`prisma generate && tsc`) e inicializa via `npm start`.
- **Banco de Dados:** PostgreSQL gerenciado no [Supabase](https://supabase.com) com isolamento multi-tenant garantido por Row Level Security (RLS).

---

## 📜 Scripts Úteis

### Frontend
```bash
npm run dev          # Iniciar servidor de desenvolvimento (Vite)
npm run build        # Verificação TypeScript e build para produção
npm run preview      # Visualizar o build de produção localmente
npm test             # Executar suíte de testes unitários com Vitest
npm test -- --watch  # Executar testes em modo observador
```

### Backend
```bash
npm --prefix backend run dev           # Iniciar servidor em desenvolvimento (tsx watch)
npm --prefix backend run build         # Gerar client Prisma e compilar TypeScript
npm --prefix backend run start         # Iniciar servidor compilado em produção
npm --prefix backend run test:all      # Executar todos os testes de integração (Fases 1 a 7)
npm --prefix backend run prisma:push   # Sincronizar schema Prisma com o banco
npm --prefix backend run prisma:studio # Abrir painel gráfico do banco Prisma Studio
npm --prefix backend run user:password <email> <nova_senha> # Redefinir senha de usuário
```

---

## 🔐 Controle de Acesso (RBAC)

O **Agenda AI** implementa controle de acesso rigoroso baseado em papéis (Role-Based Access Control) com 5 níveis hierárquicos:

| Papel | Acesso e Responsabilidades |
| :--- | :--- |
| **`SUPER_ADMIN`** | Acesso irrestrito a todos os estabelecimentos, configurações globais e métricas da plataforma |
| **`OWNER`** | Proprietário do estabelecimento: acesso total ao financeiro, configurações, equipe, agenda e mini-site |
| **`ADMIN`** | Administrador da unidade: gestão de agenda, clientes, relatórios financeiros e catálogo de serviços |
| **`PROFESSIONAL`** | Membro da equipe: visualização da sua escala de horários, serviços realizados e comissões individuais |
| **`RECEPTIONIST`** | Recepção: agendamentos, check-in, cadastro de clientes e WhatsApp Hub (sem acesso ao módulo financeiro) |

*O acesso a rotas confidenciais (como `/financeiro` e widgets executivos de caixa) é protegido por guards no frontend e middlewares com verificação de JWT no backend.*

---

## 🤝 Contribuindo
1. Faça um Fork do projeto ou crie uma branch a partir da `main`:
   ```bash
   git checkout -b feat/minha-feature
   ```
2. Siga o padrão de commits semânticos (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
3. Execute a suíte de testes antes de abrir commits:
   ```bash
   npm test
   npm --prefix backend run test:all
   ```
4. Abra um **Pull Request** detalhando claramente as mudanças realizadas e os cenários testados.

---

## 📄 Licença
Distribuído sob a licença **MIT**. Consulte o arquivo `LICENSE` para mais informações.

---

<div align="center">
  <strong>Agenda AI — Transformando a gestão de agendamentos e clínicas com tecnologia e inteligência artificial</strong><br />
  Desenvolvido por <strong>Beatriz Farias</strong>
</div>
