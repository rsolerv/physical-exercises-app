import type { Categoria } from '../../domain/categoria/categoria.entity';

/**
 * Puerto que Application usa para leer y escribir Categorías
 * (contracts/categoria-repository.port.md).
 */
export abstract class CategoriaRepositoryPort {
  /** Ordenadas alfabéticamente por nombre (Assumptions del spec). */
  abstract listarTodas(): Promise<Categoria[]>;

  abstract obtenerPorId(id: string): Promise<Categoria | null>;

  abstract crear(nombre: string, descripcion?: string): Promise<Categoria>;

  abstract actualizar(id: string, cambios: { nombre?: string; descripcion?: string }): Promise<Categoria>;

  /**
   * Elimina la categoría. Application debe comprobar antes que todos los
   * ejercicios asociados conservan al menos otra categoría.
   */
  abstract eliminar(id: string): Promise<void>;

  /** Restaura una categoría eliminada conservando su identificador original (FR-069). */
  abstract restaurar(categoria: Categoria): Promise<void>;
}
