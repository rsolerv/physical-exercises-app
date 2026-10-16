import type { ProgresoDiario } from '../../domain/progreso-diario/progreso-diario.entity';

/**
 * Puerto que Application usa para leer y escribir el Progreso diario, sin
 * conocer el detalle de SQLite WASM (contracts/progreso-diario-repository.port.md).
 */
export abstract class ProgresoDiarioRepositoryPort {
  /** Todos los registros de progreso (uno por ejercicio planificado) para una fecha concreta. */
  abstract obtenerPorFecha(fecha: Date): Promise<ProgresoDiario[]>;

  /** Crea o actualiza el registro de progreso para `(fecha, ejercicioId)` (FR-024). */
  abstract marcar(fecha: Date, ejercicioId: string, realizado: boolean): Promise<void>;
}
