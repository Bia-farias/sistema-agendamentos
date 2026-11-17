# 🧠 Modelo Mental & Contexto Arquitetural da IA

Este documento define o modelo mental permanente e as diretrizes obrigatórias para agentes de IA que atuam no repositório **Agenda AI**.

---

## 1. Princípios Inegociáveis

1. **Multi-Tenancy Estrito:**
   - Todos os dados operacionais e financeiros pertencem a um `tenantId`.
   - Nenhuma query ou mutação pode cruzar dados entre estabelecimentos diferentes.
   - O Supabase está protegido por Row Level Security (RLS) baseado em `tenantId`.

2. **Privacidade e LGPD:**
   - Nenhum dado pessoal identificável (PII como CPF, telefones sem máscara ou e-mails pessoais de clientes) deve ser enviado desnecessariamente a APIs de terceiros.
   - O módulo de IA no backend faz a sanitização de dados antes de processar resumos executivos.

3. **Regras de Negócio da Agenda:**
   - Validação matemática de sobreposição de horários (anti-colisão).
   - Respeito aos intervalos de almoço e dias de folga dos profissionais.
   - Respeito à política de sinal (Pix antecipado) configurada pelo estabelecimento.

4. **Integridade Financeira:**
   - Todo agendamento concluído gera movimentações no contas a receber / caixa.
   - O cálculo de comissões deve ser fiel à taxa percentual configurada para cada profissional.

---

## 2. Visão Geral da Pilha Tecnológica

- **Frontend:** React 18.3, TypeScript 5.5 (strict), Vite 5.4, Zustand 4.5, Tailwind CSS 3.4, Vitest 4.1.
- **Backend:** Node.js 20.x, Express 4.21, Prisma ORM 5.22, Zod 3.23.
- **Banco de Dados:** PostgreSQL hospedado no Supabase com RLS.
- **IA:** Engine Llama 3.3 70B via Groq Cloud SDK com fallback contextual local.

