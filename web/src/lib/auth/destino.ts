import type { Database } from '../../../../supabase/database.types';

export type Papel = Database['public']['Enums']['papel_usuario'];

const PAPEIS: readonly string[] = ['admin', 'profissional', 'familiar'] satisfies Papel[];

// Rota inicial de cada papel. null (sem perfil ou inativo) vai para /login,
// que mostra "acesso negado" sem redirecionar de volta.
export function destinoPorPapel(papel: Papel | null): '/admin' | '/use-o-aplicativo' | '/login' {
  switch (papel) {
    case 'admin':
      return '/admin';
    case 'profissional':
    case 'familiar':
      return '/use-o-aplicativo';
    default:
      return '/login';
  }
}

// Papel que vale de fato: só conta se o perfil existir e estiver ativo
export function papelEfetivo(perfil: { papel: Papel; ativo: boolean } | null | undefined): Papel | null {
  return perfil?.ativo === true ? perfil.papel : null;
}

// Lê o claim user_role do JWT. Qualquer valor fora do enum vira null.
export function papelDoClaim(valor: unknown): Papel | null {
  return typeof valor === 'string' && PAPEIS.includes(valor) ? (valor as Papel) : null;
}
