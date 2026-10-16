/** Días de la semana admitidos, de lunes a domingo (data-model.md § Día de planificación). */
export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export const DIAS_SEMANA_ORDENADOS: readonly DiaSemana[] = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
];

/** Día concreto de la semana dentro de una Planificación, con sus ejercicios asignados (FR-021). */
export interface DiaPlanificacion {
  diaSemana: DiaSemana;
  ejercicioIds: string[];
}

/**
 * Planificación semanal (ver data-model.md § Planificación). Si `fechaInicio`
 * tiene valor (formato `YYYY-MM-DD`, siempre un lunes), es una planificación
 * concreta; si es `undefined`, es una plantilla reutilizable (FR-017,
 * FR-018). El campo derivado `activa` no se almacena: lo calcula el caso de
 * uso puro `es-activa.ts` a partir de la fecha del sistema.
 */
export interface Planificacion {
  id: string;
  nombre: string;
  fechaInicio?: string;
  dias: DiaPlanificacion[];
}

export type DatosNuevaPlanificacion = Omit<Planificacion, 'id'>;

/** Crea los 7 "Día de planificación" vacíos (uno por cada día de la semana). */
export function crearDiasVacios(): DiaPlanificacion[] {
  return DIAS_SEMANA_ORDENADOS.map((diaSemana) => ({ diaSemana, ejercicioIds: [] }));
}
