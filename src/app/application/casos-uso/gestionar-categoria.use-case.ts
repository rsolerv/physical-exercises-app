import { Injectable, inject } from '@angular/core';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import { CategoriaRepositoryPort } from '../ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { ErrorNoEncontrado, ErrorOperacionNoPermitida } from '../../domain/errores/errores-dominio';

export interface EliminacionCategoria {
  categoria: Categoria;
  ejercicios: { id: string; categoriaIds: string[] }[];
}

/**
 * Caso de uso de orquestación para la Historia de Usuario 1: crear, modificar
 * y eliminar categorías (FR-009). Al eliminar, impide la operación si algún
 * ejercicio se quedaría sin categoría; en caso contrario retira la categoría
 * antes de borrarla (FR-011).
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

  async eliminar(id: string): Promise<EliminacionCategoria> {
    const categoria = await this.categoriaRepository.obtenerPorId(id);
    if (!categoria) throw new ErrorNoEncontrado(`No existe la categoría "${id}".`);
    const todosLosEjercicios = await this.ejercicioRepository.listarTodos();
    const afectados = todosLosEjercicios.filter((ejercicio) => ejercicio.categoriaIds.includes(id));
    const sinCategoria = afectados.filter((ejercicio) => !ejercicio.categoriaIds.some((categoriaId) => categoriaId !== id));
    if (sinCategoria.length > 0) {
      const nombres = sinCategoria.map((ejercicio) => `«${ejercicio.nombre}»`);
      throw new ErrorOperacionNoPermitida(
        `No se puede eliminar la categoría porque estos ejercicios solo la tienen asignada: ${nombres.join(', ')}. ` +
          'Asigna otra categoría a esos ejercicios antes de eliminarla.'
      );
    }
    const ejercicios = afectados.map(({ id: ejercicioId, categoriaIds }) => ({
      id: ejercicioId,
      categoriaIds: [...categoriaIds],
    }));
    await this.ejercicioRepository.quitarCategoriaDeTodos(id);
    await this.categoriaRepository.eliminar(id);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
    return { categoria, ejercicios };
  }

  async restaurarEliminacion(snapshot: EliminacionCategoria): Promise<void> {
    await this.categoriaRepository.restaurar(snapshot.categoria);
    for (const ejercicio of snapshot.ejercicios) {
      await this.ejercicioRepository.actualizar(ejercicio.id, { categoriaIds: ejercicio.categoriaIds });
    }
    await this.ajustesRepository.marcarCambiosLocalesPendientes(true);
  }
}
