/** Ajustes técnicos de la aplicación (ver data-model.md § Ajustes de aplicación). */
export interface AjustesAplicacion {
  tokenGitHub: string | null;
  repositorioGitHub: string | null;
  ultimoShaSincronizado: string | null;
  ultimaSincronizacionCorrecta: Date | null;
  cambiosLocalesPendientes: boolean;
  catalogoPredefinidoCargado: boolean;
}

/**
 * Puerto de soporte técnico (no es una entidad de negocio del spec) para el
 * almacenamiento del token de GitHub, el estado de la sincronización y la
 * bandera de siembra del catálogo predefinido.
 * Ver contracts/ajustes-repository.port.md.
 *
 * Es una clase abstracta (no una `interface`) para poder usarse como token de
 * inyección de dependencias de Angular: los casos de uso de Application piden
 * `AjustesRepositoryPort` por constructor y el adaptador concreto de
 * Infrastructure (`AjustesRepositorySqlite`) se registra como su implementación.
 */
export abstract class AjustesRepositoryPort {
  abstract obtener(): Promise<AjustesAplicacion>;

  abstract guardarCredencialesGitHub(tokenPAT: string, repositorio: string): Promise<void>;

  /** Borra token y repositorio guardados (acción "Olvidar token", FR-037). */
  abstract olvidarCredencialesGitHub(): Promise<void>;

  abstract actualizarUltimoShaSincronizado(sha: string): Promise<void>;

  /** Persiste la fecha UTC de la última sincronización completada correctamente (FR-070). */
  abstract registrarSincronizacionCorrecta(fecha: Date): Promise<void>;

  /**
   * true tras cualquier alta, modificación o borrado de datos de usuario;
   * false tras una sincronización completada (FR-035).
   */
  abstract marcarCambiosLocalesPendientes(pendientes: boolean): Promise<void>;

  abstract estaCatalogoPredefinidoCargado(): Promise<boolean>;

  /**
   * Invocado una única vez, tras insertar con éxito el catálogo de ejercicios
   * predefinidos y sus categorías en el primer arranque (FR-034).
   */
  abstract marcarCatalogoPredefinidoCargado(): Promise<void>;
}
