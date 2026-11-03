import request from 'supertest';
import { app } from '../app.js';
import { generateToken } from '../utils/jwt.js';
import { sanitizeForLGPD } from '../services/aiService.js';

async function runPhase6Tests() {
  console.log('==========================================================');
  console.log('🧪 INICIANDO TESTES DA FASE 6 — BACKEND AGENDA AI');
  console.log('   (Módulos: Segurança RBAC & Proteção LGPD na IA)');
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

  // Token para testes
  const userToken = generateToken({
    userId: 'mock-user-ai-1',
    tenantId: 'mock-tenant-alpha',
    role: 'ADMIN',
    email: 'admin@salao.com',
  });

  // -------------------------------------------------------------
  // 1. PROTEÇÃO DE ROTAS SEM TOKEN JWT (401)
  // -------------------------------------------------------------
  console.log('--- 1. Proteção de Rotas de IA sem Token JWT (401) ---');

  const noTokenRes = await request(app).post('/api/ai/chat').send({
    messages: [{ role: 'user', content: 'Qual o faturamento de hoje?' }],
  });
  assert(noTokenRes.status === 401, 'POST /api/ai/chat sem token deve retornar 401');
  assert(noTokenRes.body.success === false, 'success deve ser false');

  // -------------------------------------------------------------
  // 2. VALIDAÇÃO ZOD NO PAYLOAD DE IA (422)
  // -------------------------------------------------------------
  console.log('\n--- 2. Validação Zod no Endpoint de IA ---');

  const emptyMessagesRes = await request(app)
    .post('/api/ai/chat')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      messages: [],
    });
  assert(emptyMessagesRes.status === 422, 'POST /api/ai/chat com lista vazia deve retornar 422');

  const invalidRoleRes = await request(app)
    .post('/api/ai/chat')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      messages: [{ role: 'hacker', content: 'Injeção de prompt' }],
    });
  assert(invalidRoleRes.status === 422, 'POST /api/ai/chat com role inválido deve retornar 422');

  const emptyContentRes = await request(app)
    .post('/api/ai/chat')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      messages: [{ role: 'user', content: '' }],
    });
  assert(emptyContentRes.status === 422, 'POST /api/ai/chat com mensagem vazia deve retornar 422');

  // -------------------------------------------------------------
  // 3. SANITIZAÇÃO ATIVA LGPD (PROTEÇÃO DE DADOS SENSÍVEIS)
  // -------------------------------------------------------------
  console.log('\n--- 3. Proteção e Higienização LGPD ---');

  const rawPhoneText = 'O telefone da cliente Maria é (11) 98765-4321 e de João é 21 99999-8888.';
  const sanitizedPhone = sanitizeForLGPD(rawPhoneText);
  assert(
    !sanitizedPhone.includes('98765-4321') && !sanitizedPhone.includes('99999-8888'),
    'Telefones devem ser completamente mascarados para conformidade com a LGPD'
  );
  assert(
    sanitizedPhone.includes('[TELEFONE OCULTO LGPD]'),
    'Deve inserir tag de proteção LGPD para telefones'
  );

  const rawCpfText = 'O documento do fornecedor é 123.456.789-00 registrado.';
  const sanitizedCpf = sanitizeForLGPD(rawCpfText);
  assert(
    !sanitizedCpf.includes('123.456.789-00'),
    'CPFs devem ser mascarados para conformidade com a LGPD'
  );
  assert(
    sanitizedCpf.includes('[DOCUMENTO OCULTO LGPD]'),
    'Deve inserir tag de proteção LGPD para documentos'
  );

  // -------------------------------------------------------------
  // 4. PROCESSAMENTO COM SUCESSO DE CHAT IA (200)
  // -------------------------------------------------------------
  console.log('\n--- 4. Processamento Seguro de Chat com IA ---');

  const validChatRes = await request(app)
    .post('/api/ai/chat')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      messages: [
        {
          role: 'user',
          content: 'Qual a previsão dos agendamentos para o cliente com telefone (11) 98888-7777?',
        },
      ],
      systemPrompt: 'Você é o assistente IA. Dados do cliente: CPF 111.222.333-44.',
    });

  assert(validChatRes.status === 200, 'POST /api/ai/chat autenticado deve retornar 200');
  assert(validChatRes.body.success === true, 'success deve ser true na resposta');
  assert(
    typeof validChatRes.body.data?.reply === 'string' && validChatRes.body.data.reply.length > 0,
    'Deve retornar texto da resposta da IA'
  );

  console.log('\n==========================================================');
  console.log(`📊 RESULTADO FINAL DOS TESTES DA FASE 6:`);
  console.log(`   Total de Testes:  ${passed + failed}`);
  console.log(`   Passaram:         ${passed}`);
  console.log(`   Falharam:         ${failed}`);
  console.log('==========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 TODOS OS TESTES DA FASE 6 PASSARAM COM SUCESSO!\n');
  }
}

runPhase6Tests().catch((err) => {
  console.error('Erro fatal nos testes da Fase 6:', err);
  process.exit(1);
});

