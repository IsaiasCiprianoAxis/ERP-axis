// Testes de integração do RLS de public.perfis contra o projeto Supabase de dev.
// Cria usuários temporários (um por papel) e os apaga ao final.
// Requer SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY no .env.local.
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

type Papel = 'admin' | 'profissional' | 'familiar';
type UsuarioTeste = { id: string; cliente: SupabaseClient };

function env(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável ${nome} ausente no .env.local`);
  return valor;
}

const url = env('SUPABASE_URL');
const chaveAnon = env('SUPABASE_ANON_KEY');
const chaveServico = env('SUPABASE_SERVICE_ROLE_KEY');

const semSessao = { auth: { persistSession: false, autoRefreshToken: false } };
const servico = createClient(url, chaveServico, semSessao);

const execucao = randomUUID().slice(0, 8);
const senha = `Rls-${randomUUID()}`;
const criados: string[] = [];

function emailTeste(rotulo: string): string {
  return `rls-${rotulo}-${execucao}@homecareos.test`;
}

// Cria só o usuário no Auth, sem perfil
async function criarUsuarioAuth(rotulo: string): Promise<string> {
  const { data, error } = await servico.auth.admin.createUser({
    email: emailTeste(rotulo),
    password: senha,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Falha ao criar usuário de teste (${rotulo}): ${error?.message}`);
  }
  criados.push(data.user.id);
  return data.user.id;
}

async function entrar(rotulo: string): Promise<SupabaseClient> {
  const cliente = createClient(url, chaveAnon, semSessao);
  const { error } = await cliente.auth.signInWithPassword({
    email: emailTeste(rotulo),
    password: senha,
  });
  if (error) throw new Error(`Falha no login do usuário de teste (${rotulo}): ${error.message}`);
  return cliente;
}

// Fluxo do admin: cria no Auth, cria o perfil e só então faz login
async function criarUsuario(papel: Papel, rotulo: string = papel): Promise<UsuarioTeste> {
  const id = await criarUsuarioAuth(rotulo);
  const { error } = await servico.rpc('criar_perfil', {
    p_user_id: id,
    p_papel: papel,
    p_nome: `Teste ${rotulo}`,
    p_telefone: null,
  });
  if (error) throw new Error(`Falha ao criar perfil de teste (${rotulo}): ${error.message}`);
  return { id, cliente: await entrar(rotulo) };
}

async function desativar(id: string): Promise<void> {
  const { error } = await servico.from('perfis').update({ ativo: false }).eq('id', id);
  if (error) throw new Error(`Falha ao desativar perfil de teste: ${error.message}`);
}

async function claimsDoToken(cliente: SupabaseClient): Promise<Record<string, unknown>> {
  const { data } = await cliente.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sessão sem access token');
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
}

async function perfilViaServico(id: string) {
  const { data, error } = await servico
    .from('perfis')
    .select('papel, ativo, nome_completo')
    .eq('id', id)
    .single();
  if (error) throw new Error(`Falha ao ler perfil via service role: ${error.message}`);
  return data;
}

let admin: UsuarioTeste;
let profissional: UsuarioTeste;
let familiar: UsuarioTeste;

beforeAll(async () => {
  admin = await criarUsuario('admin');
  profissional = await criarUsuario('profissional');
  familiar = await criarUsuario('familiar');
});

afterAll(async () => {
  for (const id of criados) {
    await servico.auth.admin.deleteUser(id);
  }
});

describe('cadastro e criar_perfil', () => {
  it('criar_perfil grava papel e nome', async () => {
    const perfil = await perfilViaServico(profissional.id);
    expect(perfil.papel).toBe('profissional');
    expect(perfil.nome_completo).toBe('Teste profissional');
  });

  it('rejeita papel inválido', async () => {
    const id = await criarUsuarioAuth('papel-invalido');
    const { error } = await servico.rpc('criar_perfil', {
      p_user_id: id,
      p_papel: 'superadmin',
      p_nome: null,
      p_telefone: null,
    });
    expect(error?.code).toBe('22P02');

    const { data, error: erroLeitura } = await servico.from('perfis').select('id').eq('id', id);
    expect(erroLeitura).toBeNull();
    expect(data).toEqual([]);
  });

  it('usuário sem perfil recebe papel null no claim e na função', async () => {
    const id = await criarUsuarioAuth('sem-perfil');
    const cliente = await entrar('sem-perfil');

    expect((await claimsDoToken(cliente)).user_role).toBeNull();

    const proprio = await cliente.rpc('papel_atual');
    expect(proprio.error).toBeNull();
    expect(proprio.data).toBeNull();

    const viaServico = await servico.rpc('papel_do_usuario', { p_user_id: id });
    expect(viaServico.error).toBeNull();
    expect(viaServico.data).toBeNull();
  });

  it('cliente autenticado não consegue chamar criar_perfil', async () => {
    const { error } = await profissional.cliente.rpc('criar_perfil', {
      p_user_id: profissional.id,
      p_papel: 'admin',
      p_nome: null,
      p_telefone: null,
    });
    expect(error?.code).toBe('42501');
  });

  it('cliente anon não consegue chamar criar_perfil', async () => {
    const anon = createClient(url, chaveAnon, semSessao);
    const { error } = await anon.rpc('criar_perfil', {
      p_user_id: randomUUID(),
      p_papel: 'admin',
      p_nome: null,
      p_telefone: null,
    });
    expect(error?.code).toBe('42501');
  });
});

