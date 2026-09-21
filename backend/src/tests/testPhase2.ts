import request from 'supertest';
import { app } from '../app.js';
import { generateToken } from '../utils/jwt.js';

async function runPhase2Tests() {
  console.log('==========================================================');
  console.log('🧪 INICIANDO TESTES DA FASE 2 — BACKEND AGENDA AI');
  console.log('   (Módulos: Clientes, Serviços e Profissionais)');
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

  // Tokens simulados para testes de autenticação e RBAC
  const superAdminToken = generateToken({
    userId: 'mock-user-super-1',
    tenantId: 'mock-tenant-alpha',
    role: 'SUPER_ADMIN',
    email: 'super@salao.com',
  });

  const adminToken = generateToken({
    userId: 'mock-user-admin-1',
    tenantId: 'mock-tenant-alpha',
    role: 'ADMIN',
    email: 'admin@salao.com',
  });

  const ownerToken = generateToken({
    userId: 'mock-user-owner-1',
    tenantId: 'mock-tenant-alpha',
    role: 'OWNER',
    email: 'proprietario@salao.com',
  });

  const receptionistToken = generateToken({
    userId: 'mock-user-recep-2',
    tenantId: 'mock-tenant-alpha',
    role: 'RECEPTIONIST',
    email: 'recepcao@salao.com',
  });

  // -------------------------------------------------------------
  // 1. TESTES DE PROTEÇÃO POR JWT (401 SEM TOKEN)
  // -------------------------------------------------------------
  console.log('--- 1. Proteção de Rotas sem Token JWT (401 Unauthorized) ---');

  const noTokenClients = await request(app).get('/api/clients');
  assert(noTokenClients.status === 401, 'GET /api/clients sem token deve retornar 401');

  const noTokenServices = await request(app).get('/api/services');
  assert(noTokenServices.status === 401, 'GET /api/services sem token deve retornar 401');

  const noTokenProfessionals = await request(app).get('/api/professionals');
  assert(noTokenProfessionals.status === 401, 'GET /api/professionals sem token deve retornar 401');

  // -------------------------------------------------------------
  // 2. TESTES DE VALIDAÇÃO ZOD DE CLIENTES (422)
  // -------------------------------------------------------------
  console.log('\n--- 2. Validação Zod no Módulo Clientes ---');

  const invalidClient = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      name: 'A', // Muito curto (min 2)
      phone: '123', // Muito curto (min 8)
      email: 'email_invalido',
    });

  assert(invalidClient.status === 422, 'POST /api/clients com dados inválidos deve retornar 422');
  assert(invalidClient.body.success === false, 'success deve ser false no erro de validação');
  assert(
    invalidClient.body.errors.some((e: any) => e.field.includes('name')),
    'Deve validar tamanho mínimo do nome'
  );
  assert(
    invalidClient.body.errors.some((e: any) => e.field.includes('phone')),
    'Deve validar tamanho mínimo do telefone'
  );
  assert(
    invalidClient.body.errors.some((e: any) => e.field.includes('email')),
    'Deve validar formato de e-mail do cliente'
  );

  const invalidClientId = await request(app)
    .get('/api/clients/nao-e-uuid')
    .set('Authorization', `Bearer ${ownerToken}`);
  assert(invalidClientId.status === 422, 'GET /api/clients/:id com ID inválido deve retornar 422');

  // -------------------------------------------------------------
  // 3. TESTES DE VALIDAÇÃO ZOD DE SERVIÇOS (422)
  // -------------------------------------------------------------
  console.log('\n--- 3. Validação Zod no Módulo Serviços ---');

  const invalidService = await request(app)
    .post('/api/services')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      name: '',
      price: -50, // Negativo
      durationMinutes: 2, // Menor que 5 min
    });

  assert(invalidService.status === 422, 'POST /api/services com dados inválidos deve retornar 422');
  assert(
    invalidService.body.errors.some((e: any) => e.field.includes('name')),
    'Deve exigir nome do serviço com tamanho mínimo'
  );
  assert(
    invalidService.body.errors.some((e: any) => e.field.includes('price')),
    'Deve rejeitar preço negativo'
  );
  assert(
    invalidService.body.errors.some((e: any) => e.field.includes('durationMinutes')),
    'Deve exigir duração mínima de 5 minutos'
  );

  // -------------------------------------------------------------
  // 4. TESTES DE VALIDAÇÃO ZOD DE PROFISSIONAIS (422)
  // -------------------------------------------------------------
  console.log('\n--- 4. Validação Zod no Módulo Profissionais ---');

  const invalidProfessional = await request(app)
    .post('/api/professionals')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({
      name: 'X',
      commissionPercentage: 150, // Mais de 100%
      workingHoursStart: '25:99', // Horário inválido
    });

  assert(invalidProfessional.status === 422, 'POST /api/professionals com dados inválidos deve retornar 422');
  assert(
    invalidProfessional.body.errors.some((e: any) => e.field.includes('commissionPercentage')),
    'Deve rejeitar comissão maior que 100%'
  );
  assert(
    invalidProfessional.body.errors.some((e: any) => e.field.includes('workingHoursStart')),
    'Deve rejeitar formato de hora inválido'
  );

  // -------------------------------------------------------------
  // 5. TESTES DE RBAC (CONTROLE DE ACESSO POR CARGO)
  // -------------------------------------------------------------
  console.log('\n--- 5. Testes de RBAC (Permissões de Acesso por Cargo) ---');

  // Recepcionista tentando criar serviço (apenas OWNER e ADMIN podem)
  const recepCreateService = await request(app)
    .post('/api/services')
    .set('Authorization', `Bearer ${receptionistToken}`)
    .send({
      name: 'Corte Tradicional',
      price: 60,
      durationMinutes: 30,
    });
  assert(
    recepCreateService.status === 403,
    'RECEPTIONIST não deve ter permissão para criar serviço (403)'
  );
  assert(
    recepCreateService.body.message.includes('Acesso negado'),
    'Mensagem deve indicar permissão insuficiente'
  );

  // Recepcionista tentando criar profissional na equipe
  const recepCreateProf = await request(app)
    .post('/api/professionals')
    .set('Authorization', `Bearer ${receptionistToken}`)
    .send({
      name: 'Novo Barbeiro',
      role: 'Barbeiro',
    });
  assert(
    recepCreateProf.status === 403,
    'RECEPTIONIST não deve ter permissão para criar profissional (403)'
  );

  // Super Admin com dados inválidos passa pelo RBAC (retorna 422 de validação Zod, não 403)
  const superAdminCheck = await request(app)
    .post('/api/services')
    .set('Authorization', `Bearer ${superAdminToken}`)
    .send({});
  assert(
    superAdminCheck.status === 422,
    'SUPER_ADMIN possui permissão de acesso ao módulo de serviços (passa pelo RBAC com sucesso)'
  );

  // Admin com dados inválidos passa pelo RBAC (retorna 422 de validação Zod, não 403)
  const adminCheck = await request(app)
    .post('/api/professionals')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({});
  assert(
    adminCheck.status === 422,
    'ADMIN possui permissão de acesso ao módulo de profissionais (passa pelo RBAC com sucesso)'
  );

  // Relatório Final
  console.log('\n==========================================================');
  console.log(`📊 RESULTADO FINAL DOS TESTES DA FASE 2:`);
  console.log(`   Total de Testes:  ${passed + failed}`);
  console.log(`   Passaram:         ${passed}`);
  console.log(`   Falharam:         ${failed}`);
  console.log('==========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 TODOS OS TESTES DA FASE 2 PASSARAM COM SUCESSO!\n');
    process.exit(0);
  }
}

runPhase2Tests().catch((err) => {
  console.error('Erro na execução da suíte de testes da Fase 2:', err);
  process.exit(1);
});
