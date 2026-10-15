import { describe, it, expect } from 'vitest';
import { crearMotorSqliteEnMemoria, MotorSqlite } from '../../../src/app/infrastructure/persistencia-sqlite/motor-sqlite';
import { SqliteConexionService } from '../../../src/app/infrastructure/persistencia-sqlite/sqlite-conexion.service';
import type {
  MensajeConexionSqlite,
  RespuestaConexionSqlite,
  WorkerSimilar,
} from '../../../src/app/infrastructure/persistencia-sqlite/conexion-sqlite.protocolo';

type ManejadorMensajes = ((evento: MessageEvent<RespuestaConexionSqlite>) => void) | null;

/** Worker de prueba en memoria: aplica el esquema y responde al mismo protocolo que el Worker real. */
function crearWorkerDeMemoriaParaPruebas(): WorkerSimilar {
  let manejador: ManejadorMensajes = null;
  let motor: MotorSqlite | null = null;

  const responder = (respuesta: RespuestaConexionSqlite) =>
    manejador?.({ data: respuesta } as MessageEvent<RespuestaConexionSqlite>);

  return {
    postMessage(mensaje: MensajeConexionSqlite) {
      (async () => {
        try {
          if (mensaje.tipo === 'inicializar') {
            motor = await crearMotorSqliteEnMemoria();
            await motor.aplicarEsquema();
            responder({ id: mensaje.id, ok: true, opfsDisponible: true });
            return;
          }
          if (!motor) throw new Error('motor no inicializado');
          if (mensaje.tipo === 'ejecutar') {
            const filas = await motor.ejecutar(mensaje.sql, mensaje.parametros);
            responder({ id: mensaje.id, ok: true, filas });
          } else if (mensaje.tipo === 'ejecutarSinResultado') {
            await motor.ejecutarSinResultado(mensaje.sql, mensaje.parametros);
            responder({ id: mensaje.id, ok: true });
          }
        } catch (error) {
          responder({ id: mensaje.id, ok: false, error: error instanceof Error ? error.message : String(error) });
        }
      })();
    },
    set onmessage(valor: ManejadorMensajes) {
      manejador = valor;
    },
    terminate() {
      /* no-op */
    },
  };
}

/** Worker de prueba que siempre falla al inicializar (simula OPFS no disponible). */
function crearWorkerQueFalla(): WorkerSimilar {
  let manejador: ManejadorMensajes = null;
  return {
    postMessage(mensaje: MensajeConexionSqlite) {
      manejador?.({
        data: { id: mensaje.id, ok: false, error: 'OPFS no disponible en este navegador' },
      } as MessageEvent<RespuestaConexionSqlite>);
    },
    set onmessage(valor: ManejadorMensajes) {
      manejador = valor;
    },
    terminate() {
      /* no-op */
    },
  };
}

