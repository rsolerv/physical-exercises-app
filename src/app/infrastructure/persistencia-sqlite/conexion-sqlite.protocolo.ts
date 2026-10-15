import type { BindingSpec } from '@sqlite.org/sqlite-wasm';

/** Protocolo de mensajes entre `SqliteConexionService` (hilo principal) y `sqlite.worker.ts`. */
export type MensajeConexionSqlite =
  | { id: number; tipo: 'inicializar' }
  | { id: number; tipo: 'ejecutar'; sql: string; parametros?: BindingSpec }
  | { id: number; tipo: 'ejecutarSinResultado'; sql: string; parametros?: BindingSpec };

export type RespuestaConexionSqlite =
  | { id: number; ok: true; opfsDisponible: true }
  | { id: number; ok: true; filas: unknown[] }
  | { id: number; ok: true }
  | { id: number; ok: false; error: string };

/**
 * Lo mínimo que `SqliteConexionService` necesita de un Worker para poder
 * sustituirlo por un doble de prueba en los tests (ya que `jsdom` no
 * implementa `Worker` de verdad).
 */
export interface WorkerSimilar {
  postMessage(mensaje: MensajeConexionSqlite): void;
  set onmessage(manejador: ((evento: MessageEvent<RespuestaConexionSqlite>) => void) | null);
  terminate(): void;
}
