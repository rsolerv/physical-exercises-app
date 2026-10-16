import { Injectable, inject } from '@angular/core';
import type { DatosNuevaPlanificacion, DiaSemana, Planificacion } from '../../domain/planificacion/planificacion.entity';
import { PlanificacionRepositoryPort } from '../ports/planificacion-repository.port';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';

/**
 * Caso de uso de orquestación para la Historia de Usuario 3: crear
 * planificaciones concretas o plantillas, asignar/quitar ejercicios por día,
 * duplicar y crear una planificación concreta a partir de una plantilla
 * (FR-017…FR-022). Marca `cambiosLocalesPendientes` tras cada operación.
 */
@Injectable({ providedIn: 'root' })
export class GestionarPlanificacionUseCase {
  private readonly planificacionRepository = inject(PlanificacionRepositoryPort);
  private readonly ajustesRepository = inject(AjustesRepositoryPort);

  async crear(datos: DatosNuevaPlanificacion): Promise<Planificacion> {
    const creada = await this.planificacionRepository.crear(datos);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
    return creada;
  }

  async actualizar(id: string, cambios: Partial<DatosNuevaPlanificacion>): Promise<Planificacion> {
    const actualizada = await this.planificacionRepository.actualizar(id, cambios);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
    return actualizada;
  }

  async duplicar(id: string, nuevoNombre: string): Promise<Planificacion> {
    const copia = await this.planificacionRepository.duplicar(id, nuevoNombre);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
    return copia;
  }

  async asignarEjercicioADia(planificacionId: string, dia: DiaSemana, ejercicioId: string): Promise<void> {
    await this.planificacionRepository.asignarEjercicioADia(planificacionId, dia, ejercicioId);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
  }

  async quitarEjercicioDeDia(planificacionId: string, dia: DiaSemana, ejercicioId: string): Promise<void> {
    await this.planificacionRepository.quitarEjercicioDeDia(planificacionId, dia, ejercicioId);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
  }

  /** Crea una planificación concreta a partir de una plantilla, asignándole un lunes (FR-018, FR-019). */
  async crearDesdeTemplate(plantillaId: string, nombre: string, fechaInicio: string): Promise<Planificacion> {
    const copia = await this.planificacionRepository.duplicar(plantillaId, nombre);
    const actualizada = await this.planificacionRepository.actualizar(copia.id, { fechaInicio });
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
    return actualizada;
  }
}
