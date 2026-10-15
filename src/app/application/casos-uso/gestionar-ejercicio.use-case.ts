import { Injectable, inject } from '@angular/core';
import type { DatosNuevoEjercicio, Ejercicio } from '../../domain/ejercicio/ejercicio.entity';
import { validarEjercicio } from '../../domain/ejercicio/validar-ejercicio';
import { EjercicioRepositoryPort } from '../ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';

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

  async eliminar(id: string): Promise<void> {
    await this.ejercicioRepository.eliminar(id);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
  }
}
