import { redirect } from 'next/navigation';
import { obterSessao } from '@/lib/supabase/servidor';
import { sair } from '../login/actions';

// Profissional e familiar usam o app mobile; a web é só para o admin.
// Esta página nunca redireciona quem está logado, para não criar loop.
export default async function UseOAplicativo() {
  const sessao = await obterSessao();
  if (!sessao) redirect('/login');

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Use o aplicativo</h1>
      <p className="text-slate-600">
        O acesso de profissionais e familiares é feito pelo aplicativo Home Care OS no celular.
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
