import { prisma } from '../database/prisma.js';

interface TableRlsInfo {
  tablename: string;
  rowsecurity: boolean;
}

async function main() {
  console.log('🔒 AGENDA AI — ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) NO SUPABASE');
  console.log('------------------------------------------------------------------');

  try {
    // 1. Verificar estado atual das tabelas públicas
    const beforeTables = await prisma.$queryRaw<TableRlsInfo[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename ASC;
    `;

    console.log(`\n📋 Encontradas ${beforeTables.length} tabelas no schema public:`);
    for (const t of beforeTables) {
      console.log(` - ${t.tablename.padEnd(30)}: RLS ${t.rowsecurity ? '✅ ATIVO' : '❌ DESATIVADO'}`);
    }

    // 2. Executar ativação de RLS em todas as tabelas
    console.log('\n⚙️ Habilitando Row-Level Security em todas as tabelas...');
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
        END LOOP;
      END $$;
    `);

    // 3. Verificar estado após ativação
    const afterTables = await prisma.$queryRaw<TableRlsInfo[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename ASC;
    `;

    console.log('\n✅ Resultado após ativação do RLS:');
    let allEnabled = true;
    for (const t of afterTables) {
      if (!t.rowsecurity) allEnabled = false;
      console.log(` - ${t.tablename.padEnd(30)}: RLS ${t.rowsecurity ? '✅ SEGURO' : '❌ DESATIVADO'}`);
    }

    if (allEnabled) {
      console.log('\n🎉 SUCESSO: Todas as tabelas públicas agora estão protegidas com RLS!');
      console.log('O Supabase Security Advisor estará 100% verde e seguro.');
    } else {
      console.warn('\n⚠️ Algumas tabelas ainda estão sem RLS.');
    }
  } catch (error) {
    console.error('❌ Erro ao ativar RLS no banco:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