describe('Conexión y esquema SQLite (en memoria)', () => {
  it('crea todas las tablas del esquema', async () => {
    const motor = await crearMotorSqliteEnMemoria();
    await motor.aplicarEsquema();

    const tablas = await motor.ejecutar<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    );
    const nombres = tablas.map((t) => t.name);

    expect(nombres).toEqual(
      expect.arrayContaining([
        'ajustes_aplicacion',
        'categoria',
        'dia_planificacion',
        'dia_planificacion_ejercicio',
        'ejercicio',
        'ejercicio_categoria',
        'ejercicio_enlace',
        'ejercicio_imagen',
        'planificacion',
        'progreso_diario',
      ])
    );

    await motor.cerrar();
  });

  it('aplicar el esquema dos veces no falla (idempotente)', async () => {
    const motor = await crearMotorSqliteEnMemoria();
    await motor.aplicarEsquema();
    await expect(motor.aplicarEsquema()).resolves.toBeUndefined();
    await motor.cerrar();
  });

  it('activa PRAGMA foreign_keys', async () => {
    const motor = await crearMotorSqliteEnMemoria();
    await motor.aplicarEsquema();

    const resultado = await motor.ejecutar<{ foreign_keys: number }>('PRAGMA foreign_keys');
    expect(resultado[0].foreign_keys).toBe(1);

    await motor.cerrar();
  });

  it('borrar un ejercicio lo elimina en cascada de categorías, enlaces, imágenes y planificaciones (FR-028)', async () => {
    const motor = await crearMotorSqliteEnMemoria();
    await motor.aplicarEsquema();

    await motor.ejecutarSinResultado("INSERT INTO categoria (id, nombre, es_generica) VALUES ('cat-1', 'Rodilla', 0)");
    await motor.ejecutarSinResultado(
      "INSERT INTO ejercicio (id, nombre, descripcion) VALUES ('ej-1', 'Sentadilla', 'desc')"
    );
    await motor.ejecutarSinResultado(
      "INSERT INTO ejercicio_categoria (ejercicio_id, categoria_id) VALUES ('ej-1', 'cat-1')"
    );
    await motor.ejecutarSinResultado(
      "INSERT INTO ejercicio_enlace (id, ejercicio_id, tipo, url) VALUES ('enl-1', 'ej-1', 'web', 'https://example.com')"
    );
    await motor.ejecutarSinResultado("INSERT INTO planificacion (id, nombre) VALUES ('plan-1', 'Semana 1')");
    await motor.ejecutarSinResultado(
      "INSERT INTO dia_planificacion (id, planificacion_id, dia_semana) VALUES ('dia-1', 'plan-1', 'lunes')"
    );
    await motor.ejecutarSinResultado(
      "INSERT INTO dia_planificacion_ejercicio (dia_planificacion_id, ejercicio_id) VALUES ('dia-1', 'ej-1')"
    );
    await motor.ejecutarSinResultado(
      "INSERT INTO progreso_diario (fecha, ejercicio_id, realizado) VALUES ('2026-10-12', 'ej-1', 1)"
    );

    await motor.ejecutarSinResultado("DELETE FROM ejercicio WHERE id = 'ej-1'");

    expect(await motor.ejecutar('SELECT * FROM ejercicio_categoria')).toHaveLength(0);
    expect(await motor.ejecutar('SELECT * FROM ejercicio_enlace')).toHaveLength(0);
    expect(await motor.ejecutar('SELECT * FROM dia_planificacion_ejercicio')).toHaveLength(0);
    expect(await motor.ejecutar('SELECT * FROM progreso_diario')).toHaveLength(0);
    // La categoría y la planificación en sí mismas no se borran, solo las referencias al ejercicio.
    expect(await motor.ejecutar('SELECT * FROM categoria')).toHaveLength(1);
    expect(await motor.ejecutar('SELECT * FROM planificacion')).toHaveLength(1);

    await motor.cerrar();
  });

  it('inserta una fila por defecto en ajustes_aplicacion', async () => {
    const motor = await crearMotorSqliteEnMemoria();
    await motor.aplicarEsquema();

    const ajustes = await motor.ejecutar<{ cambios_locales_pendientes: number; catalogo_predefinido_cargado: number }>(
      'SELECT cambios_locales_pendientes, catalogo_predefinido_cargado FROM ajustes_aplicacion WHERE id = 1'
    );

    expect(ajustes).toHaveLength(1);
    expect(ajustes[0].cambios_locales_pendientes).toBe(0);
    expect(ajustes[0].catalogo_predefinido_cargado).toBe(0);

    await motor.cerrar();
  });
});

