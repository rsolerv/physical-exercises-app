import { Injectable, inject } from '@angular/core';
import { RepositorioComunPort, type CategoriaComun } from '../ports/repositorio-comun.port';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { EjercicioRepositoryPort } from '../ports/ejercicio-repository.port';
import type { CredencialesGitHub } from '../ports/github-sync.port';
import type { Ejercicio } from '../../domain/ejercicio/ejercicio.entity';
import { cumpleRequisitoRepositorioComun } from '../../domain/ejercicio/cumple-requisito-repositorio-comun';
import { aEjercicioComun } from '../../domain/ejercicio/convertir-ejercicio-comun';
import { ErrorNombreDuplicado, ErrorValidacion } from '../../domain/errores/errores-dominio';

/**
 * Caso de uso de orquestación para la Historia de Usuario 2: subir un
 * ejercicio propio elegible al repositorio común (FR-014 a FR-022). Exige
 * credenciales de GitHub ya guardadas y el requisito mínimo del ejercicio,
 * comprueba duplicados en `main` antes de confirmar y marca el ejercicio
 * local como subido únicamente después de completar la subida.
 */
@Injectable({ providedIn: 'root' })
export class SubirEjercicioComunUseCase {
  private readonly repositorioComun = inject(RepositorioComunPort);
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);

  /** Decide si la acción "Subir al repositorio común" debe ofrecerse para este ejercicio (FR-014, FR-015, FR-021). */
  async puedeOfrecerSubida(ejercicio: Ejercicio): Promise<boolean> {
    if (ejercicio.subidoRepositorioComun) return false;
    if (!cumpleRequisitoRepositorioComun(ejercicio)) return false;
    const ajustes = await this.ajustesRepository.obtener();
    return Boolean(ajustes.tokenGitHub);
  }

  async listarCategoriasComunes(): Promise<CategoriaComun[]> {
    return this.repositorioComun.listarCategorias();
  }

  /** Comprueba si ya existe un ejercicio publicado con ese nombre en `main` (FR-017). */
  async comprobarDuplicado(nombre: string): Promise<boolean> {
    await this.obtenerCredenciales();
    return this.repositorioComun.existeEjercicioPorNombre(nombre);
  }

  async subir(ejercicio: Ejercicio, categoriaIdsComunes: string[]): Promise<void> {
    if (!cumpleRequisitoRepositorioComun(ejercicio)) {
      throw new ErrorValidacion(
        'El ejercicio necesita al menos una imagen o un enlace de YouTube para subirse al repositorio común.'
      );
    }
    if (categoriaIdsComunes.length === 0) {
      throw new ErrorValidacion('Elige al menos una categoría del repositorio común antes de subir el ejercicio.');
    }

    const credenciales = await this.obtenerCredenciales();
    const yaExiste = await this.repositorioComun.existeEjercicioPorNombre(ejercicio.nombre);
    if (yaExiste) {
      throw new ErrorNombreDuplicado('Ya existe un ejercicio con este nombre en el repositorio común.');
    }

    const { datos, imagenesArchivo } = aEjercicioComun(ejercicio, categoriaIdsComunes);
    await this.repositorioComun.subirEjercicio(credenciales, datos, imagenesArchivo);
    await this.ejercicioRepository.marcarSubidoRepositorioComun(ejercicio.id);
  }

  private async obtenerCredenciales(): Promise<CredencialesGitHub> {
    const ajustes = await this.ajustesRepository.obtener();
    if (!ajustes.tokenGitHub) {
      throw new ErrorValidacion('Configura tu token de GitHub antes de subir ejercicios al repositorio común.');
    }
    return { tokenPAT: ajustes.tokenGitHub, repositorio: ajustes.repositorioGitHub ?? '' };
  }
}
