-- Migration: RLS de public.perfis (Fase 0)
-- anon: sem acesso. authenticated: lê/atualiza o próprio perfil; admin ativo
-- lê/atualiza todos. INSERT e DELETE só via trigger de cadastro / service role.

-- Privilégios de tabela (defesa em profundidade além do RLS; TRUNCATE,
-- por exemplo, não é coberto por RLS)
revoke all on table public.perfis from anon, authenticated;
grant select, update on table public.perfis to authenticated;

-- SELECT
-- Por decisão, um perfil desativado (ativo = false) ainda lê a própria linha:
-- perfis_select_proprio não checa ativo. O bloqueio de dados de terceiros é
-- feito por papel_atual(), que checa ativo a cada consulta; para um perfil
-- inativo ela retorna null e as políticas baseadas em papel deixam de valer
-- imediatamente, sem depender da renovação do token.
create policy perfis_select_proprio on public.perfis
  for select to authenticated
  using (id = (select auth.uid()));

create policy perfis_select_admin on public.perfis
  for select to authenticated
  using ((select public.papel_atual()) = 'admin');

-- UPDATE
create policy perfis_update_proprio on public.perfis
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy perfis_update_admin on public.perfis
  for update to authenticated
  using ((select public.papel_atual()) = 'admin')
  with check ((select public.papel_atual()) = 'admin');

-- Campos protegidos: id, papel, ativo e criado_em só mudam por admin ativo
-- ou por service role/migrations (contextos sem auth.uid()).
create function public.proteger_campos_perfil()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and public.papel_atual() is distinct from 'admin'
     and (new.id        is distinct from old.id
       or new.papel     is distinct from old.papel
       or new.ativo     is distinct from old.ativo
       or new.criado_em is distinct from old.criado_em)
  then
    raise exception 'Sem permissão para alterar papel, status ou identificador do perfil'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger perfis_proteger_campos
  before update on public.perfis
  for each row execute function public.proteger_campos_perfil();

revoke execute on function public.proteger_campos_perfil() from public, anon, authenticated;
