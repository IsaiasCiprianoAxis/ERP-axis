-- Migration: perfis de usuário e papéis (Fase 0)
-- Cria o enum de papéis, a tabela public.perfis (1:1 com auth.users),
-- o trigger que cria o perfil no cadastro e a função papel_atual().
-- As políticas de RLS estão na migration seguinte. O RLS já é habilitado
-- aqui para que a tabela nunca exista sem proteção (sem política = nega tudo).

create type public.papel_usuario as enum ('admin', 'profissional', 'familiar');

create table public.perfis (
  id            uuid primary key references auth.users (id) on delete cascade,
  papel         public.papel_usuario not null,
  nome_completo text not null default '',
  telefone      text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint perfis_nome_completo_tamanho check (char_length(nome_completo) <= 200),
  constraint perfis_telefone_tamanho check (telefone is null or char_length(telefone) <= 30)
);

comment on table public.perfis is
  'Perfil 1:1 com auth.users. Fonte da verdade do papel do usuário.';
comment on column public.perfis.papel is
  'Definido na criação a partir de app_metadata.papel; só admin ou service role alteram.';

alter table public.perfis enable row level security;

-- Mantém atualizado_em em dia
create function public.definir_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger perfis_definir_atualizado_em
  before update on public.perfis
  for each row execute function public.definir_atualizado_em();

-- Cria o perfil quando um usuário é criado no Auth.
-- O papel vem de raw_app_meta_data (só o service role grava),
-- nunca de raw_user_meta_data, que o próprio usuário pode editar.
-- Sem papel válido, a criação do usuário falha.
create function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_papel text := new.raw_app_meta_data ->> 'papel';
begin
  if v_papel is null or v_papel not in ('admin', 'profissional', 'familiar') then
    raise exception 'Papel ausente ou inválido em app_metadata'
      using errcode = '22023';
  end if;

  insert into public.perfis (id, papel, nome_completo, telefone)
  values (
    new.id,
    v_papel::public.papel_usuario,
    coalesce(left(new.raw_user_meta_data ->> 'nome_completo', 200), ''),
    left(new.raw_user_meta_data ->> 'telefone', 30)
  );

  return new;
end;
$$;

create trigger ao_criar_usuario_criar_perfil
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- Papel do usuário logado; null se não houver perfil ou se estiver inativo.
-- security definer para ser usada nas políticas sem recursão de RLS.
create function public.papel_atual()
returns public.papel_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select p.papel
  from public.perfis p
  where p.id = (select auth.uid())
    and p.ativo
$$;

-- O Supabase concede EXECUTE em funções novas a anon/authenticated por padrão
revoke execute on function public.definir_atualizado_em() from public, anon, authenticated;
revoke execute on function public.criar_perfil_novo_usuario() from public, anon, authenticated;
revoke execute on function public.papel_atual() from public, anon;
grant execute on function public.papel_atual() to authenticated;
