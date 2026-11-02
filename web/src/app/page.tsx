import { redirect } from 'next/navigation';
import { destinoPorPapel, papelEfetivo } from '@/lib/auth/destino';
import { obterSessao } from '@/lib/supabase/servidor';

// Depende da sessão e das variáveis do Supabase: nunca pré-renderizar no build
export const dynamic = 'force-dynamic';

// Raiz: manda cada usuário para a rota do seu papel, lido do banco
export default async function Inicio() {
  const sessao = await obterSessao();
  if (!sessao) redirect('/login');

  redirect(destinoPorPapel(papelEfetivo(sessao.perfil)));
}
