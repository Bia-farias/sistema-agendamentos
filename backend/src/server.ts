import { app } from './app.js';
import { env } from './config/env.js';
import { testDatabaseConnection } from './database/prisma.js';

const PORT = env.PORT || 3001;

async function bootstrap() {
  console.log('---------------------------------------------------------');
  console.log('🚀 INICIANDO SERVIDOR DO BACKEND — AGENDA AI');
  console.log('---------------------------------------------------------');
  console.log(`Ambiente:        ${env.NODE_ENV}`);
  console.log(`Porta:           ${PORT}`);
  console.log(`CORS Permitido:  ${env.FRONTEND_URL}`);

  const isDbConnected = await testDatabaseConnection();
  if (isDbConnected) {
    console.log('✅ Banco de Dados: Conectado com sucesso via Prisma!');
  } else {
    console.warn('⚠️ Banco de Dados: Não foi possível conectar ao PostgreSQL.');
    console.warn('👉 Verifique a DATABASE_URL no arquivo backend/.env');
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🎉 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`👉 Health check:        http://localhost:${PORT}/api/health`);
    console.log(`👉 Autenticação:        http://localhost:${PORT}/api/auth/register`);
    console.log(`👉 Login:               http://localhost:${PORT}/api/auth/login`);
    console.log(`👉 Perfil (Me):         http://localhost:${PORT}/api/auth/me`);
    console.log('---------------------------------------------------------\n');
  });

  const handleShutdown = () => {
    console.log('\n🛑 Encerrando servidor com segurança...');
    server.close(() => {
      console.log('Servidor finalizado.');
      process.exit(0);
    });
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}

bootstrap().catch((err) => {
  console.error('❌ Erro fatal ao iniciar o servidor:', err);
  process.exit(1);
});
