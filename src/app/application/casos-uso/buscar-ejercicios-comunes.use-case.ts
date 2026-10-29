import { Injectable, inject } from '@angular/core';
import { RepositorioComunPort, type CategoriaComun, type EjercicioComunArchivo } from '../ports/repositorio-comun.port';

/**
 * Caso de uso de orquestación para la Historia de Usuario 1: buscar en el
 * catálogo del repositorio común por texto libre y/o una sola categoría
 * común (FR-002, FR-003, FR-004). No requiere credenciales (FR-007).
 */
@Injectable({ providedIn: 'root' })
export class BuscarEjerciciosComunesUseCase {
  private readonly repositorioComun = inject(RepositorioComunPort);

  async buscar(texto: string, categoriaId: string | null): Promise<EjercicioComunArchivo[]> {
    return this.repositorioComun.buscarEjercicios(texto.trim(), categoriaId);
  }

  async listarCategorias(): Promise<CategoriaComun[]> {
    return this.repositorioComun.listarCategorias();
  }
}
