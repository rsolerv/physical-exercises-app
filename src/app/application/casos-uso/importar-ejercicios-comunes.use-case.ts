import { Injectable, inject } from '@angular/core';
import { RepositorioComunPort, type CategoriaComun, type EjercicioComunArchivo } from '../ports/repositorio-comun.port';
import { CategoriaRepositoryPort } from '../ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { aDatosNuevoEjercicio } from '../../domain/ejercicio/convertir-ejercicio-comun';
import { ErrorValidacion } from '../../domain/errores/errores-dominio';
import type { ImagenArchivoJSON } from '../ports/github-sync.port';

export interface ResultadoImportacionEjerciciosComunes {
  creados: number;
  imagenesOmitidas: number;
}

function normalizarNombreCategoria(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/**
 * Caso de uso de orquestación para la Historia de Usuario 1: importar a la
 * biblioteca del usuario los ejercicios comunes seleccionados (FR-008 a
 * FR-011). Resuelve las categorías comunes por nombre contra las propias del
 * usuario, aplicando el mapeo manual indicado para las que no coinciden;
 * omite solo las imágenes de archivo con formato inválido (FR-011) y no deja
 * ninguna creación a medias si falla la resolución de categorías o la lectura
 * de una imagen por un problema de red (FR-023).
 */
@Injectable({ providedIn: 'root' })
export class ImportarEjerciciosComunesUseCase {
  private readonly repositorioComun = inject(RepositorioComunPort);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
  private readonly ajustesRepository = inject(AjustesRepositoryPort);

  /** Categorías comunes referenciadas por la selección que no coinciden por nombre con ninguna categoría propia (FR-009). */
  async obtenerCategoriasPendientes(seleccionados: EjercicioComunArchivo[]): Promise<CategoriaComun[]> {
    const [categoriasComunes, categoriasLocales] = await Promise.all([
      this.repositorioComun.listarCategorias(),
      this.categoriaRepository.listarTodas(),
    ]);
    const nombresLocales = new Set(categoriasLocales.map((categoria) => normalizarNombreCategoria(categoria.nombre)));
    const idsReferenciados = new Set(seleccionados.flatMap((ejercicio) => ejercicio.categoriaIds));
    return categoriasComunes.filter(
      (categoria) => idsReferenciados.has(categoria.id) && !nombresLocales.has(normalizarNombreCategoria(categoria.nombre))
    );
  }

  async importar(
    seleccionados: EjercicioComunArchivo[],
    mapeoManual: Map<string, string>
  ): Promise<ResultadoImportacionEjerciciosComunes> {
    const [categoriasComunes, categoriasLocales] = await Promise.all([
      this.repositorioComun.listarCategorias(),
      this.categoriaRepository.listarTodas(),
    ]);
    if (categoriasLocales.length === 0) {
      throw new ErrorValidacion('Crea antes al menos una categoría propia para poder importar ejercicios.');
    }

    const nombreComunPorId = new Map(categoriasComunes.map((categoria) => [categoria.id, categoria.nombre]));
    const idLocalPorNombre = new Map(
      categoriasLocales.map((categoria) => [normalizarNombreCategoria(categoria.nombre), categoria.id])
    );

    const resolverCategoriaId = (categoriaComunId: string): string => {
      const nombre = nombreComunPorId.get(categoriaComunId);
      const idPorNombre = nombre ? idLocalPorNombre.get(normalizarNombreCategoria(nombre)) : undefined;
      if (idPorNombre) return idPorNombre;
      const manual = mapeoManual.get(categoriaComunId);
      if (manual) return manual;
      throw new ErrorValidacion(
        `Falta indicar la categoría propia equivalente a «${nombre ?? categoriaComunId}» antes de importar.`
      );
    };

    // Primero se resuelven categorías e imágenes de todos los seleccionados, sin crear nada todavía,
    // para no dejar una importación a medias si algo falla a mitad (FR-023).
    const datosParaCrear = [];
    let imagenesOmitidas = 0;
    for (const ejercicioComun of seleccionados) {
      const categoriaIds = [...new Set(ejercicioComun.categoriaIds.map(resolverCategoriaId))];

      const imagenesArchivo = new Map<string, ImagenArchivoJSON>();
      for (const imagen of ejercicioComun.imagenes) {
        if (imagen.tipo !== 'archivo' || !imagen.ruta) continue;
        try {
          imagenesArchivo.set(imagen.id, await this.repositorioComun.leerImagen(ejercicioComun.id, imagen.ruta));
        } catch (error) {
          if (error instanceof ErrorValidacion) {
            imagenesOmitidas += 1;
            continue;
          }
          throw error;
        }
      }

      datosParaCrear.push(aDatosNuevoEjercicio(ejercicioComun, categoriaIds, imagenesArchivo));
    }

    for (const datos of datosParaCrear) {
      await this.ejercicioRepository.crear(datos);
    }
    await this.ajustesRepository.marcarCambiosLocalesPendientes();

    return { creados: datosParaCrear.length, imagenesOmitidas };
  }
}
