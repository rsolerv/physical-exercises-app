import { describe, it, expect } from 'vitest';
import { diaSemanaDeFecha, parsearFechaIsoLocal, formatearFechaIso } from '../../../src/app/domain/planificacion/fecha-semana';

describe('diaSemanaDeFecha', () => {
  it('devuelve "lunes" para un lunes en hora local', () => {
    expect(diaSemanaDeFecha(new Date(2026, 9, 12, 10, 0, 0))).toBe('lunes');
  });

  it('devuelve "domingo" para un domingo en hora local', () => {
    expect(diaSemanaDeFecha(new Date(2026, 9, 18, 23, 0, 0))).toBe('domingo');
  });
});

describe('parsearFechaIsoLocal', () => {
  it('convierte una fecha ISO a un Date a medianoche en hora local', () => {
    const fecha = parsearFechaIsoLocal('2026-10-15');
    expect(formatearFechaIso(fecha)).toBe('2026-10-15');
  });
});
