// URL e chave anon do Supabase. O acesso a process.env precisa ser literal
// para o Next embutir as variáveis NEXT_PUBLIC_ no bundle do navegador.
// A service role nunca é lida no web/.
function exigir(nome: string, valor: string | undefined): string {
  if (!valor) throw new Error(`Variável ${nome} ausente no .env.local do web/`);
  return valor;
}

export function configSupabase(): { url: string; chaveAnon: string } {
  return {
    url: exigir('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    chaveAnon: exigir('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}
