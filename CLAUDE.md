# Home Care OS

## Stack
- Banco e auth: Supabase (PostgreSQL, Auth, Storage, RLS)
- Web: Next.js com TypeScript e Tailwind CSS
- Mobile: React Native com Expo e TypeScript
- Estado offline: React Query e AsyncStorage

## Regras
- Responder e escrever comentários e documentação em português (pt-BR)
- Antes de qualquer código, propor um plano e esperar aprovação
- Nunca commitar chaves, senhas ou arquivos .env
- Rodar testes, tsc --noEmit e lint antes de cada commit
- Toda alteração no banco deve vir com política de RLS
- Dados de pacientes são sensíveis (LGPD): não logar dados clínicos no console

## Especificação
Ver docs/especificacao.md

## Autenticação e papéis
- O papel do usuário fica em `public.perfis` (fonte da verdade) e é definido
  na criação por `public.criar_perfil` (só service role), chamada logo após
  `auth.admin.createUser`. Usuário sem perfil tem papel null e nenhum acesso.
- O claim `user_role` no JWT é um cache: só é atualizado quando o token é
  renovado (refresh ou novo login). Use-o para roteamento nos apps, nunca
  como única barreira de acesso.
- O controle de acesso aos dados é imediato: o RLS consulta `papel_atual()`,
  que lê `perfis` (incluindo `ativo`) a cada consulta.

## Testes
- RLS de `perfis`: `npm run test:rls` roda 25 verificações em
  `supabase/tests/rls-perfis.test.ts`, contra o projeto Supabase de dev.

## Configuração manual do Supabase (painel)
Estes ajustes não ficam nas migrations nem no config.toml (que só vale
para o ambiente local). Repetir sempre que o projeto for recriado ou um
novo ambiente for criado:
- Cadastro público desligado: Authentication → Sign In / Providers →
  "Allow new users to sign up" desativado. Usuários são criados só pelo
  admin (service role). Feito no projeto de dev kyqlyiatsegzchcxgzrq.
- Custom Access Token Hook: Authentication → Hooks → Customize Access
  Token (JWT) Claims → Postgres → public.hook_token_acesso.

## Pendências
- Antes do passo 3 da Fase 0: verificar a compatibilidade do TypeScript 6.0.3
  (usado na raiz) com Next.js (web/) e Expo (mobile/). A raiz saiu do
  TypeScript 7.0.2 porque o typescript-eslint 8.72.1 só aceita TS < 6.1.0.
  Reavaliar o TS 7 quando o typescript-eslint passar a suportá-lo.
- ESLint em web/: fica no 9.39.5 (fora de suporte) porque o
  eslint-config-next 16.4.3 depende de eslint-plugin-react, eslint-plugin-import
  e eslint-plugin-jsx-a11y, que não aceitam ESLint 10. Subir para o 10 (como na
  raiz) quando o eslint-config-next e esses plugins passarem a aceitá-lo.
- npm audit em web/: 16 vulnerabilidades moderadas aceitas. Todas vêm do
  minimatch (DoS via glob), só nas devDependencies do lint (ESLint e plugins);
  `npm audit --omit=dev` dá 0. Não rodar `npm audit fix --force` (faz downgrade
  para eslint 4). Reavaliar junto com a atualização do ESLint.