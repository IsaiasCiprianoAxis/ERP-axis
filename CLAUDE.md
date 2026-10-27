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