import { describe, expect, it } from 'vitest';
import { versionSincronizadaEfectiva } from '../../../src/app/domain/sincronizacion/version-sincronizada-efectiva';

describe('versionSincronizadaEfectiva', () => {
  it('conserva la versión cuando el destino actual coincide con el guardado', () => {
    expect(versionSincronizadaEfectiva('google:persona@example.com', 'google:persona@example.com', 'v-1')).toBe('v-1');
  });

  it('trata un destino distinto como primera sincronización', () => {
    expect(versionSincronizadaEfectiva('google:otra@example.com', 'google:persona@example.com', 'v-1')).toBeNull();
  });

  it('trata un destino guardado nulo como primera sincronización', () => {
    expect(versionSincronizadaEfectiva('github', null, 'sha-1')).toBeNull();
  });
});
