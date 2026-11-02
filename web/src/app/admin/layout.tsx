import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { obterSessao } from '@/lib/supabase/servidor';

// Barreira real do painel: consulta public.perfis no servidor a cada
// requisição (obterSessao) e exige papel admin E perfil ativo. Não usa o claim
// user_role do JWT, que pode estar desatualizado até a renovação do token.
//
// Atenção: na navegação do lado do cliente entre páginas de /admin, o Next
// reaproveita este layout sem executá-lo de novo. Por isso cada página e cada
// Server Action do admin também precisa checar o acesso; o RLS continua sendo
// a proteção dos dados.
export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const sessao = await obterSessao();
  if (!sessao) redirect('/login');

  const { perfil } = sessao;
  if (perfil?.papel !== 'admin' || perfil.ativo !== true) {
    // /login mostra "acesso negado" para quem não tem papel efetivo e manda
    // profissional/familiar ativos para /use-o-aplicativo
    redirect('/login');
  }

  return <>{children}</>;
}
