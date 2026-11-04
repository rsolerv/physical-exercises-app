import { Injectable, inject } from '@angular/core';
import { ErrorValidacion } from '../../domain/errores/errores-dominio';
import type { PaginaEjercicios } from '../models/busqueda-ejercicios';
import { EjercicioRepositoryPort } from '../ports/ejercicio-repository.port';

/** Consulta paginada de ejercicios para Buscar y el selector de planificación. */
@Injectable({ providedIn: 'root' })
export class BuscarEjerciciosUseCase {
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);

  buscarPaginado(texto: string, categoriaIds: string[], pagina = 0, tamanoPagina = 50): Promise<PaginaEjercicios> {
    if (!Number.isSafeInteger(pagina) || pagina < 0 ||
      !Number.isSafeInteger(tamanoPagina) || tamanoPagina < 1 || tamanoPagina > 100 ||
      !Number.isSafeInteger(pagina * tamanoPagina)) {
      throw new ErrorValidacion('La página o el tamaño de página no son válidos.');
    }
    return this.ejercicioRepository.buscarPaginado({
      texto: texto.trim(),
      categoriaIds: [...new Set(categoriaIds)],
      pagina,
      tamanoPagina,
    });
  }

  contarTotal(): Promise<number> {
    return this.ejercicioRepository.contarTodos();
  }

}
