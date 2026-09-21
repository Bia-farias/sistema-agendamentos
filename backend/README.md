# 🚀 Agenda AI — Backend API

API REST construída em **Node.js**, **TypeScript**, **Express**, **Prisma ORM**, **PostgreSQL**, **JWT** e **Zod**.

---

## 📁 Estrutura de Diretórios

```
backend/
├── prisma/
│   ├── schema.prisma                 # Schema multi-tenant completo
│   └── migrations/                   # Histórico de migrations SQL
├── src/
│   ├── config/
│   │   └── env.ts                    # Validação de variáveis de ambiente com Zod
│   ├── controllers/
│   │   ├── authController.ts         # Handlers de registro, login e /me
│   │   └── healthController.ts       # Status e integridade da API
│   ├── database/
│   │   └── prisma.ts                 # Instância e conexão do Prisma Client
│   ├── middlewares/
│   │   ├── authMiddleware.ts         # Validação e injeção do JWT no req.user
│   │   ├── rbacMiddleware.ts         # Controle de permissões baseado em papéis
│   │   ├── errorMiddleware.ts        # Handler global de erros
│   │   └── validateMiddleware.ts     # Validação automática com Zod
│   ├── routes/
│   │   ├── authRoutes.ts             # POST /register, POST /login, GET /me
│   │   ├── healthRoutes.ts           # GET /health
│   │   └── index.ts                  # Agregador de rotas
│   ├── schemas/
│   │   └── authSchema.ts             # Schemas Zod de entrada
│   ├── services/
│   │   └── authService.ts            # Lógica de negócio, hash bcrypt e transações
│   ├── utils/
│   │   ├── appError.ts               # Erros operacionais customizados
│   │   ├── jwt.ts                    # Geração e decodificação de JWT
│   │   ├── password.ts               # Hash e comparação bcrypt
│   │   └── response.ts               # Padronização de respostas JSON
│   ├── tests/
│   │   └── testPhase1.ts             # Suíte de testes automatizados da Fase 1
│   ├── app.ts                        # Configuração do Express e CORS
│   └── server.ts                     # Ponto de entrada do servidor HTTP
├── .env                              # Variáveis ativas
├── .env.example                      # Modelo de variáveis
├── package.json
└── tsconfig.json
```

---

## 🛠️ Como Executar

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Configurar o `.env`
Preencha a URL de conexão com seu PostgreSQL no arquivo `.env`:
```env
PORT=3001
DATABASE_URL="postgresql://postgres:[SENHA]@db.wbvnifdtozhgwaclldac.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="sua_chave_jwt_super_secreta"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
```

### 3. Gerar o Cliente Prisma
```bash
npm run prisma:generate
```

### 4. Executar os Testes Automatizados
```bash
# Executar todos os testes (Fase 1 e Fase 2)
npm test

# Ou individualmente
npm run test:phase1
npm run test:phase2
```

### 5. Iniciar em Modo de Desenvolvimento
```bash
npm run dev
```
Servidor disponível em: `http://localhost:3001`

---

## 🛡️ Endpoints Implementados

### Fase 1: Autenticação & Setup
* `GET /api/health` — Status da API e teste de integridade
* `POST /api/auth/register` — Criação atômica do Tenant e Usuário Proprietário (OWNER)
* `POST /api/auth/login` — Autenticação por e-mail e senha, geração de JWT
* `GET /api/auth/me` — Consulta dos dados do usuário autenticado e seu Tenant

### Fase 2: Clientes, Serviços e Profissionais (Multi-Tenant)
* **Clientes (`/api/clients`)**:
  * `GET /api/clients` — Listagem paginada com busca por nome, telefone, e-mail e filtro VIP
  * `GET /api/clients/:id` — Detalhes do cliente com histórico recente de agendamentos
  * `POST /api/clients` — Cadastro de novo cliente vinculado ao tenant
  * `PUT /api/clients/:id` — Atualização cadastral do cliente
  * `DELETE /api/clients/:id` — Remoção com proteção contra exclusão de clientes com agendamentos

* **Serviços (`/api/services`)**:
  * `GET /api/services` — Listagem com filtros por categoria e status ativo
  * `GET /api/services/:id` — Detalhes do serviço
  * `POST /api/services` — Criação de procedimento (restrito a `OWNER`, `ADMIN`)
  * `PUT /api/services/:id` — Atualização de procedimento (restrito a `OWNER`, `ADMIN`)
  * `DELETE /api/services/:id` — Exclusão ou desativação segura (restrito a `OWNER`, `ADMIN`)

* **Profissionais (`/api/professionals`)**:
  * `GET /api/professionals` — Listagem da equipe com especialidades e horários de trabalho
  * `GET /api/professionals/:id` — Detalhes do profissional e atendimentos recentes
  * `POST /api/professionals` — Cadastro de membro da equipe (restrito a `OWNER`, `ADMIN`)
  * `PUT /api/professionals/:id` — Atualização de dados e escala de atendimento (restrito a `OWNER`, `ADMIN`)
  * `DELETE /api/professionals/:id` — Exclusão ou desativação da equipe (restrito a `OWNER`, `ADMIN`)

