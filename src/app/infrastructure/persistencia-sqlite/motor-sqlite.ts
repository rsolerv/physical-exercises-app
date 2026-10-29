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

    for (const columna of ['metodo_sincronizacion', 'cuenta_google', 'destino_ultima_sincronizacion']) {
      if (!columnasAjustes.some((existente) => existente.name === columna)) {
        this.db.exec(`ALTER TABLE ajustes_aplicacion ADD COLUMN ${columna} TEXT`);
      }
    }
    this.db.exec(
      "UPDATE ajustes_aplicacion SET metodo_sincronizacion = 'github' " +
        'WHERE metodo_sincronizacion IS NULL AND token_github IS NOT NULL AND repositorio_github IS NOT NULL'
    );
    const destinos = this.db.exec({
      sql: 'SELECT COUNT(*) AS cantidad FROM sincronizacion_destino',
      returnValue: 'resultRows',
      rowMode: 'object',
    }) as { cantidad: number }[];
    if (destinos[0].cantidad === 0) {
      const ajustesAnteriores = this.db.exec({
        sql: 'SELECT ultimo_sha_sincronizado, destino_ultima_sincronizacion, repositorio_github, ' +
          'cambios_locales_pendientes, ultima_sincronizacion_correcta FROM ajustes_aplicacion WHERE id = 1',
        returnValue: 'resultRows',
        rowMode: 'object',
      }) as {
        ultimo_sha_sincronizado: string | null;
        destino_ultima_sincronizacion: string | null;
        repositorio_github: string | null;
        cambios_locales_pendientes: number;
        ultima_sincronizacion_correcta: string | null;
      }[];
      const anterior = ajustesAnteriores[0];
      if (anterior.ultimo_sha_sincronizado && anterior.destino_ultima_sincronizacion) {
        const destinoAnterior = anterior.destino_ultima_sincronizacion;
        const destino = destinoAnterior === 'github'
          ? anterior.repositorio_github
            ? `github:${anterior.repositorio_github}`
            : null
          : destinoAnterior;
        if (destino) {
          this.db.exec({
            sql: 'INSERT OR IGNORE INTO sincronizacion_destino ' +
              '(destino, ultima_version, cambios_locales_pendientes, ultima_sincronizacion) VALUES (?, ?, ?, ?)',
            bind: [
              destino,
              anterior.ultimo_sha_sincronizado,
              anterior.cambios_locales_pendientes,
              anterior.ultima_sincronizacion_correcta ?? new Date().toISOString(),
            ],
          });
        }
      }
    }

    const columnasEjercicio = this.db.exec({
      sql: 'PRAGMA table_info(ejercicio)',
      returnValue: 'resultRows',
      rowMode: 'object',
    }) as { name: string }[];
    if (!columnasEjercicio.some((columna) => columna.name === 'subido_repositorio_comun')) {
      this.db.exec('ALTER TABLE ejercicio ADD COLUMN subido_repositorio_comun INTEGER NOT NULL DEFAULT 0');
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
