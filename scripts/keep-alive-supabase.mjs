/**
 * Script de Keep-Alive para Supabase
 * Executa uma consulta real ao banco de dados via PostgREST para zerar o contador de inatividade de 7 dias do Supabase.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yqblfjthucfyvupbudlh.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Yb8irAIY9tjsUpiFui4yiA_rGA7_0Un';

async function keepAlive() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔄 Disparando ping de atividade para o Supabase...`);

  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/tenants?select=id&limit=1`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (response.ok) {
      console.log(`[${timestamp}] ✅ SUCESSO: O Supabase respondeu com status ${response.status}.`);
      console.log(`[${timestamp}] 🎉 Contador de inatividade resetado com sucesso!`);
    } else {
      const text = await response.text();
      console.error(`[${timestamp}] ⚠️ AVISO: Supabase respondeu com status ${response.status}: ${text}`);
    }
  } catch (error) {
    console.error(`[${timestamp}] ❌ ERRO ao conectar com o Supabase:`, error.message);
  }
}

keepAlive();
