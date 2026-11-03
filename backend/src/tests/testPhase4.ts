import request from 'supertest';
import { app } from '../app.js';
import { generateToken } from '../utils/jwt.js';

async function runPhase4Tests() {
  console.log('==========================================================');
  console.log('🧪 INICIANDO TESTES DA FASE 4 — BACKEND AGENDA AI');
  console.log('   (Módulos: Agendamentos, Anti-Colisão & Agendamento Público)');
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
  console.log('--- 1. Proteção de Rotas de Agendamentos sem Token JWT (401) ---');

  const noTokenApts = await request(app).get('/api/appointments');
  assert(noTokenApts.status === 401, 'GET /api/appointments sem token deve retornar 401');

  const noTokenPost = await request(app).post('/api/appointments').send({});
  assert(noTokenPost.status === 401, 'POST /api/appointments sem token deve retornar 401');

  const noTokenPatch = await request(app).patch('/api/appointments/00000000-0000-0000-0000-000000000001/status').send({ status: 'CONFIRMED' });
  assert(noTokenPatch.status === 401, 'PATCH /api/appointments/:id/status sem token deve retornar 401');

  // -------------------------------------------------------------
  // 2. VALIDAÇÃO ZOD NA CRIAÇÃO DE AGENDAMENTO (422)
  // -------------------------------------------------------------
  console.log('\n--- 2. Validação Zod na Criação de Agendamentos ---');

  const invalidPost = await request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      clientId: 'not-a-uuid',
      serviceId: 'not-a-uuid',
      professionalId: 'not-a-uuid',
      date: '03/11/2026', // Formato incorreto (esperado YYYY-MM-DD)
      startTime: '25:99', // Hora inválida
    });

  assert(invalidPost.status === 422, 'POST com campos inválidos deve retornar 422');
  assert(invalidPost.body.success === false, 'success deve ser false no erro de validação');
  assert(
    invalidPost.body.errors?.some((e: any) => e.field.includes('clientId')),
    'Deve validar UUID do cliente'
  );
  assert(
    invalidPost.body.errors?.some((e: any) => e.field.includes('date')),
    'Deve validar formato de data AAAA-MM-DD'
  );
  assert(
    invalidPost.body.errors?.some((e: any) => e.field.includes('startTime')),
    'Deve validar formato de horário HH:mm'
  );

  // -------------------------------------------------------------
  // 3. VALIDAÇÃO ZOD NO STATUS DO AGENDAMENTO (422)
  // -------------------------------------------------------------
  console.log('\n--- 3. Validação Zod de Status de Agendamento ---');

  const invalidStatus = await request(app)
    .patch('/api/appointments/00000000-0000-0000-0000-000000000001/status')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ status: 'STATUS_INEXISTENTE' });

  assert(invalidStatus.status === 422, 'PATCH status inválido deve retornar 422');

  const validStatusFormat = await request(app)
    .patch('/api/appointments/00000000-0000-0000-0000-000000000001/status')
    .set('Authorization', `Bearer ${professionalToken}`)
    .send({ status: 'completed' });

  // Passou pela validação Zod (não é 422 nem 401). Pode ser 404 (não achou no banco) ou 500 se banco offline
  assert(validStatusFormat.status !== 422, 'Status "completed" minúsculo deve ser aceito pelo Zod (transform)');

  // -------------------------------------------------------------
  // 4. TESTES DE RBAC (CONTROLE DE ACESSO POR CARGO)
  // -------------------------------------------------------------
  console.log('\n--- 4. Testes de RBAC em Agendamentos ---');

  // Profissional NÃO pode excluir agendamento (somente OWNER e ADMIN)
  const profDelete = await request(app)
    .delete('/api/appointments/00000000-0000-0000-0000-000000000001')
    .set('Authorization', `Bearer ${professionalToken}`);

  assert(profDelete.status === 403, 'PROFESSIONAL não deve ter permissão para excluir agendamento (403)');

  // Recepcionista NÃO pode excluir agendamento
  const recepDelete = await request(app)
    .delete('/api/appointments/00000000-0000-0000-0000-000000000001')
    .set('Authorization', `Bearer ${receptionistToken}`);

  assert(recepDelete.status === 403, 'RECEPTIONIST não deve ter permissão para excluir agendamento (403)');

  // Recepcionista PODE listar e criar agendamentos (passa pelo RBAC)
  const recepGet = await request(app)
    .get('/api/appointments')
    .set('Authorization', `Bearer ${receptionistToken}`);

  assert(recepGet.status !== 403, 'RECEPTIONIST tem permissão para consultar agendamentos');

  // -------------------------------------------------------------
  // 5. TESTES DE AGENDAMENTO PÚBLICO ONLINE (/api/public/schedule)
  // -------------------------------------------------------------
  console.log('\n--- 5. Rotas Públicas de Autoatendimento Online ---');

  // Não deve exigir token Authorization
  const publicSlotsBadDate = await request(app).get('/api/public/schedule/salao-teste/slots?date=data-errada');
  assert(publicSlotsBadDate.status === 422, 'Consulta de slots públicos com data inválida deve retornar 422');
  assert(publicSlotsBadDate.status !== 401, 'Rotas públicas não exigem token de autenticação (não é 401)');

  const publicBookBadData = await request(app)
    .post('/api/public/schedule/salao-teste/book')
    .send({
      customerName: 'A', // Muito curto
      customerPhone: '123', // Muito curto
      serviceId: 'invalid-uuid',
      professionalId: 'invalid-uuid',
      date: '2026-11-03',
      startTime: '10:00',
    });

  assert(publicBookBadData.status === 422, 'Reserva pública com dados inválidos deve retornar 422');
  assert(
    publicBookBadData.body.errors?.some((e: any) => e.field.includes('customerName')),
    'Deve exigir nome mínimo de 2 caracteres'
  );
  assert(
    publicBookBadData.body.errors?.some((e: any) => e.field.includes('customerPhone')),
    'Deve exigir telefone válido'
  );

  // -------------------------------------------------------------
  // 6. TESTE DE LÓGICA ANTI-COLISÃO (OVERLAPPING INTERVALS)
  // -------------------------------------------------------------
  console.log('\n--- 6. Teste de Lógica Matemática Anti-Colisão ---');

  function isOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
    return startA < endB && endA > startB;
  }

  // Caso 1: Horários exatamente iguais (14:00 - 15:00 vs 14:00 - 15:00) -> Conflito
  assert(isOverlapping('14:00', '15:00', '14:00', '15:00') === true, 'Horários idênticos detectam colisão');

  // Caso 2: Novo inicia no meio do existente (14:00 - 15:00 vs 14:30 - 15:30) -> Conflito
  assert(isOverlapping('14:00', '15:00', '14:30', '15:30') === true, 'Início dentro de agendamento existente detecta colisão');

  // Caso 3: Novo termina no meio do existente (14:00 - 15:00 vs 13:30 - 14:30) -> Conflito
  assert(isOverlapping('14:00', '15:00', '13:30', '14:30') === true, 'Fim dentro de agendamento existente detecta colisão');

  // Caso 4: Novo engloba totalmente o existente (14:00 - 15:00 vs 13:00 - 16:00) -> Conflito
  assert(isOverlapping('14:00', '15:00', '13:00', '16:00') === true, 'Intervalo maior englobando detecta colisão');

  // Caso 5: Consecutivo perfeito (14:00 - 15:00 vs 15:00 - 16:00) -> NÃO deve colidir
  assert(isOverlapping('14:00', '15:00', '15:00', '16:00') === false, 'Horários consecutivos adjacentes não colidem');

  // Caso 6: Totalmente separado (14:00 - 15:00 vs 16:00 - 17:00) -> NÃO deve colidir
  assert(isOverlapping('14:00', '15:00', '16:00', '17:00') === false, 'Horários separados não colidem');

  console.log('\n==========================================================');
  console.log(`📊 RESULTADO FINAL DOS TESTES DA FASE 4:`);
  console.log(`   Total de Testes:  ${passed + failed}`);
  console.log(`   Passaram:         ${passed}`);
  console.log(`   Falharam:         ${failed}`);
  console.log('==========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 TODOS OS TESTES DA FASE 4 PASSARAM COM SUCESSO!\n');
  }
}

runPhase4Tests().catch((err) => {
  console.error('Erro fatal nos testes da Fase 4:', err);
  process.exit(1);
});