describe('SqliteConexionService', () => {
  it('en modo forzado a memoria, aplica el esquema y permite ejecutar consultas', async () => {
    const servicio = new SqliteConexionService();
    const resultado = await servicio.inicializar({ forzarEnMemoria: true });

    expect(resultado.opfsDisponible).toBe(false);
    await servicio.ejecutarSinResultado("INSERT INTO categoria (id, nombre, es_generica) VALUES ('c1', 'Rodilla', 0)");
    const filas = await servicio.ejecutar<{ nombre: string }>('SELECT nombre FROM categoria');
    expect(filas).toEqual([{ nombre: 'Rodilla' }]);
  });

  it('usa el Worker (simulado) cuando está disponible y reporta opfsDisponible = true', async () => {
    const servicio = new SqliteConexionService();
    const resultado = await servicio.inicializar({ fabricaWorker: crearWorkerDeMemoriaParaPruebas });

    expect(resultado.opfsDisponible).toBe(true);
    await servicio.ejecutarSinResultado("INSERT INTO categoria (id, nombre, es_generica) VALUES ('c1', 'Glúteo', 0)");
    const filas = await servicio.ejecutar<{ nombre: string }>('SELECT nombre FROM categoria');
    expect(filas).toEqual([{ nombre: 'Glúteo' }]);
  });

  it('si el Worker falla al inicializar (p. ej. sin OPFS), recurre al modo en memoria', async () => {
    const servicio = new SqliteConexionService();
    const resultado = await servicio.inicializar({ fabricaWorker: crearWorkerQueFalla });

    expect(resultado.opfsDisponible).toBe(false);
    // Debe seguir siendo utilizable (el esquema ya se aplicó en el modo de reserva).
    const filas = await servicio.ejecutar('SELECT name FROM sqlite_master WHERE type = \'table\'');
    expect(filas.length).toBeGreaterThan(0);
  });

  it('lanza un error si se usa antes de inicializar', async () => {
    const servicio = new SqliteConexionService();
    await expect(servicio.ejecutar('SELECT 1')).rejects.toThrow('no inicializado');
    await expect(servicio.ejecutarSinResultado('SELECT 1')).rejects.toThrow('no inicializado');
  });

  it('reutiliza la misma inicialización si se llama varias veces', async () => {
    const servicio = new SqliteConexionService();
    const [r1, r2] = await Promise.all([
      servicio.inicializar({ forzarEnMemoria: true }),
      servicio.inicializar({ forzarEnMemoria: true }),
    ]);
    expect(r1).toEqual(r2);
  });

  it('reutiliza la inicialización también cuando ya ha terminado (segunda llamada posterior)', async () => {
    const servicio = new SqliteConexionService();
    const primera = await servicio.inicializar({ forzarEnMemoria: true });
    const segunda = await servicio.inicializar({ forzarEnMemoria: true });
    expect(segunda).toEqual(primera);
  });

  it('cerrar() termina el Worker y permite volver a inicializar', async () => {
    const servicio = new SqliteConexionService();
    await servicio.inicializar({ fabricaWorker: crearWorkerDeMemoriaParaPruebas });
    await servicio.cerrar();
    await expect(servicio.ejecutar('SELECT 1')).rejects.toThrow('no inicializado');

    const resultado = await servicio.inicializar({ forzarEnMemoria: true });
    expect(resultado.opfsDisponible).toBe(false);
  });

  it('cerrar() cierra el motor en memoria cuando no hay Worker', async () => {
    const servicio = new SqliteConexionService();
    await servicio.inicializar({ forzarEnMemoria: true });
    await servicio.cerrar();
    await expect(servicio.ejecutar('SELECT 1')).rejects.toThrow('no inicializado');
  });

  it('cuando existe un Worker global y no se fuerza memoria ni se inyecta fábrica, intenta crear el Worker real por defecto', async () => {
    class WorkerDePruebaGlobal {
      onmessage: ((evento: MessageEvent<RespuestaConexionSqlite>) => void) | null = null;
      constructor(_url: string | URL, _opciones?: WorkerOptions) {
        /* simula una URL de módulo no soportada en este entorno de pruebas */
      }
      postMessage(mensaje: MensajeConexionSqlite) {
        queueMicrotask(() =>
          this.onmessage?.({
            data: { id: mensaje.id, ok: false, error: 'Worker de prueba global: sin OPFS' },
          } as MessageEvent<RespuestaConexionSqlite>)
        );
      }
      terminate() {
        /* no-op */
      }
    }
    const WorkerOriginal = globalThis.Worker;
    // @ts-expect-error -- sustitución deliberada del global `Worker` solo para esta prueba
    globalThis.Worker = WorkerDePruebaGlobal;
    try {
      const servicio = new SqliteConexionService();
      const resultado = await servicio.inicializar();
      // El Worker de prueba global falla a propósito, por lo que se recurre al modo en memoria.
      expect(resultado.opfsDisponible).toBe(false);
    } finally {
      globalThis.Worker = WorkerOriginal;
    }
  });
});
