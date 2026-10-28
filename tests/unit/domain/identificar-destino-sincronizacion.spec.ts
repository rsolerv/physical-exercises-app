import { describe, expect, it } from 'vitest';
import { identificarDestinoSincronizacion } from '../../../src/app/domain/sincronizacion/identificar-destino-sincronizacion';

describe('identificarDestinoSincronizacion', () => {
  it('identifica GitHub por su repositorio', () => {
    expect(identificarDestinoSincronizacion('github', null, 'owner/data')).toBe('github:owner/data');
  });

  it('identifica Google por su correo normalizado', () => {
    expect(identificarDestinoSincronizacion('google', 'Persona@Example.com', null)).toBe(
      'google:persona@example.com',
    );
  });

  it('devuelve nulo si no hay método activo', () => {
    expect(identificarDestinoSincronizacion(null, null, null)).toBeNull();
  });

  it('devuelve nulo si falta el repositorio de GitHub', () => {
    expect(identificarDestinoSincronizacion('github', null, null)).toBeNull();
  });

  it('devuelve nulo si falta la cuenta de Google', () => {
    expect(identificarDestinoSincronizacion('google', null, 'owner/data')).toBeNull();
  });
});
