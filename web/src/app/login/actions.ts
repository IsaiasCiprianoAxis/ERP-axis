'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { destinoPorPapel, papelEfetivo } from '@/lib/auth/destino';
import { consultarSessao, criarClienteServidor } from '@/lib/supabase/servidor';

export async function entrar(formData: FormData) {
  const email = formData.get('email');
  const senha = formData.get('senha');
  if (typeof email !== 'string' || typeof senha !== 'string' || !email || !senha) {
    redirect('/login?erro=1');
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  // Mensagem genérica: não revelar se o e-mail existe
  if (error) redirect('/login?erro=1');

  // Destino decidido pelo banco (perfil ativo), nunca pelo claim user_role
  const sessao = await consultarSessao(supabase);
  const papel = papelEfetivo(sessao?.perfil);
  if (papel) redirect(destinoPorPapel(papel));

  // Sem papel efetivo: não redireciona. A /login é renderizada de novo, já
  // com a sessão, e mostra "acesso negado".
  revalidatePath('/login');
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect('/login');
}
