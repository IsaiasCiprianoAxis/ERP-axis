import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['supabase/tests/**/*.test.ts'],
    // Carrega só as variáveis SUPABASE_* do .env.local da raiz
    env: loadEnv('', process.cwd(), 'SUPABASE_'),
    // Testes compartilham usuários no projeto remoto: rodar em série
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
