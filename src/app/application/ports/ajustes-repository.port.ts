/** Ajustes técnicos de la aplicación (ver data-model.md § Ajustes de aplicación). */
export interface AjustesAplicacion {
  tokenGitHub: string | null;
  repositorioGitHub: string | null;
  ultimaVersionSincronizada: string | null;
  ultimaSincronizacionCorrecta: Date | null;
  cambiosLocalesPendientes: boolean;
  catalogoPredefinidoCargado: boolean;
  metodoSincronizacion: 'github' | 'google' | null;
  cuentaGoogle: string | null;
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

  abstract conectarGoogle(correo: string): Promise<void>;

  abstract desconectarGoogle(): Promise<void>;

  abstract activarMetodo(metodo: 'github' | 'google'): Promise<void>;

  abstract registrarSincronizacionCompletada(
    destino: string,
    version: string,
    fecha: Date,
    datosLocalesCambiados: boolean
  ): Promise<void>;

  /**
   * Marca los datos locales como pendientes en todos los destinos sincronizados.
   */
  abstract marcarCambiosLocalesPendientes(): Promise<void>;

  abstract estaCatalogoPredefinidoCargado(): Promise<boolean>;

  /**
   * Invocado una única vez, tras insertar con éxito el catálogo de ejercicios
   * predefinidos y sus categorías en el primer arranque (FR-034).
   */
  abstract marcarCatalogoPredefinidoCargado(): Promise<void>;
}
