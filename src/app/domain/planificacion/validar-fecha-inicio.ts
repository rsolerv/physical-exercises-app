import { ErrorPlanificacionActivaDuplicada, ErrorValidacion } from '../errores/errores-dominio';
import { diaSemanaDeFechaIso } from './fecha-semana';

/**
 * Valida la `fechaInicio` de una planificación concreta: DEBE ser un lunes
 * (FR-017) y no puede repetir la de otra planificación concreta existente
 * (FR-022, RN9).
 */
export function validarFechaInicio(fechaInicio: string, fechasInicioExistentes: string[]): void {
  if (diaSemanaDeFechaIso(fechaInicio) !== 'lunes') {
    throw new ErrorValidacion('La fecha de inicio de una planificación debe ser un lunes.');
  }
  if (fechasInicioExistentes.includes(fechaInicio)) {
    throw new ErrorPlanificacionActivaDuplicada(
      'Ya existe una planificación concreta que empieza esa misma semana.'
    );
  }
}
