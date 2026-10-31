// ESLint da raiz: cobre só os arquivos TS da raiz (testes de RLS e configs).
// web/ e mobile/ terão configurações próprias.
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['node_modules/', 'web/', 'mobile/', 'supabase/database.types.ts'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      // LGPD: nada de console.log; warn/error só para falhas sem dados sensíveis
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
);
