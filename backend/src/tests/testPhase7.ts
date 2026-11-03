import request from 'supertest';
import { app } from '../app.js';
import { generateToken } from '../utils/jwt.js';

async function runPhase7Tests() {
  console.log('==========================================================');
  console.log('🧪 INICIANDO TESTES DA FASE 7 — BACKEND AGENDA AI');
  console.log('   (Módulos: WhatsApp & Mensageria de Agendamentos)');
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
  console.log('--- 1. Proteção de Rotas de WhatsApp sem Token JWT (401) ---');

  const noTokenStatus = await request(app).get('/api/whatsapp/status');
  assert(noTokenStatus.status === 401, 'GET /api/whatsapp/status sem token deve retornar 401');

  const noTokenSend = await request(app).post('/api/whatsapp/send').send({
    customerName: 'Cliente Teste',
    customerPhone: '11999998888',
    message: 'Olá!',
  });
  assert(noTokenSend.status === 401, 'POST /api/whatsapp/send sem token deve retornar 401');

  const noTokenLogs = await request(app).get('/api/whatsapp/logs');
  assert(noTokenLogs.status === 401, 'GET /api/whatsapp/logs sem token deve retornar 401');

  // -------------------------------------------------------------
  // 2. CONTROLE DE ACESSO RBAC (403 PARA PROFESSIONAL)
  // -------------------------------------------------------------
  console.log('\n--- 2. Proteção RBAC no WhatsApp ---');

  const profStatus = await request(app)
    .get('/api/whatsapp/status')
    .set('Authorization', `Bearer ${professionalToken}`);
  assert(profStatus.status === 403, 'PROFESSIONAL deve ser bloqueado com 403 no módulo de WhatsApp');

  // -------------------------------------------------------------
  // 3. VALIDAÇÃO ZOD NO ENVIO DE MENSAGENS (422)
  // -------------------------------------------------------------
  console.log('\n--- 3. Validação Zod no Envio de Mensagens ---');

  const invalidSend1 = await request(app)
    .post('/api/whatsapp/send')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      customerName: 'A', // Muito curto
      customerPhone: '',
      message: '',
    });
  assert(invalidSend1.status === 422, 'POST /send com dados vazios deve retornar 422');
  assert(
    invalidSend1.body.errors?.some((e: any) => e.field.includes('customerName')),
    'Deve acusar nome do cliente inválido'
  );
  assert(
    invalidSend1.body.errors?.some((e: any) => e.field.includes('customerPhone')),
    'Deve acusar telefone obrigatório'
  );

  // -------------------------------------------------------------
  // 4. VALIDAÇÃO ZOD NA CONEXÃO WHATSAPP (422)
  // -------------------------------------------------------------
  console.log('\n--- 4. Validação Zod na Conexão ---');

  const invalidConnect = await request(app)
    .post('/api/whatsapp/connect')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      status: 'invalid-status',
      batteryLevel: 150, // Max é 100
    });
  assert(invalidConnect.status === 422, 'POST /connect com status ou bateria inválida deve retornar 422');

  // -------------------------------------------------------------
  // 5. PERMISSÕES DE RECEPTIONIST NO WHATSAPP
  // -------------------------------------------------------------
  console.log('\n--- 5. Permissão de Acesso da Recepção (RECEPTIONIST) ---');

  // Deve passar pelo RBAC e middleware (se DB estiver offline no mock, não dá 401 nem 403)
  const recepSend = await request(app)
    .post('/api/whatsapp/send')
    .set('Authorization', `Bearer ${receptionistToken}`)
    .send({
      customerName: 'Juliana Paes',
      customerPhone: '11988887777',
      message: 'Olá, seu agendamento foi confirmado!',
    });
  assert(
    recepSend.status !== 401 && recepSend.status !== 403,
    'RECEPTIONIST possui permissão de envio pelo WhatsApp (não é 401 nem 403)'
  );

  console.log('\n==========================================================');
  console.log(`📊 RESULTADO FINAL DOS TESTES DA FASE 7:`);
  console.log(`   Total de Testes:  ${passed + failed}`);
  console.log(`   Passaram:         ${passed}`);
  console.log(`   Falharam:         ${failed}`);
  console.log('==========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 TODOS OS TESTES DA FASE 7 PASSARAM COM SUCESSO!\n');
  }
}

runPhase7Tests().catch((err) => {
  console.error('Erro fatal nos testes da Fase 7:', err);
  process.exit(1);
});

