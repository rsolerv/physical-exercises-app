import type { DiaSemana } from './planificacion.entity';

const DIAS_SEMANA_POR_INDICE: readonly DiaSemana[] = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

/**
 * Utilidades de fecha compartidas por los casos de uso puros de
 * Planificación y Progreso diario. Todas las fechas se representan como
 * texto ISO `YYYY-MM-DD` (sin hora), comparando siempre en UTC para no
 * depender de la zona horaria del navegador.
 */
export function formatearFechaIso(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function diaSemanaDeFechaIso(fechaIso: string): DiaSemana {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  const indice = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return DIAS_SEMANA_POR_INDICE[indice];
}

/** Día de la semana de una fecha local (p. ej. "hoy" tal y como lo percibe el usuario). */
export function diaSemanaDeFecha(fecha: Date): DiaSemana {
  return DIAS_SEMANA_POR_INDICE[fecha.getDay()];
}

export function sumarDiasFechaIso(fechaIso: string, dias: number): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  const anioResultado = fecha.getUTCFullYear();
  const mesResultado = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const diaResultado = String(fecha.getUTCDate()).padStart(2, '0');
  return `${anioResultado}-${mesResultado}-${diaResultado}`;
}

export function compararFechasIso(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Convierte una fecha ISO `YYYY-MM-DD` a un `Date` a medianoche en hora local (usado al importar progreso diario). */
export function parsearFechaIsoLocal(fechaIso: string): Date {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}
