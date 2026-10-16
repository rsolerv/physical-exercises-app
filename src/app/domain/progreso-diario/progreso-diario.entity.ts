/** Registro de si un ejercicio planificado para una fecha ha sido marcado como realizado (data-model.md § Progreso diario). */
export interface ProgresoDiario {
  fecha: string;
  ejercicioId: string;
  realizado: boolean;
}
