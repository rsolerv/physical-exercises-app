import type { Planificacion } from './planificacion.entity';
import { compararFechasIso, formatearFechaIso, sumarDiasFechaIso } from './fecha-semana';

/**
 * Calcula si una planificación está activa para una fecha de referencia
 * (normalmente "hoy"): solo las planificaciones concretas (con
 * `fechaInicio`) pueden estarlo, y únicamente si la fecha de referencia cae
 * dentro de la semana `[fechaInicio, fechaInicio + 6 días]` (FR-022). Las
 * plantillas (`fechaInicio` indefinida) nunca son activas.
 */
export function esActiva(planificacion: Planificacion, fechaReferencia: Date): boolean {
  if (!planificacion.fechaInicio) return false;

  const fechaReferenciaIso = formatearFechaIso(fechaReferencia);
  const fechaFinIso = sumarDiasFechaIso(planificacion.fechaInicio, 6);

  return (
    compararFechasIso(fechaReferenciaIso, planificacion.fechaInicio) >= 0 &&
    compararFechasIso(fechaReferenciaIso, fechaFinIso) <= 0
  );
}
