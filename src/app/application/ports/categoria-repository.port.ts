import type { Categoria } from '../../domain/categoria/categoria.entity';

/**
 * Puerto que Application usa para leer y escribir Categorías
 * (contracts/categoria-repository.port.md).
 */
export abstract class CategoriaRepositoryPort {
  /** Ordenadas alfabéticamente por nombre (Assumptions del spec). */
  abstract listarTodas(): Promise<Categoria[]>;

  abstract obtenerPorId(id: string): Promise<Categoria | null>;

  /** Devuelve la categoría de fábrica "Sin categoría" (esGenerica = true). */
  abstract obtenerGenerica(): Promise<Categoria>;

  abstract crear(nombre: string, descripcion?: string): Promise<Categoria>;

  /**
   * Crea la categoría de fábrica "Sin categoría" (`esGenerica = true`).
   * Solo debe invocarse una vez, durante la siembra del catálogo predefinido
   * (FR-034, FR-011).
   */
  abstract crearGenerica(nombre: string): Promise<Categoria>;

  abstract actualizar(id: string, cambios: { nombre?: string; descripcion?: string }): Promise<Categoria>;

  /**
   * Elimina la categoría. Si tiene ejercicios asociados, el llamador (caso de
   * uso de Application) debe invocar antes
   * `EjercicioRepositoryPort.quitarCategoriaDeTodos()` para no dejar
   * ejercicios sin categoría (FR-011).
   */
  abstract eliminar(id: string): Promise<void>;

  /** Restaura una categoría eliminada conservando su identificador original (FR-069). */
  abstract restaurar(categoria: Categoria): Promise<void>;
}
