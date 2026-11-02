import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../../supabase/database.types';
import { configSupabase } from './config';

export type ResultadoSessao = {
  resposta: NextResponse;
  // Cabeçalhos anti-cache que acompanham cookies de sessão novos
  cabecalhos: Record<string, string>;
  // Claims do JWT validado; null se não houver sessão
  claims: Record<string, unknown> | null;
};

// Usado pelo proxy: renova a sessão (grava os cookies novos na requisição e
// na resposta) e devolve os claims do token.
export async function atualizarSessao(request: NextRequest): Promise<ResultadoSessao> {
  const { url, chaveAnon } = configSupabase();
  let resposta = NextResponse.next({ request });
  let cabecalhos: Record<string, string> = {};

  const supabase = createServerClient<Database>(url, chaveAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar, headers) {
        cookiesParaGravar.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        cookiesParaGravar.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
        cabecalhos = headers;
        Object.entries(headers).forEach(([chave, valor]) => resposta.headers.set(chave, valor));
      },
    },
  });

  // Nada entre createServerClient e getClaims: é aqui que o token é renovado
  const { data } = await supabase.auth.getClaims();

  return { resposta, cabecalhos, claims: data?.claims ?? null };
}
