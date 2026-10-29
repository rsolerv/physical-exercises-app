import { describe, it, expect } from 'vitest';
import { normalizarNombreEjercicio } from '../../../src/app/domain/ejercicio/normalizar-nombre-ejercicio';

describe('normalizarNombreEjercicio', () => {
  it('convierte el nombre a minúsculas', () => {
    expect(normalizarNombreEjercicio('Sentadilla')).toBe('sentadilla');
  });

  it('elimina los espacios al principio y al final', () => {
    expect(normalizarNombreEjercicio('  Sentadilla  ')).toBe('sentadilla');
  });

  it('no modifica los espacios internos', () => {
    expect(normalizarNombreEjercicio('  Flexión de rodilla  ')).toBe('flexión de rodilla');
  });

  it('dos nombres que solo difieren en mayúsculas/minúsculas y espacios se normalizan igual (FR-017)', () => {
    expect(normalizarNombreEjercicio('  ALMEJA ')).toBe(normalizarNombreEjercicio('almeja'));
  });
});
