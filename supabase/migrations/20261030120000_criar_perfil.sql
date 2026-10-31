-- Migration: criação de perfil explícita (Fase 0)
-- O trigger ao_criar_usuario_criar_perfil não funcionava com
-- auth.admin.createUser: o papel em app_metadata não está disponível
-- quando o trigger roda, e a criação falhava com "Papel ausente ou inválido".
-- Decisão (opção A): o fluxo de cadastro do admin (service role) cria o
-- usuário no Auth e depois chama public.criar_perfil.
-- Usuário sem perfil não tem papel: papel_atual(), papel_do_usuario() e o
-- claim user_role retornam null, e o RLS nega tudo.

drop trigger ao_criar_usuario_criar_perfil on auth.users;
drop function public.criar_perfil_novo_usuario();

-- Cria o perfil de um usuário já existente em auth.users.
-- Erros vêm das próprias restrições da tabela:
--   usuário inexistente    -> 23503 (FK para auth.users)
--   perfil já existente    -> 23505 (PK)
--   papel nulo             -> 23502 (not null)
--   nome/telefone longos   -> 23514 (checks de tamanho)
-- Papel inválido nem chega aqui: a conversão para o enum falha antes (22P02).
create function public.criar_perfil(
  p_user_id  uuid,
  p_papel    public.papel_usuario,
  p_nome     text,
  p_telefone text
)
returns public.perfis
language sql
security definer
set search_path = ''
as $$
  insert into public.perfis (id, papel, nome_completo, telefone)
  values (p_user_id, p_papel, coalesce(p_nome, ''), p_telefone)
  returning *
$$;

-- Só o service role cria perfis (não fica exposta como RPC para clientes).
-- O Supabase concede EXECUTE em funções novas a anon/authenticated por padrão.
revoke execute on function public.criar_perfil(uuid, public.papel_usuario, text, text)
  from public, anon, authenticated;
grant execute on function public.criar_perfil(uuid, public.papel_usuario, text, text)
  to service_role;

comment on column public.perfis.papel is
  'Definido na criação por public.criar_perfil (service role); só admin ou service role alteram.';