describe('leitura de perfis', () => {
  it('anon não tem acesso à tabela', async () => {
    const anon = createClient(url, chaveAnon, semSessao);
    const { error } = await anon.from('perfis').select('id');
    expect(error?.code).toBe('42501');
  });

  it('profissional lê apenas o próprio perfil', async () => {
    const { data, error } = await profissional.cliente.from('perfis').select('id');
    expect(error).toBeNull();
    expect(data?.map((p) => p.id)).toEqual([profissional.id]);
  });

  it('familiar lê apenas o próprio perfil', async () => {
    const { data, error } = await familiar.cliente.from('perfis').select('id');
    expect(error).toBeNull();
    expect(data?.map((p) => p.id)).toEqual([familiar.id]);
  });

  it('admin lê todos os perfis', async () => {
    const ids = [admin.id, profissional.id, familiar.id];
    const { data, error } = await admin.cliente.from('perfis').select('id').in('id', ids);
    expect(error).toBeNull();
    expect(data).toHaveLength(3);
  });
});

describe('escrita em perfis', () => {
  it('usuário atualiza o próprio nome', async () => {
    const { data, error } = await profissional.cliente
      .from('perfis')
      .update({ nome_completo: 'Nome Atualizado' })
      .eq('id', profissional.id)
      .select('id');
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('usuário não altera o próprio papel', async () => {
    const { error } = await profissional.cliente
      .from('perfis')
      .update({ papel: 'admin' })
      .eq('id', profissional.id);
    expect(error?.code).toBe('42501');
    expect((await perfilViaServico(profissional.id)).papel).toBe('profissional');
  });

  it('usuário não altera o próprio status ativo', async () => {
    const { error } = await familiar.cliente
      .from('perfis')
      .update({ ativo: false })
      .eq('id', familiar.id);
    expect(error?.code).toBe('42501');
    expect((await perfilViaServico(familiar.id)).ativo).toBe(true);
  });

  it('usuário não atualiza perfil de outra pessoa', async () => {
    const { data, error } = await profissional.cliente
      .from('perfis')
      .update({ nome_completo: 'Alteração indevida' })
      .eq('id', familiar.id)
      .select('id');
    expect(error).toBeNull();
    expect(data).toEqual([]);
    expect((await perfilViaServico(familiar.id)).nome_completo).not.toBe('Alteração indevida');
  });

  it('insert é negado para usuários autenticados', async () => {
    const { error } = await profissional.cliente
      .from('perfis')
      .insert({ id: randomUUID(), papel: 'admin' });
    expect(error?.code).toBe('42501');
  });

  it('delete é negado para usuários autenticados', async () => {
    const { error } = await profissional.cliente.from('perfis').delete().eq('id', profissional.id);
    expect(error?.code).toBe('42501');
  });

  it('admin atualiza o perfil de outra pessoa', async () => {
    const { data, error } = await admin.cliente
      .from('perfis')
      .update({ nome_completo: 'Ajustado pelo admin' })
      .eq('id', familiar.id)
      .select('id');
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});

describe('claim user_role no JWT', () => {
  const usuarios = (): Record<Papel, UsuarioTeste> => ({ admin, profissional, familiar });

  it.each<Papel>(['admin', 'profissional', 'familiar'])('token de %s traz o papel', async (papel) => {
    const claims = await claimsDoToken(usuarios()[papel].cliente);
    expect(claims.user_role).toBe(papel);
  });
});

describe('função papel_do_usuario', () => {
  // Chamada via service role: na migration, EXECUTE é revogado só de
  // public/anon/authenticated; service_role mantém o grant padrão do Supabase.
  async function papelDoUsuario(id: string) {
    return servico.rpc('papel_do_usuario', { p_user_id: id });
  }

  it('retorna o papel de usuário ativo', async () => {
    const { data, error } = await papelDoUsuario(profissional.id);
    expect(error).toBeNull();
    expect(data).toBe('profissional');
  });

  it('retorna null para usuário inativo', async () => {
    const inativo = await criarUsuario('familiar', 'familiar-inativo');
    await desativar(inativo.id);

    const { data, error } = await papelDoUsuario(inativo.id);
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('retorna null para id inexistente', async () => {
    const { data, error } = await papelDoUsuario(randomUUID());
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('cliente autenticado não consegue chamar a função', async () => {
    const { data, error } = await profissional.cliente.rpc('papel_do_usuario', {
      p_user_id: admin.id,
    });
    expect(data).toBeNull();
    expect(error?.code).toBe('42501');
  });

  it('cliente anon não consegue chamar a função', async () => {
    const anon = createClient(url, chaveAnon, semSessao);
    const { data, error } = await anon.rpc('papel_do_usuario', { p_user_id: admin.id });
    expect(data).toBeNull();
    expect(error?.code).toBe('42501');
  });
});

describe('usuário inativo', () => {
  it('admin desativado perde a leitura geral e o claim', async () => {
    const inativo = await criarUsuario('admin', 'admin-inativo');
    await desativar(inativo.id);

    const ids = [inativo.id, profissional.id, familiar.id];
    const { data } = await inativo.cliente.from('perfis').select('id').in('id', ids);
    expect(data?.map((p) => p.id)).toEqual([inativo.id]);

    // Novo login para emitir um token novo, já sem o papel
    const { error: erroLogin } = await inativo.cliente.auth.signInWithPassword({
      email: emailTeste('admin-inativo'),
      password: senha,
    });
    expect(erroLogin).toBeNull();
    expect((await claimsDoToken(inativo.cliente)).user_role).toBeNull();
  });
});
