import type { Database, BindingSpec } from '@sqlite.org/sqlite-wasm';
import { ESQUEMA_SQL } from './esquema';

/**
 * Envoltorio fino sobre una instancia `Database` de `@sqlite.org/sqlite-wasm`
 * (válido tanto para `oo1.DB` en memoria como para `OpfsSAHPoolDatabase` dentro
 * del Worker). Expone una API basada en `Promise` para que, desde el punto de
 * vista de Application, el acceso a datos siempre sea asíncrono, tanto si la
 * ejecución real es síncrona (aquí, en el mismo hilo) como si en el futuro se
 * sirve a través de mensajes desde un Worker (ver `ConexionSqliteWorkerCliente`).
 */
export class MotorSqlite {
  constructor(private readonly db: Database) {}

  /** Aplica el esquema y las migraciones compatibles con instalaciones existentes. */
  async aplicarEsquema(): Promise<void> {
    this.db.exec(ESQUEMA_SQL);
    const columnasAjustes = this.db.exec({
      sql: 'PRAGMA table_info(ajustes_aplicacion)',
      returnValue: 'resultRows',
      rowMode: 'object',
    }) as { name: string }[];
    if (!columnasAjustes.some((columna) => columna.name === 'ultima_sincronizacion_correcta')) {
      this.db.exec('ALTER TABLE ajustes_aplicacion ADD COLUMN ultima_sincronizacion_correcta TEXT');
    }

    const columnasCategoria = this.db.exec({
      sql: 'PRAGMA table_info(categoria)',
      returnValue: 'resultRows',
      rowMode: 'object',
    }) as { name: string }[];
    if (columnasCategoria.some((columna) => columna.name === 'es_generica')) {
      this.db.exec(
        'DELETE FROM categoria WHERE es_generica = 1 AND NOT EXISTS (' +
          'SELECT 1 FROM ejercicio_categoria WHERE ejercicio_categoria.categoria_id = categoria.id)'
      );
    }
  }

  /** Ejecuta una consulta y devuelve las filas como objetos. */
  async ejecutar<T = Record<string, unknown>>(sql: string, parametros?: BindingSpec): Promise<T[]> {
    const filas = this.db.exec({
      sql,
      bind: parametros,
      returnValue: 'resultRows',
      rowMode: 'object',
    });
    return filas as T[];
  }

  /** Ejecuta una sentencia sin resultado (INSERT/UPDATE/DELETE). */
  async ejecutarSinResultado(sql: string, parametros?: BindingSpec): Promise<void> {
    this.db.exec({ sql, bind: parametros });
  }

  async cerrar(): Promise<void> {
    this.db.close();
  }
}

/**
 * Crea un `MotorSqlite` en memoria (sin OPFS). Se usa en las pruebas
 * automatizadas (research.md § 6) y como modo de reserva en el navegador
 * cuando OPFS no está disponible (FR-027, Assumptions del spec).
 */
export async function crearMotorSqliteEnMemoria(): Promise<MotorSqlite> {
  const inicializar = (await import('@sqlite.org/sqlite-wasm')).default;
  const sqlite3 = await inicializar();
  const db = new sqlite3.oo1.DB(':memory:', 'c');
  return new MotorSqlite(db);
}
