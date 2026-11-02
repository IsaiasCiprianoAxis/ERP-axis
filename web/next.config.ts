import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

// Raiz do projeto web/. Fixada porque o repositório tem dois lockfiles
// (raiz e web/) e, sem isso, o Next escolheria a raiz como workspace.
// import.meta.url funciona tanto na compilação para CommonJS (padrão) quanto
// no carregamento nativo como ES module, onde __dirname não existe.
const raizWeb = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: raizWeb,
  turbopack: {
    root: raizWeb,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
