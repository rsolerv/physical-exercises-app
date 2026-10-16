import { Injectable, inject } from '@angular/core';
import type { Ejercicio } from '../../domain/ejercicio/ejercicio.entity';
import { EjercicioRepositoryPort } from '../ports/ejercicio-repository.port';

/**
 * Caso de uso de orquestación para la Historia de Usuario 2: buscar
 * ejercicios por texto libre y/o por una o varias categorías (FR-012,
 * FR-013). Si no se indica ningún criterio, devuelve la biblioteca completa;
 * si se indican ambos, combina los resultados por intersección.
 */
@Injectable({ providedIn: 'root' })
export class BuscarEjerciciosUseCase {
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);

  async buscar(texto: string, categoriaIds: string[]): Promise<Ejercicio[]> {
    const textoNormalizado = texto.trim();
    const tieneTexto = textoNormalizado.length > 0;
    const tieneCategorias = categoriaIds.length > 0;

    if (!tieneTexto && !tieneCategorias) {
      return this.ejercicioRepository.listarTodos();
    }

    if (tieneTexto && tieneCategorias) {
      const [porTexto, porCategorias] = await Promise.all([
        this.ejercicioRepository.buscarPorTexto(textoNormalizado),
        this.ejercicioRepository.buscarPorCategorias(categoriaIds),
      ]);
      const idsPorCategoria = new Set(porCategorias.map((ejercicio) => ejercicio.id));
      return porTexto.filter((ejercicio) => idsPorCategoria.has(ejercicio.id));
    }

    if (tieneTexto) {
      return this.ejercicioRepository.buscarPorTexto(textoNormalizado);
    }

    return this.ejercicioRepository.buscarPorCategorias(categoriaIds);
  }
}
