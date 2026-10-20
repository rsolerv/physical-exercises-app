import { Injectable, inject } from '@angular/core';
import type { DatosNuevoEjercicio, Ejercicio } from '../../domain/ejercicio/ejercicio.entity';
import type { DiaSemana } from '../../domain/planificacion/planificacion.entity';
import { validarEjercicio } from '../../domain/ejercicio/validar-ejercicio';
import { EjercicioRepositoryPort } from '../ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { PlanificacionRepositoryPort } from '../ports/planificacion-repository.port';
import { ErrorNoEncontrado } from '../../domain/errores/errores-dominio';

export interface EliminacionEjercicio {
  ejercicio: Ejercicio;
  asignaciones: { planificacionId: string; dia: DiaSemana }[];
}

/**
 * Caso de uso de orquestación para la Historia de Usuario 1: crear, modificar
 * y eliminar ejercicios (FR-004). Valida con el dominio antes de guardar y
 * marca `cambiosLocalesPendientes` tras cada operación, para que la próxima
 * sincronización (Historia de Usuario 5) sepa que hay cambios que subir.
 */
@Injectable({ providedIn: 'root' })
export class GestionarEjercicioUseCase {
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly planificacionRepository = inject(PlanificacionRepositoryPort);

  async crear(datos: DatosNuevoEjercicio): Promise<Ejercicio> {
    validarEjercicio(datos);
    const creado = await this.ejercicioRepository.crear(datos);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
    return creado;
  }

  async actualizar(id: string, cambios: Partial<DatosNuevoEjercicio>): Promise<Ejercicio> {
    const actualizado = await this.ejercicioRepository.actualizar(id, cambios);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
    return actualizado;
  }

  async eliminar(id: string): Promise<EliminacionEjercicio> {
    const ejercicio = await this.ejercicioRepository.obtenerPorId(id);
    if (!ejercicio) throw new ErrorNoEncontrado(`No existe el ejercicio "${id}".`);
    const planificaciones = await this.planificacionRepository.listarPorEjercicio(id);
    const asignaciones = planificaciones.flatMap((planificacion) =>
      planificacion.dias
        .filter((dia) => dia.ejercicioIds.includes(id))
        .map((dia) => ({ planificacionId: planificacion.id, dia: dia.diaSemana }))
    );
    await this.ejercicioRepository.eliminar(id);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
    return { ejercicio, asignaciones };
  }

  async restaurarEliminacion(snapshot: EliminacionEjercicio): Promise<void> {
    await this.ejercicioRepository.restaurar(snapshot.ejercicio);
    for (const asignacion of snapshot.asignaciones) {
      await this.planificacionRepository.asignarEjercicioADia(
        asignacion.planificacionId,
        asignacion.dia,
        snapshot.ejercicio.id
      );
    }
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
  }
}
