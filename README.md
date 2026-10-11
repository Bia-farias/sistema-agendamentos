<div align="center">

# ⚡ Agenda AI — SaaS de Agendamento & Gestão com IA

**Sistema SaaS Multi-Tenant inteligente para salões de beleza, barbearias, clínicas estéticas e profissionais autônomos.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-4338CA?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![Supabase](https://img.shields.io/badge/BaaS-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tests-19%20Passed-emerald?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Security](https://img.shields.io/badge/Security-0%20Vulnerabilities-emerald?style=for-the-badge&logo=dependabot&logoColor=white)](https://github.com/)

<br />

[Visualizar Demonstração](#-acesso-rápido-à-demonstração) •
[Funcionalidades](#-principais-funcionalidades) •
[Testes Automatizados](#-testes-automatizados--qualidade) •
[Arquitetura](#-arquitetura-do-projeto) •
[Instalação & Deploy](#-como-executar-o-projeto) •
[Documentação Completa](./docs/00-README.md)

</div>

---

## 📌 Visão Geral do Produto

O **Agenda AI** é uma solução completa de gestão operacional e relacionamento para negócios de agendamento de serviços. O sistema combina uma **agenda interativa semanal e diária**, **CRM de clientes com histórico de gastos**, **automações de mensagens via WhatsApp com preview em tempo real** e um **assistente de inteligência artificial** alimentado por modelos LLM de alta performance (Llama 3.3 70B via Groq) contextualizado com as métricas do negócio.

Projetado com arquitetura **Multi-Tenant**, suporta múltiplos estabelecimentos independentes, com regras de acesso baseadas em papéis (**RBAC**: *Owner*, *Admin*, *Professional*, *Receptionist*).

---

## ✨ Principais Funcionalidades

### 📊 1. Dashboard de Performance & KPIs
- **Métricas em Tempo Real**: Faturamento do dia, total de agendamentos, atendimentos pendentes e taxa de ocupação da equipe.
- **Gráfico Semanal de Receita**: Acompanhamento visual da evolução diária do faturamento e volume de atendimentos.
- **Fila Operacional do Dia**: Lista cronológica de horários com atualização rápida de status (*Pendente*, *Confirmado*, *Concluído*, *Cancelado*).
- **Radar de Clientes VIP**: Destaque automático dos clientes de maior valor com botão de contato direto via WhatsApp.

### 📅 2. Agenda Interativa de Atendimentos
- **Visão Flexível**: Alternância instantânea entre modo **Semanal** e **Diário**.
- **Filtros Combinados**: Filtragem em tempo real por profissional específico e por status do agendamento.
- **Grade Horária Ergonômica**: Intervalos de atendimento das 08:00 às 20:00 com slots clicáveis que abrem o agendamento já com data e horário pré-selecionados.
- **Gavetas Laterais (Drawers)**: Criação e edição sem modais centrais intrusivos, mantendo o contexto do calendário sempre visível.

### 💬 3. WhatsApp Hub & Automações
- **Simulador de Conexão com QR Code**: Experiência realista de pareamento de instância WhatsApp Business.
- **Editor de Modelos Dinâmicos**: Criação de templates com substituição de tags inteligentes (`{cliente_nome}`, `{data}`, `{horario}`, `{servico}`, `{profissional}`).
- **Preview Fiel do WhatsApp**: Visualização em formato de balão com carimbo de entrega e leitura idêntico ao aplicativo.
- **Campanha de Reativação em Lote**: Identificação de clientes inativos há mais de 30 dias com disparo de mensagens de resgate com um clique.
- **Histórico e Logs de Envio**: Rastreamento de entregas, leituras e confirmações de presença.

### 👥 4. CRM & Gestão de Clientes
- **Segmentação Inteligente**: Abas para *Todos*, *Frequentes*, *VIPs* e *Inativos/Retorno*.
- **Busca Global Instantânea**: Localização imediata por nome, telefone ou e-mail.
- **Visualização Dupla**: Alternância fluida entre visualização em **Grade de Cartões** ou **Tabela Detalhada**.
- **Histórico do Cliente**: Contabilização automática do total investido (LTV) e número total de visitas realizadas.

### ✂️ 5. Catálogo de Serviços & Equipe
- **Serviços por Categoria**: Organização em pílulas (*Cabelo*, *Barbearia*, *Unhas*, *Estética*, *Corporal*), tempo de duração e valores.
- **Equipe de Profissionais**: Gestão de colaboradores com fotos de perfil, tags de especialidades, contato e comissionamento percentual configurável.

### 🤖 6. Assistente de Inteligência Artificial Integrado
- **Contexto Operacional Nativo**: O assistente tem acesso dinâmico ao faturamento, horários do dia, catálogo e lista de clientes.
- **Dual Engine**: Suporte a chamadas diretas à API da **Groq (Llama 3.3 70B)** e modo de **simulação inteligente autônoma** (funciona perfeitamente mesmo sem chave de API configurada).
- **Atalhos Rápidos**: Prompts prontos para análise de faturamento, resumo da agenda, clientes a reativar e sugestões de mensagens.

### 🎨 7. Design System & Acessibilidade
- **Dark Mode & Light Mode**: Tema escuro refinado (`#09090b`) e tema claro ergonômico com persistência automática no `localStorage`.
- **Interface Responsiva**: Navegação desktop com sidebar expansível/retrátil e navegação mobile ergonômica com *Bottom Navigation Bar* e botão de ação flutuante.
- **Sistema de Feedback Global**: Toasts animados e microinterações fluidas.

---

## 🔑 Acesso Rápido à Demonstração

A aplicação conta com um sistema de **Acesso Rápido Demo** na tela de login. Basta selecionar um dos perfis para entrar instantaneamente:

| Perfil | E-mail de Teste | Permissões |
| :--- | :--- | :--- |
| **Proprietário (Owner)** | `admin@agendaai.com` | Acesso irrestrito a todos os módulos e métricas |
| **Administrador** | `admin@studio.com` | Gestão de agenda, clientes, serviços e equipe |
| **Profissional** | `camila@studio.com` | Visualização da própria agenda e atendimentos |
| **Recepcionista** | `recepcao@studio.com` | Agendamentos, confirmações e cadastro de clientes |

> *Senha padrão para todos os perfis demo:* `123456`

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Detalhes |
| :--- | :--- | :--- |
| **Framework Web** | React 18 | Base de componentes funcionais com Hooks modernos |
| **Linguagem** | TypeScript 5.5 | Tipagem estática rigorosa para todas as entidades e stores |
| **Build Tool** | Vite 5.4 | Hot Module Replacement (HMR) ultrarrápido e bundling otimizado |
| **Estilização** | Tailwind CSS 3.4 | Utilitários de design tokens com suporte nativo a Dark Mode |
| **Gerenciamento de Estado** | Zustand 4.5 | Estado global modular, reativo e sincronizado com `localStorage` |
| **Roteamento** | React Router Dom v6 | Rotas autenticadas, layouts aninhados e carregamento sob demanda (*lazy loading*) |
| **Ícones** | Lucide React | Biblioteca consistente e leve de ícones vetoriais |
| **Manipulação de Datas** | Date-fns 3.6 | Utilitários de cálculo de intervalos e semanas |
| **Inteligência Artificial** | Groq SDK / OpenAI API | LLM Llama 3.3 70B com fallback inteligente |
| **Backend & Banco de Dados** | Supabase (PostgreSQL) | Estrutura preparada para autenticação e persistência remota |

---

## 📁 Arquitetura do Projeto

```
src/
├── components/
│   ├── agenda/           # Calendário semanal, filtros e gavetas de agendamento
│   ├── ai/               # Painel flutuante do chat de IA e botões de atalho
│   ├── clientes/         # Gavetas de cadastro e histórico detalhado de clientes
│   ├── layout/           # Sidebar retrátil, Header, AppLayout e MobileBottomNav
│   ├── profissionais/    # Gavetas de equipe e especialidades
│   ├── servicos/         # Gavetas de catálogo de serviços e precificação
│   ├── ui/               # Componentes atômicos (Button, Card, Drawer, Input, Toast...)
│   └── whatsapp/         # Hub de automação, editor de templates e simulador de QR Code
├── pages/
│   ├── auth/             # Login, Registro em 2 etapas e Recuperação de Senha
│   ├── Agenda.tsx        # Tela principal da agenda de horários
│   ├── Clientes.tsx      # CRM e gestão de base de contatos
│   ├── Dashboard.tsx     # Visão geral de faturamento e operações
│   ├── Profissionais.tsx # Gerenciamento da equipe e escalas
│   ├── Servicos.tsx      # Catálogo e duração de procedimentos
│   └── WhatsApp.tsx      # Central de mensagens e regras de lembretes
├── services/
│   ├── groq.ts           # Integração com LLM e simulação de IA
│   ├── mockData.ts       # Dados iniciais realistas para onboarding instantâneo
│   ├── supabase.ts       # Cliente Supabase e verificação de conexão
│   └── whatsapp.ts       # Utilitários de formatação de links wa.me
├── stores/               # Stores modulares do Zustand (auth, appointment, customer...)
├── types/                # Definições completas de tipos TypeScript (Tenant, Appointment...)
└── utils/                # Funções utilitárias (formatação de moeda, datas, merge de classes)
```

---

## 💻 Como Executar o Projeto

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/agenda-ai.git
cd agenda-ai
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente (Opcional)
Copie o arquivo de exemplo e preencha suas chaves caso deseje integrar ao Supabase ou Groq:
```bash
cp .env.example .env
```
*(Nota: O projeto funciona 100% de forma autônoma sem preenchimento do `.env`, utilizando dados locais e IA simulada).*

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Abra o navegador em `http://localhost:5173`.

### 5. Executar os Testes Automatizados
```bash
npm test
```

### 6. Compilação para Produção (Typecheck + Bundling Otimizado)
```bash
npm run build
```

### 7. Deploy na Vercel
O projeto está 100% pronto para deploy na Vercel:
1. Conecte seu repositório no dashboard da [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. *(Opcional)* Adicione as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` caso utilize banco em nuvem. Sem elas, o sistema opera fluidamente em modo offline-first local!

---

## 🧪 Testes Automatizados & Qualidade (QA)

O projeto possui **19 testes unitários automatizados** com [Vitest](https://vitest.dev), garantindo estabilidade e validação das regras críticas de negócio:

| Suíte de Testes | Arquivo | Cobertura | Status |
| :--- | :--- | :--- | :--- |
| **Colisão de Horários** | `appointmentCollision.test.ts` | 9 testes: sobreposição total, parcial, limites exatos e múltiplos profissionais |  100% Pass |
| **Política de Sinal Pix** | `depositPolicy.test.ts` | 4 testes: cálculo de porcentagem, retenção fixa, arredondamento e tolerância zero |  100% Pass |
| **Comissões Financeiras** | `financialCommission.test.ts` | 3 testes: divisão de faturamento líquido, descontos de taxas de operadora e repasses |  100% Pass |
| **Formatação WhatsApp** | `whatsappFormatting.test.ts` | 3 testes: limpeza de DDI/DDD, caracteres especiais e sanitização de URLs wa.me |  100% Pass |

---

## 🗺️ Roadmap de Evolução

- [x] **V1 — MVP Front-End Completo**
  - [x] Autenticação com perfis demo (Owner, Admin, Profissional, Recepcionista)
  - [x] Agenda interativa semanal/diária com filtros e anti-colisão
  - [x] CRM de clientes com métricas de frequência e LTV
  - [x] Hub WhatsApp com editor de modelos e preview
  - [x] Assistente de IA operacional com Groq Llama 3.3
  - [x] Dark Mode nativo com persistência
- [x] **V1.5 — Experiência do Cliente & Módulo Financeiro**
  - [x] Página pública de auto-agendamento online (`/agendar/:slug`)
  - [x] Gestão Financeira Completa: Contas a Receber, Contas a Pagar, DRE e Fluxo de Caixa
  - [x] Gestão de Fornecedores, Comissões e Controle de Mercadorias/Estoque
  - [x] Configuração de Sinal de Agendamento com Copia e Cola Pix
  - [x] Command Palette global acessível por atalho (`Ctrl + K`)
  - [x] Otimização de Code Splitting com chunks leves (< 250 kB)
- [x] **V2 — Arquitetura de Nuvem & Segurança**
  - [x] Resolução de vulnerabilidades de dependências (0 vulnerabilidades `npm audit`)
  - [x] Schemas DDL com Row Level Security (RLS) completo para PostgreSQL/Supabase
  - [x] Camada de serviços assíncronos (`financialService`, `appointmentService`, `customerService`)
  - [ ] Integração nativa com instâncias Evolution API / Z-API para disparo real no WhatsApp

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

<div align="center">
Desenvolvido com foco em excelência técnica, código limpo e padrões de engenharia de software de alta performance.
</div>
