import { describe, it, expect } from 'vitest';
import { diaSemanaDeFecha } from '../../../src/app/domain/planificacion/fecha-semana';

describe('diaSemanaDeFecha', () => {
  it('devuelve "lunes" para un lunes en hora local', () => {
    expect(diaSemanaDeFecha(new Date(2026, 9, 12, 10, 0, 0))).toBe('lunes');
  });

  it('devuelve "domingo" para un domingo en hora local', () => {
    expect(diaSemanaDeFecha(new Date(2026, 9, 18, 23, 0, 0))).toBe('domingo');
  });
});
