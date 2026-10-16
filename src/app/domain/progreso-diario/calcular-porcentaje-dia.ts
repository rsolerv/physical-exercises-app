import type { ProgresoDiario } from './progreso-diario.entity';

export interface ResultadoPorcentajeDia {
  totalPlanificados: number;
  totalRealizados: number;
  /**
   * Porcentaje de 0 a 100, redondeado al entero más cercano. `null` cuando no
   * hay ningún ejercicio planificado para la fecha, para distinguir ese caso
   * de "0% completado" (CL2).
   */
  porcentaje: number | null;
}

/**
 * Calcula el porcentaje de progreso de un día (FR-025, CA10) a partir de los
 * ejercicios planificados para esa fecha y los registros de progreso
 * obtenidos de `ProgresoDiarioRepositoryPort.obtenerPorFecha()`. Es el único
 * responsable de este cálculo: los repositorios solo devuelven datos.
 */
export function calcularPorcentajeDia(
  ejercicioIdsPlanificados: string[],
  registros: ProgresoDiario[]
): ResultadoPorcentajeDia {
  const totalPlanificados = ejercicioIdsPlanificados.length;
  if (totalPlanificados === 0) {
    return { totalPlanificados: 0, totalRealizados: 0, porcentaje: null };
  }

  const idsRealizados = new Set(registros.filter((registro) => registro.realizado).map((registro) => registro.ejercicioId));
  const totalRealizados = ejercicioIdsPlanificados.filter((id) => idsRealizados.has(id)).length;

  return {
    totalPlanificados,
    totalRealizados,
    porcentaje: Math.round((totalRealizados / totalPlanificados) * 100),
  };
}
