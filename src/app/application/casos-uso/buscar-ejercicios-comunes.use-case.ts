import { Injectable, inject } from '@angular/core';
import { ErrorValidacion } from '../../domain/errores/errores-dominio';
import {
  RepositorioComunPort,
  type CategoriaComun,
  type EjercicioComunArchivo,
} from '../ports/repositorio-comun.port';
import type { ImagenArchivoJSON } from '../ports/github-sync.port';

export interface DatosVistaPreviaEjercicioComun {
  ejercicio: EjercicioComunArchivo;
  imagenesArchivo: Map<string, ImagenArchivoJSON>;
  imagenesOmitidas: number;
}
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

  async obtenerVistaPrevia(id: string): Promise<DatosVistaPreviaEjercicioComun | null> {
    const ejercicio = await this.repositorioComun.obtenerEjercicioPorId(id);
    if (!ejercicio) return null;

    const imagenesArchivo = new Map<string, ImagenArchivoJSON>();
    let imagenesOmitidas = 0;
    for (const imagen of ejercicio.imagenes) {
      if (imagen.tipo !== 'archivo' || !imagen.ruta) continue;
      try {
        imagenesArchivo.set(imagen.id, await this.repositorioComun.leerImagen(imagen.ruta));
      } catch (error) {
        if (!(error instanceof ErrorValidacion)) throw error;
        imagenesOmitidas += 1;
      }
    }
    return { ejercicio, imagenesArchivo, imagenesOmitidas };
  }
}
