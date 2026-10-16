import { Injectable, inject } from '@angular/core';
import { ProgresoDiarioRepositoryPort } from '../ports/progreso-diario-repository.port';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { ConsultarPlanificacionUseCase } from './consultar-planificacion.use-case';
import { calcularPorcentajeDia } from '../../domain/progreso-diario/calcular-porcentaje-dia';
import type { ResultadoPorcentajeDia } from '../../domain/progreso-diario/calcular-porcentaje-dia';
import { diaSemanaDeFecha } from '../../domain/planificacion/fecha-semana';

/**
 * Caso de uso de orquestación para la Historia de Usuario 4: marcar o
 * desmarcar un ejercicio como realizado (FR-024) y obtener el porcentaje de
 * progreso de una fecha, que calcula siempre el dominio puro
 * `calcular-porcentaje-dia` (FR-025).
 */
@Injectable({ providedIn: 'root' })
export class GestionarProgresoDiarioUseCase {
  private readonly progresoDiarioRepository = inject(ProgresoDiarioRepositoryPort);
  private readonly consultarPlanificacion = inject(ConsultarPlanificacionUseCase);
  private readonly ajustesRepository = inject(AjustesRepositoryPort);

  async marcar(fecha: Date, ejercicioId: string, realizado: boolean): Promise<void> {
    await this.progresoDiarioRepository.marcar(fecha, ejercicioId, realizado);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
  }

  async obtenerProgresoDeFecha(fecha: Date): Promise<ResultadoPorcentajeDia> {
    const planificacion = await this.consultarPlanificacion.obtenerDeFecha(fecha);
    const ejercicioIdsPlanificados = planificacion
      ? this.consultarPlanificacion.obtenerEjerciciosDelDia(planificacion, diaSemanaDeFecha(fecha))
      : [];
    const registros = await this.progresoDiarioRepository.obtenerPorFecha(fecha);
    return calcularPorcentajeDia(ejercicioIdsPlanificados, registros);
  }
}
