import { describe, expect, it } from 'vitest';
import { destinoPorPapel, papelDoClaim, papelEfetivo } from './destino';

describe('destinoPorPapel', () => {
  it('admin vai para /admin', () => {
    expect(destinoPorPapel('admin')).toBe('/admin');
  });

  it('profissional e familiar vão para /use-o-aplicativo', () => {
    expect(destinoPorPapel('profissional')).toBe('/use-o-aplicativo');
    expect(destinoPorPapel('familiar')).toBe('/use-o-aplicativo');
  });

  it('sem papel vai para /login', () => {
    expect(destinoPorPapel(null)).toBe('/login');
  });
});

describe('papelEfetivo', () => {
  it('perfil ativo mantém o papel', () => {
    expect(papelEfetivo({ papel: 'admin', ativo: true })).toBe('admin');
  });

  it('perfil inativo não tem papel', () => {
    expect(papelEfetivo({ papel: 'admin', ativo: false })).toBeNull();
  });

  it('sem perfil não tem papel', () => {
    expect(papelEfetivo(null)).toBeNull();
    expect(papelEfetivo(undefined)).toBeNull();
  });
});

describe('papelDoClaim', () => {
  it('aceita os papéis do enum', () => {
    expect(papelDoClaim('admin')).toBe('admin');
    expect(papelDoClaim('profissional')).toBe('profissional');
    expect(papelDoClaim('familiar')).toBe('familiar');
  });

  it('rejeita null, ausente e valores fora do enum', () => {
    expect(papelDoClaim(null)).toBeNull();
    expect(papelDoClaim(undefined)).toBeNull();
    expect(papelDoClaim('superadmin')).toBeNull();
    expect(papelDoClaim('ADMIN')).toBeNull();
    expect(papelDoClaim(1)).toBeNull();
  });
});
