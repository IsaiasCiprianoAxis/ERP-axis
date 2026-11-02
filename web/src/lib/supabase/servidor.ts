import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { Database } from '../../../../supabase/database.types';
import { configSupabase } from './config';

type Perfil = Pick<Database['public']['Tables']['perfis']['Row'], 'papel' | 'ativo' | 'nome_completo'>;

export type Sessao = {
  usuarioId: string;
  // null se o usuário não tiver perfil
  perfil: Perfil | null;
};

// Cliente para Server Components, Server Actions e Route Handlers
export async function criarClienteServidor() {
  const { url, chaveAnon } = configSupabase();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, chaveAnon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          cookiesParaGravar.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components não podem gravar cookies; quem renova a sessão é o proxy
        }
      },
    },
  });
}

type ClienteServidor = Awaited<ReturnType<typeof criarClienteServidor>>;

// Usuário logado e o perfil dele, lidos no servidor a cada requisição.
// cache() só evita repetir a consulta na mesma requisição.
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  return consultarSessao(await criarClienteServidor());
});

// getUser() valida o token no servidor do Auth (getSession() só leria o cookie,
// sem validar). O perfil vem de public.perfis (fonte da verdade), sob RLS.
// Exportada para a Server Action de login, que consulta logo após o
// signInWithPassword usando o mesmo cliente.
export async function consultarSessao(supabase: ClienteServidor): Promise<Sessao | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil, error } = await supabase
    .from('perfis')
    .select('papel, ativo, nome_completo')
    .eq('id', user.id)
    .maybeSingle();
  // Sem detalhes na mensagem: o erro pode carregar dados do perfil (LGPD)
  if (error) throw new Error('Falha ao consultar o perfil do usuário');

  return { usuarioId: user.id, perfil };
}
