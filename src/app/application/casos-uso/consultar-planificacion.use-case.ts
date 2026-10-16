import { Injectable, inject } from '@angular/core';
import type { DiaSemana, Planificacion } from '../../domain/planificacion/planificacion.entity';
import { PlanificacionRepositoryPort } from '../ports/planificacion-repository.port';

/**
 * Caso de uso de orquestación para la Historia de Usuario 3: consultar la
 * planificación de hoy, de cualquier otra fecha, de un día concreto o de
 * todos los ejercicios de una planificación con independencia del día
 * (FR-023). Devuelve `null` cuando no hay planificación activa para la
 * fecha solicitada (CL2).
 */
@Injectable({ providedIn: 'root' })
export class ConsultarPlanificacionUseCase {
  private readonly planificacionRepository = inject(PlanificacionRepositoryPort);

  async obtenerDeHoy(fechaReferencia: Date = new Date()): Promise<Planificacion | null> {
    return this.planificacionRepository.obtenerActiva(fechaReferencia);
  }

  async obtenerDeFecha(fecha: Date): Promise<Planificacion | null> {
    return this.planificacionRepository.obtenerActiva(fecha);
  }

  obtenerEjerciciosDelDia(planificacion: Planificacion, dia: DiaSemana): string[] {
    return planificacion.dias.find((d) => d.diaSemana === dia)?.ejercicioIds ?? [];
  }

  /** Todos los ejercicios de una planificación concreta, sin duplicados y con independencia del día (FR-023). */
  async obtenerTodosLosEjercicios(planificacionId: string): Promise<string[]> {
    const planificacion = await this.planificacionRepository.obtenerPorId(planificacionId);
    if (!planificacion) return [];
    const ids = new Set<string>();
    for (const dia of planificacion.dias) {
      for (const id of dia.ejercicioIds) ids.add(id);
    }
    return [...ids];
  }
}
