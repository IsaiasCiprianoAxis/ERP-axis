import { redirect } from 'next/navigation';
import { papelEfetivo } from '@/lib/auth/destino';
import { obterSessao } from '@/lib/supabase/servidor';
import { entrar, sair } from './actions';

// Depende da sessão e das variáveis do Supabase: nunca pré-renderizar no build
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ erro?: string | string[] }>;
};

export default async function Login({ searchParams }: Props) {
  const sessao = await obterSessao();

  if (sessao) {
    // Decide só pelo banco (perfil ativo), nunca pelo claim user_role, que
    // pode estar desatualizado e criaria loop com o proxy
    const papel = papelEfetivo(sessao.perfil);
    if (papel === 'admin') redirect('/admin');
    if (papel === 'profissional' || papel === 'familiar') redirect('/use-o-aplicativo');

    // Sessão sem papel efetivo (sem perfil ou inativo): mostra o aviso e NÃO
    // redireciona
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold">Acesso negado</h1>
        <p className="text-slate-600">
          Sua conta não tem acesso a este sistema. Procure a administração.
        </p>
        <form action={sair}>
          <button
            type="submit"
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-100"
          >
            Sair
          </button>
        </form>
      </main>
    );
  }

  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Home Care OS</h1>
      <form action={entrar} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">E-mail</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Senha</span>
          <input
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
          />
        </label>
        {erro && (
          <p role="alert" className="text-sm text-red-700">
            E-mail ou senha inválidos.
          </p>
        )}
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
