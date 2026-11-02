import { redirect } from 'next/navigation';
import { obterSessao } from '@/lib/supabase/servidor';
import { sair } from '../login/actions';

export default async function PainelAdmin() {
  // Mesma checagem do layout (ver o aviso em admin/layout.tsx)
  const sessao = await obterSessao();
  const perfil = sessao?.perfil;
  if (perfil?.papel !== 'admin' || perfil.ativo !== true) redirect('/login');

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Painel administrativo</h1>
        <form action={sair}>
          <button
            type="submit"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-100"
          >
            Sair
          </button>
        </form>
      </header>
      <p>Olá, {perfil.nome_completo || 'administrador'}.</p>
      <p className="text-slate-600">As funcionalidades do painel chegam nas próximas etapas.</p>
    </main>
  );
}
