import type { DatosNuevaPlanificacion, Planificacion } from './planificacion.entity';

/**
 * Duplica una planificación o plantilla existente: crea una copia
 * independiente con los mismos días y ejercicios asociados, sin fecha de
 * inicio salvo que el usuario la asigne explícitamente después (FR-019,
 * CA14).
 */
export function duplicarPlanificacion(original: Planificacion, nuevoNombre: string): DatosNuevaPlanificacion {
  return {
    nombre: nuevoNombre,
    fechaInicio: undefined,
    dias: original.dias.map((dia) => ({ diaSemana: dia.diaSemana, ejercicioIds: [...dia.ejercicioIds] })),
  };
}
