import { describe, it, expect } from 'vitest';
import { calcularPorcentajeDia } from '../../../src/app/domain/progreso-diario/calcular-porcentaje-dia';
import type { ProgresoDiario } from '../../../src/app/domain/progreso-diario/progreso-diario.entity';

function registro(ejercicioId: string, realizado: boolean): ProgresoDiario {
  return { fecha: '2026-10-15', ejercicioId, realizado };
}

describe('calcularPorcentajeDia', () => {
  it('devuelve 0% cuando ningún ejercicio planificado está marcado como realizado (FR-025, CA10)', () => {
    const resultado = calcularPorcentajeDia(['ej-1', 'ej-2'], [registro('ej-1', false), registro('ej-2', false)]);
    expect(resultado.porcentaje).toBe(0);
    expect(resultado.totalPlanificados).toBe(2);
    expect(resultado.totalRealizados).toBe(0);
  });

  it('devuelve un porcentaje parcial cuando solo algunos ejercicios están marcados (FR-025, CA10)', () => {
    const resultado = calcularPorcentajeDia(['ej-1', 'ej-2', 'ej-3', 'ej-4'], [registro('ej-1', true), registro('ej-2', true)]);
    expect(resultado.porcentaje).toBe(50);
  });

  it('devuelve 100% cuando todos los ejercicios planificados están marcados (FR-025, CA10)', () => {
    const resultado = calcularPorcentajeDia(['ej-1', 'ej-2'], [registro('ej-1', true), registro('ej-2', true)]);
    expect(resultado.porcentaje).toBe(100);
  });

  it('devuelve un porcentaje null (distinguible de 0%) cuando no hay ejercicios planificados (CL2)', () => {
    const resultado = calcularPorcentajeDia([], []);
    expect(resultado.porcentaje).toBeNull();
    expect(resultado.totalPlanificados).toBe(0);
  });

  it('ignora registros de progreso que no corresponden a ejercicios planificados', () => {
    const resultado = calcularPorcentajeDia(['ej-1'], [registro('ej-1', true), registro('ej-ajeno', true)]);
    expect(resultado.totalRealizados).toBe(1);
    expect(resultado.porcentaje).toBe(100);
  });

  it('redondea el porcentaje al entero más cercano', () => {
    const resultado = calcularPorcentajeDia(['ej-1', 'ej-2', 'ej-3'], [registro('ej-1', true)]);
    expect(resultado.porcentaje).toBe(33);
  });
});
