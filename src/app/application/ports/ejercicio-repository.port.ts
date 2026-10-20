import type { DatosNuevoEjercicio, Ejercicio } from '../../domain/ejercicio/ejercicio.entity';

/**
 * Puerto que Application usa para leer y escribir Ejercicios, sin conocer el
 * detalle de SQLite WASM (contracts/ejercicio-repository.port.md).
 */
export abstract class EjercicioRepositoryPort {
  abstract obtenerPorId(id: string): Promise<Ejercicio | null>;

  abstract listarTodos(): Promise<Ejercicio[]>;

  /** Busca coincidencias parciales, sin distinguir mayúsculas/minúsculas (FR-013, CA6). */
  abstract buscarPorTexto(texto: string): Promise<Ejercicio[]>;

  /** Devuelve ejercicios que pertenezcan a alguna de las categorías indicadas (FR-012, CA7). */
  abstract buscarPorCategorias(categoriaIds: string[]): Promise<Ejercicio[]>;

  abstract crear(datos: DatosNuevoEjercicio): Promise<Ejercicio>;

  abstract actualizar(id: string, cambios: Partial<DatosNuevoEjercicio>): Promise<Ejercicio>;

  /** Debe propagar la eliminación a todas las planificaciones que lo referencien (FR-028). */
  abstract eliminar(id: string): Promise<void>;

  /** Restaura un ejercicio eliminado con su identificador, datos y categorías originales (FR-069). */
  abstract restaurar(ejercicio: Ejercicio): Promise<void>;

  /**
   * Usado al eliminar una Categoría: retira `categoriaId` de todos los
   * ejercicios que la tengan; si algún ejercicio queda sin ninguna categoría,
   * le añade `categoriaGenericaId` (FR-011).
   */
  abstract quitarCategoriaDeTodos(categoriaId: string, categoriaGenericaId: string): Promise<void>;
}
