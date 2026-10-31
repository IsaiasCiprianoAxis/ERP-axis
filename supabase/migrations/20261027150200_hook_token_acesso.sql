-- Migration: Custom Access Token Hook (Fase 0)
-- Injeta o claim "user_role" no JWT a partir de public.perfis.
-- Usuário inativo ou sem perfil recebe user_role = null.
--
-- DEPOIS DE APLICAR, ATIVAR NO PAINEL:
--   Authentication → Hooks → Customize Access Token (JWT) Claims
--   → Postgres → public.hook_token_acesso
--
-- public.perfis segue sendo a fonte da verdade; o claim é um cache que
-- se atualiza na próxima emissão do token.

-- Papel de um usuário específico (null se inativo ou sem perfil).
-- security definer: lê perfis como dono da tabela, sem precisar de política
-- de RLS nem de GRANT na tabela para supabase_auth_admin. Retorna só o papel.
create function public.papel_do_usuario(p_user_id uuid)
returns public.papel_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select p.papel
  from public.perfis p
  where p.id = p_user_id
    and p.ativo
$$;

-- Executável só pelo serviço de Auth (não fica exposta como RPC para clientes)
revoke execute on function public.papel_do_usuario(uuid) from public, anon, authenticated;
grant execute on function public.papel_do_usuario(uuid) to supabase_auth_admin;

create function public.hook_token_acesso(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_claims jsonb := event -> 'claims';
  v_papel  public.papel_usuario;
begin
  v_papel := public.papel_do_usuario((event ->> 'user_id')::uuid);

  if v_papel is null then
    v_claims := jsonb_set(v_claims, '{user_role}', 'null'::jsonb);
  else
    v_claims := jsonb_set(v_claims, '{user_role}', to_jsonb(v_papel));
  end if;

  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

-- Só o serviço de Auth executa o hook
grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_token_acesso(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_token_acesso(jsonb) from public, anon, authenticated;
