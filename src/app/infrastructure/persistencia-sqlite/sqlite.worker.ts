/// <reference lib="webworker" />

import type { Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { MotorSqlite } from './motor-sqlite';
import type { MensajeConexionSqlite, RespuestaConexionSqlite } from './conexion-sqlite.protocolo';

/**
 * Worker dedicado de persistencia SQLite. Se ejecuta íntegramente en el
 * navegador (nunca en el hilo principal) porque el VFS `opfs-sahpool`
 * requiere Synchronous Access Handles, que solo están disponibles dentro de
 * un Worker (research.md § 6). Si OPFS no está disponible, el worker informa
 * el fallo al cliente, que recurre al modo en memoria (ver sqlite-conexion.service.ts).
 */

const NOMBRE_VFS = 'opfs-sahpool-physical-exercises';

let motor: MotorSqlite | null = null;

async function crearMotorOpfs(): Promise<MotorSqlite> {
  const inicializar = (await import('@sqlite.org/sqlite-wasm')).default;
  const sqlite3: Sqlite3Static = await inicializar();
  const poolUtil = await sqlite3.installOpfsSAHPoolVfs({ name: NOMBRE_VFS });
  const db = new poolUtil.OpfsSAHPoolDb('/physical-exercises.sqlite3');
  return new MotorSqlite(db);
}

async function manejarMensaje(mensaje: MensajeConexionSqlite): Promise<RespuestaConexionSqlite> {
  try {
    switch (mensaje.tipo) {
      case 'inicializar': {
        motor = await crearMotorOpfs();
        await motor.aplicarEsquema();
        return { id: mensaje.id, ok: true, opfsDisponible: true };
      }
      case 'ejecutar': {
        if (!motor) throw new Error('El motor SQLite del worker no está inicializado');
        const filas = await motor.ejecutar(mensaje.sql, mensaje.parametros);
        return { id: mensaje.id, ok: true, filas };
      }
      case 'ejecutarSinResultado': {
        if (!motor) throw new Error('El motor SQLite del worker no está inicializado');
        await motor.ejecutarSinResultado(mensaje.sql, mensaje.parametros);
        return { id: mensaje.id, ok: true };
      }
    }
  } catch (error) {
    return { id: mensaje.id, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

addEventListener('message', ({ data }: MessageEvent<MensajeConexionSqlite>) => {
  manejarMensaje(data).then((respuesta) => postMessage(respuesta));
});
