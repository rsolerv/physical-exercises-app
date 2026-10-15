import { Injectable, inject } from '@angular/core';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import { CategoriaRepositoryPort } from '../ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';

/**
 * Caso de uso de orquestación para la Historia de Usuario 1: crear, modificar
 * y eliminar categorías (FR-009). Al eliminar, retira la categoría de todos
 * los ejercicios asociados (reasignando la genérica "Sin categoría" si algún
 * ejercicio se queda sin ninguna, FR-011) antes de borrarla.
 */
@Injectable({ providedIn: 'root' })
export class GestionarCategoriaUseCase {
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
  private readonly ajustesRepository = inject(AjustesRepositoryPort);

  async crear(nombre: string, descripcion?: string): Promise<Categoria> {
    const creada = await this.categoriaRepository.crear(nombre, descripcion);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
    return creada;
  }

  async actualizar(id: string, cambios: { nombre?: string; descripcion?: string }): Promise<Categoria> {
    const actualizada = await this.categoriaRepository.actualizar(id, cambios);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
    return actualizada;
  }

  async eliminar(id: string): Promise<void> {
    const generica = await this.categoriaRepository.obtenerGenerica();
    await this.ejercicioRepository.quitarCategoriaDeTodos(id, generica.id);
    await this.categoriaRepository.eliminar(id);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
  }
}
