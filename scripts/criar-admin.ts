// Cria o primeiro admin: usuário no Auth + perfil via public.criar_perfil.
//
// ATENÇÃO: usa a SERVICE ROLE (ignora o RLS). Só roda localmente, na máquina
// do desenvolvedor; nunca em CI, no web/ ou no mobile/.
//
// Uso: npm run admin:criar -- <email> "<nome completo>"
// A senha é pedida no terminal, sem eco (não vai para o histórico do shell).
// Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local da raiz.
import { createClient } from '@supabase/supabase-js';

const SENHA_MINIMA = 12;

function abortar(mensagem: string): never {
  console.error(`Erro: ${mensagem}`);
  process.exit(1);
}

function env(nome: string): string {
  const valor = process.env[nome];
  if (!valor) abortar(`variável ${nome} ausente no .env.local`);
  return valor;
}

// Lê uma linha do terminal sem mostrar o que é digitado
function perguntarSenha(pergunta: string): Promise<string> {
  const { stdin, stdout } = process;
  if (!stdin.isTTY) abortar('rode em um terminal interativo (a senha é digitada sem eco)');

  stdout.write(pergunta);
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');
  stdin.resume();

  return new Promise((resolve, reject) => {
    let senha = '';

    const encerrar = () => {
      stdin.off('data', aoDigitar);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
    };

    function aoDigitar(teclas: string) {
      for (const tecla of teclas) {
        if (tecla === '\r' || tecla === '\n') {
          encerrar();
          resolve(senha);
          return;
        }
        if (tecla === '\u0003') {
          // Ctrl+C
          encerrar();
          reject(new Error('cancelado pelo usuário'));
          return;
        }
        if (tecla === '\u007f' || tecla === '\b') {
          senha = senha.slice(0, -1);
        } else {
          senha += tecla;
        }
      }
    }

    stdin.on('data', aoDigitar);
  });
}

async function main() {
  if (process.env.CI) abortar('este script não roda em CI (usa a service role)');

  const [email, nome] = process.argv.slice(2);
  if (!email || !nome) abortar('uso: npm run admin:criar -- <email> "<nome completo>"');

  const url = env('SUPABASE_URL');
  const chaveServico = env('SUPABASE_SERVICE_ROLE_KEY');

  const senha = await perguntarSenha('Senha do admin: ');
  if (senha.length < SENHA_MINIMA) abortar(`a senha precisa ter pelo menos ${SENHA_MINIMA} caracteres`);
  const confirmacao = await perguntarSenha('Confirme a senha: ');
  if (senha !== confirmacao) abortar('as senhas não conferem');

  const servico = createClient(url, chaveServico, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // E-mail já cadastrado: o Auth recusa com o código email_exists e nada é alterado
  const { data: criado, error: erroCriacao } = await servico.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (erroCriacao?.code === 'email_exists') abortar('já existe um usuário com este e-mail; nada foi alterado');
  if (erroCriacao || !criado.user) abortar(`falha ao criar o usuário no Auth: ${erroCriacao?.message}`);

  const usuarioId = criado.user.id;

  const { error: erroPerfil } = await servico.rpc('criar_perfil', {
    p_user_id: usuarioId,
    p_papel: 'admin',
    p_nome: nome,
    p_telefone: null,
  });

  if (erroPerfil) {
    // Desfaz a criação para não deixar usuário sem perfil
    const { error: erroExclusao } = await servico.auth.admin.deleteUser(usuarioId);
    if (erroExclusao) {
      abortar(
        `falha ao criar o perfil (${erroPerfil.message}) e também ao apagar o usuário ${usuarioId} ` +
          `(${erroExclusao.message}); apague-o manualmente no painel do Supabase`,
      );
    }
    abortar(`falha ao criar o perfil (${erroPerfil.message}); o usuário foi apagado`);
  }

  // Só o id e o e-mail: nunca a senha nem a chave
  process.stdout.write(`Admin criado: id=${usuarioId} email=${email}\n`);
}

main().catch((erro: unknown) => {
  abortar(erro instanceof Error ? erro.message : 'erro inesperado');
});
