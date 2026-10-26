import { describe, expect, it } from 'vitest';
import { identificarDestinoSincronizacion } from '../../../src/app/domain/sincronizacion/identificar-destino-sincronizacion';

describe('identificarDestinoSincronizacion', () => {
  it('identifica GitHub', () => {
    expect(identificarDestinoSincronizacion('github', null)).toBe('github');
  });

  it('identifica una cuenta de Google por su correo', () => {
    expect(identificarDestinoSincronizacion('google', 'persona@example.com')).toBe('google:persona@example.com');
  });

  it('devuelve nulo si no hay método activo', () => {
    expect(identificarDestinoSincronizacion(null, null)).toBeNull();
  });

  it('devuelve nulo si falta la cuenta del método Google', () => {
    expect(identificarDestinoSincronizacion('google', null)).toBeNull();
  });
});
