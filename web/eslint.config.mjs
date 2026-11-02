// ESLint do web/ (Next.js). Independente da raiz, que usa ESLint 10;
// aqui fica o 9 até o eslint-config-next aceitar o 10 (ver Pendências no CLAUDE.md).
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/', 'out/', 'next-env.d.ts']),
  {
    rules: {
      // LGPD: nada de console.log; warn/error só para falhas sem dados sensíveis
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // O projeto usa só o App Router; esta regra procura pages/ e não se aplica
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
]);
