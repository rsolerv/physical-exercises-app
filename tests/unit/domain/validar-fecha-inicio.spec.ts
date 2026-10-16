import { describe, it, expect } from 'vitest';
import { validarFechaInicio } from '../../../src/app/domain/planificacion/validar-fecha-inicio';
import { ErrorValidacion, ErrorPlanificacionActivaDuplicada } from '../../../src/app/domain/errores/errores-dominio';

describe('validarFechaInicio', () => {
  it('acepta un lunes sin conflicto', () => {
    expect(() => validarFechaInicio('2026-10-12', [])).not.toThrow();
  });

  it('rechaza una fecha que no es lunes (FR-017)', () => {
    expect(() => validarFechaInicio('2026-10-13', [])).toThrow(ErrorValidacion);
  });

  it('rechaza una fechaInicio ya usada por otra planificación concreta (FR-022)', () => {
    expect(() => validarFechaInicio('2026-10-12', ['2026-10-12'])).toThrow(ErrorPlanificacionActivaDuplicada);
  });

  it('acepta una fechaInicio distinta de las existentes', () => {
    expect(() => validarFechaInicio('2026-10-19', ['2026-10-12'])).not.toThrow();
  });
});
