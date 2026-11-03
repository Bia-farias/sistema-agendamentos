import request from 'supertest';
import { app } from '../app.js';
import { generateToken } from '../utils/jwt.js';

async function runPhase5Tests() {
  console.log('==========================================================');
  console.log('🧪 INICIANDO TESTES DA FASE 5 — BACKEND AGENDA AI');
  console.log('   (Módulos: ERP Financeiro, Contas a Pagar/Receber, Fornecedores & Estoque)');
  console.log('==========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extraInfo = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extraInfo}`);
      failed++;
    }
  }

  // Tokens para testes
  const ownerToken = generateToken({
    userId: 'mock-user-owner-1',
    tenantId: 'mock-tenant-alpha',
    role: 'OWNER',
    email: 'proprietario@salao.com',
  });

  const adminToken = generateToken({
    userId: 'mock-user-admin-1',
    tenantId: 'mock-tenant-alpha',
    role: 'ADMIN',
    email: 'admin@salao.com',
  });

  const receptionistToken = generateToken({
    userId: 'mock-user-recep-1',
    tenantId: 'mock-tenant-alpha',
    role: 'RECEPTIONIST',
    email: 'recepcao@salao.com',
  });

  const professionalToken = generateToken({
    userId: 'mock-user-prof-1',
    tenantId: 'mock-tenant-alpha',
    role: 'PROFESSIONAL',
    email: 'profissional@salao.com',
  });

  // -------------------------------------------------------------
  // 1. TESTES DE PROTEÇÃO POR JWT (401 SEM TOKEN)
  // -------------------------------------------------------------
  console.log('--- 1. Proteção de Rotas Financeiras sem Token JWT (401) ---');

  const noTokenRec = await request(app).get('/api/financial/receivables');
  assert(noTokenRec.status === 401, 'GET /api/financial/receivables sem token deve retornar 401');

  const noTokenPay = await request(app).get('/api/financial/payables');
  assert(noTokenPay.status === 401, 'GET /api/financial/payables sem token deve retornar 401');

  const noTokenSup = await request(app).get('/api/financial/suppliers');
  assert(noTokenSup.status === 401, 'GET /api/financial/suppliers sem token deve retornar 401');

  const noTokenMerch = await request(app).get('/api/financial/merchandise');
  assert(noTokenMerch.status === 401, 'GET /api/financial/merchandise sem token deve retornar 401');

  // -------------------------------------------------------------
  // 2. TESTES DE RBAC (SEGURANÇA DE DADOS CONFIDENCIAIS - 403)
  // -------------------------------------------------------------
  console.log('\n--- 2. Proteção RBAC no Financeiro (Bloqueio de Não-Administradores) ---');

  const recepFinancial = await request(app)
    .get('/api/financial/receivables')
    .set('Authorization', `Bearer ${receptionistToken}`);
  assert(recepFinancial.status === 403, 'RECEPTIONIST deve ser bloqueado com 403 no módulo financeiro');

  const profFinancial = await request(app)
    .get('/api/financial/payables')
    .set('Authorization', `Bearer ${professionalToken}`);
  assert(profFinancial.status === 403, 'PROFESSIONAL deve ser bloqueado com 403 no contas a pagar');

  // -------------------------------------------------------------
  // 3. VALIDAÇÃO ZOD EM CONTAS A RECEBER (422)
  // -------------------------------------------------------------
  console.log('\n--- 3. Validação Zod em Contas a Receber ---');

  const invalidRec = await request(app)
    .post('/api/financial/receivables')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      customerName: 'A', // Muito curto
      description: '',
      originalAmount: -50, // Negativo
      dueDate: 'data-invalida',
    });

  assert(invalidRec.status === 422, 'POST /receivables com dados inválidos deve retornar 422');
  assert(
    invalidRec.body.errors?.some((e: any) => e.field.includes('originalAmount')),
    'Deve rejeitar valor original negativo'
  );
  assert(
    invalidRec.body.errors?.some((e: any) => e.field.includes('dueDate')),
    'Deve exigir formato correto de data no vencimento'
  );

  // -------------------------------------------------------------
  // 4. VALIDAÇÃO ZOD EM CONTAS A PAGAR (422)
  // -------------------------------------------------------------
  console.log('\n--- 4. Validação Zod em Contas a Pagar ---');

  const invalidPay = await request(app)
    .post('/api/financial/payables')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      description: 'D',
      amount: -100,
      dueDate: '2026/11/03',
    });

  assert(invalidPay.status === 422, 'POST /payables com dados inválidos deve retornar 422');
  assert(
    invalidPay.body.errors?.some((e: any) => e.field.includes('amount')),
    'Deve rejeitar valor negativo em contas a pagar'
  );

  // -------------------------------------------------------------
  // 5. VALIDAÇÃO ZOD EM FORNECEDORES (422)
  // -------------------------------------------------------------
  console.log('\n--- 5. Validação Zod em Fornecedores ---');

  const invalidSup = await request(app)
    .post('/api/financial/suppliers')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      name: 'X',
      document: '123', // Documento muito curto
      phone: '12',
    });

  assert(invalidSup.status === 422, 'POST /suppliers com dados inválidos deve retornar 422');
  assert(
    invalidSup.body.errors?.some((e: any) => e.field.includes('document')),
    'Deve exigir documento CNPJ/CPF com tamanho mínimo'
  );

  // -------------------------------------------------------------
  // 6. VALIDAÇÃO ZOD EM PRODUTOS & ESTOQUE (422)
  // -------------------------------------------------------------
  console.log('\n--- 6. Validação Zod em Produtos e Estoque ---');

  const invalidMerch = await request(app)
    .post('/api/financial/merchandise')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      name: 'X',
      costPrice: -10,
    });

  assert(invalidMerch.status === 422, 'POST /merchandise com dados inválidos deve retornar 422');
  assert(
    invalidMerch.body.errors?.some((e: any) => e.field.includes('costPrice')),
    'Deve rejeitar preço de custo negativo'
  );

  // -------------------------------------------------------------
  // 7. VALIDAÇÃO ZOD EM CONFIGURAÇÃO DE SINAL (422)
  // -------------------------------------------------------------
  console.log('\n--- 7. Validação Zod em Parâmetros de Sinal ---');

  const invalidDeposit = await request(app)
    .put('/api/financial/deposit-config')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      enabled: true,
      type: 'invalid-type',
      value: -20,
    });

  assert(invalidDeposit.status === 422, 'PUT /deposit-config com tipo inválido deve retornar 422');

  console.log('\n==========================================================');
  console.log(`📊 RESULTADO FINAL DOS TESTES DA FASE 5:`);
  console.log(`   Total de Testes:  ${passed + failed}`);
  console.log(`   Passaram:         ${passed}`);
  console.log(`   Falharam:         ${failed}`);
  console.log('==========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 TODOS OS TESTES DA FASE 5 PASSARAM COM SUCESSO!\n');
  }
}

runPhase5Tests().catch((err) => {
  console.error('Erro fatal nos testes da Fase 5:', err);
  process.exit(1);
});

