import { type NextRequest, NextResponse } from 'next/server';
import { destinoPorPapel, papelDoClaim } from '@/lib/auth/destino';
import { atualizarSessao, type ResultadoSessao } from '@/lib/supabase/sessao';

// Proxy (antigo middleware): renova a sessão em toda requisição e faz só o
// roteamento. O claim user_role é um cache do papel e pode estar desatualizado
// até o token ser renovado; a barreira real é o admin/layout.tsx, que consulta
// public.perfis no servidor.
export async function proxy(request: NextRequest) {
  const sessao = await atualizarSessao(request);
  const caminho = request.nextUrl.pathname;

  const emAdmin = dentroDe(caminho, '/admin');
  const emApp = dentroDe(caminho, '/use-o-aplicativo');
  if (!emAdmin && !emApp) return sessao.resposta;

  if (!sessao.claims) return redirecionar(request, sessao, '/login');

  if (emAdmin) {
    // Só desvia quem o claim diz ter OUTRO papel válido. Claim null segue para
    // o layout decidir pelo banco: se o perfil acabou de virar admin (token
    // antigo), mandar para /login criaria um loop /login -> /admin -> /login.
    const papel = papelDoClaim(sessao.claims.user_role);
    if (papel !== null && papel !== 'admin') {
      return redirecionar(request, sessao, destinoPorPapel(papel));
    }
  }

  return sessao.resposta;
}

function dentroDe(caminho: string, base: string): boolean {
  return caminho === base || caminho.startsWith(`${base}/`);
}

// Redireciona levando junto os cookies e cabeçalhos de uma sessão renovada
function redirecionar(request: NextRequest, sessao: ResultadoSessao, destino: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = destino;
  url.search = '';

  const redirecionamento = NextResponse.redirect(url);
  sessao.resposta.cookies.getAll().forEach((cookie) => redirecionamento.cookies.set(cookie));
  Object.entries(sessao.cabecalhos).forEach(([chave, valor]) => redirecionamento.headers.set(chave, valor));
  return redirecionamento;
}

export const config = {
  // Tudo, menos arquivos estáticos e imagens
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
