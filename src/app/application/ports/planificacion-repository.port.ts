import type { DatosNuevaPlanificacion, DiaSemana, Planificacion } from '../../domain/planificacion/planificacion.entity';

/**
 * Puerto que Application usa para leer y escribir Planificaciones, sin
 * conocer el detalle de SQLite WASM (contracts/planificacion-repository.port.md).
 */
export abstract class PlanificacionRepositoryPort {
  abstract obtenerPorId(id: string): Promise<Planificacion | null>;

  abstract listarTodas(): Promise<Planificacion[]>;

  /**
   * Planificación concreta (no plantilla) cuya semana lunes-domingo contiene
   * `fechaReferencia`, o `null` si no existe ninguna (CL2). El cálculo de
   * "activa" es siempre por fecha, nunca por una marca manual almacenada.
   */
  abstract obtenerActiva(fechaReferencia: Date): Promise<Planificacion | null>;

  /**
   * Si `datos.fechaInicio` tiene valor, DEBE ser un lunes (si no,
   * `ErrorValidacion`) y no puede existir otra planificación concreta con la
   * misma `fechaInicio` (FR-017, FR-022); si existe, lanza
   * `ErrorPlanificacionActivaDuplicada`.
   */
  abstract crear(datos: DatosNuevaPlanificacion): Promise<Planificacion>;

  /** Mismas validaciones que `crear()` cuando se modifica `fechaInicio` (excluyendo la propia planificación). */
  abstract actualizar(id: string, cambios: Partial<DatosNuevaPlanificacion>): Promise<Planificacion>;

  /** Crea una copia independiente con los mismos días/ejercicios, sin `fechaInicio` (FR-019, CA14). */
  abstract duplicar(id: string, nuevoNombre: string): Promise<Planificacion>;

  /** Lanza `ErrorEjercicioDuplicadoEnDia` si `ejercicioId` ya está en ese día de esa planificación (FR-021). */
  abstract asignarEjercicioADia(planificacionId: string, dia: DiaSemana, ejercicioId: string): Promise<void>;

  abstract quitarEjercicioDeDia(planificacionId: string, dia: DiaSemana, ejercicioId: string): Promise<void>;

  /** Todas las planificaciones donde aparece un ejercicio dado (soporte de FR-028 al eliminarlo). */
  abstract listarPorEjercicio(ejercicioId: string): Promise<Planificacion[]>;
}
