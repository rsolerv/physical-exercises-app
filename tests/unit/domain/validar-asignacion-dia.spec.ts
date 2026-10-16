import { describe, it, expect } from 'vitest';
import { validarAsignacionDia } from '../../../src/app/domain/planificacion/validar-asignacion-dia';
import { ErrorEjercicioDuplicadoEnDia } from '../../../src/app/domain/errores/errores-dominio';

describe('validarAsignacionDia', () => {
  it('acepta un ejercicio que todavía no está en el día', () => {
    expect(() => validarAsignacionDia(['ej-1', 'ej-2'], 'ej-3')).not.toThrow();
  });

  it('rechaza un ejercicio que ya está asignado a ese día (FR-021)', () => {
    expect(() => validarAsignacionDia(['ej-1', 'ej-2'], 'ej-1')).toThrow(ErrorEjercicioDuplicadoEnDia);
  });

  it('acepta el primer ejercicio de un día vacío', () => {
    expect(() => validarAsignacionDia([], 'ej-1')).not.toThrow();
  });
});
