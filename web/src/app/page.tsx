import { redirect } from 'next/navigation';
import { destinoPorPapel, papelEfetivo } from '@/lib/auth/destino';
import { obterSessao } from '@/lib/supabase/servidor';

// Raiz: manda cada usuário para a rota do seu papel, lido do banco
export default async function Inicio() {
  const sessao = await obterSessao();
  if (!sessao) redirect('/login');

  redirect(destinoPorPapel(papelEfetivo(sessao.perfil)));
}
