import { ErrorEjercicioDuplicadoEnDia } from '../errores/errores-dominio';

/**
 * Valida que un ejercicio no esté ya asignado al día de planificación al que
 * se quiere añadir: un mismo ejercicio no puede repetirse dentro de la lista
 * del mismo día de la misma planificación (FR-021, RN5).
 */
export function validarAsignacionDia(ejercicioIdsDelDia: string[], ejercicioId: string): void {
  if (ejercicioIdsDelDia.includes(ejercicioId)) {
    throw new ErrorEjercicioDuplicadoEnDia('Este ejercicio ya está asignado a ese día de la planificación.');
  }
}
