import { Injectable, inject } from '@angular/core';
import { CategoriaRepositoryPort } from '../ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { SembrarCatalogoPredefinidoPort } from '../ports/sembrar-catalogo-predefinido.port';
import type { EnlaceEjercicio } from '../../domain/ejercicio/ejercicio.entity';
import catalogoPredefinido from '../../../assets/catalogo-predefinido/catalogo.json';

/**
 * Siembra el catálogo de ejercicios y sus categorías predefinidas (FR-034)
 * la primera vez que arranca la aplicación. El contenido del catálogo está aprobado en
 * specs/001-gestion-ejercicios-fisicos/catalogo-predefinido.json y se copia
 * tal cual a `src/assets/catalogo-predefinido/catalogo.json`.
 *
 * NO marca `cambiosLocalesPendientes`, para que un dispositivo nuevo no se
 * considere "con cambios locales" en su primera sincronización
 * (contracts/ajustes-repository.port.md).
 */
@Injectable({ providedIn: 'root' })
export class SembrarCatalogoPredefinidoUseCase implements SembrarCatalogoPredefinidoPort {
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
  private readonly ajustesRepository = inject(AjustesRepositoryPort);

  async sembrarSiNecesario(): Promise<void> {
    const yaCargado = await this.ajustesRepository.estaCatalogoPredefinidoCargado();
    if (yaCargado) return;

    const idsPorNombreCategoria = new Map<string, string>();
    for (const categoria of catalogoPredefinido.categorias) {
      const creada = await this.categoriaRepository.crear(categoria.nombre, categoria.descripcion);
      idsPorNombreCategoria.set(categoria.nombre, creada.id);
    }

    for (const ejercicio of catalogoPredefinido.ejercicios) {
      const categoriaIds = ejercicio.categorias.map((nombre) => {
        const id = idsPorNombreCategoria.get(nombre);
        if (!id) throw new Error(`El catálogo predefinido referencia una categoría inexistente: "${nombre}".`);
        return id;
      });
      const enlaces: EnlaceEjercicio[] = [
        ...ejercicio.enlacesWeb.map((url): EnlaceEjercicio => ({ tipo: 'web', url })),
        ...ejercicio.enlacesYoutube.map((url): EnlaceEjercicio => ({ tipo: 'youtube', url })),
      ];
      await this.ejercicioRepository.crear({
        nombre: ejercicio.nombre,
        descripcion: ejercicio.descripcion,
        categoriaIds,
        enlaces,
        imagenes: [],
        observaciones: ejercicio.observaciones,
      });
    }

    await this.ajustesRepository.marcarCatalogoPredefinidoCargado();
  }
}
