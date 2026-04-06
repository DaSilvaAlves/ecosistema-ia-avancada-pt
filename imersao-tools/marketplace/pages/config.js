// ═══════════════════════════════════════════════
// CONFIGURAÇÃO SUPABASE — [IA] MARKETPLACE
// Partilha as mesmas credenciais da comunidade
// ═══════════════════════════════════════════════

const SUPABASE_URL  = 'https://hpqowjelvtejbutyvojo.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcW93amVsdnRlamJ1dHl2b2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzcyNjEsImV4cCI6MjA4NzU1MzI2MX0.045EKU7I7A6Reap0qiVcNXbXuvElmOnjO7lLMwnwluw';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// Redireciona se não houver sessão
async function requireAuth(redirectTo = 'index.html') {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = redirectTo; return null; }
  return session;
}

// Vai buscar o perfil do utilizador
async function getProfile(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data;
}
