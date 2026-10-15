import { Injectable } from '@angular/core';
import type { BindingSpec } from '@sqlite.org/sqlite-wasm';
import { MotorSqlite, crearMotorSqliteEnMemoria } from './motor-sqlite';
import type { MensajeConexionSqlite, RespuestaConexionSqlite, WorkerSimilar } from './conexion-sqlite.protocolo';

/** Crea el Worker real de persistencia. Sustituible en los tests por un doble. */
function crearWorkerPorDefecto(): WorkerSimilar {
  return new Worker(new URL('./sqlite.worker', import.meta.url), { type: 'module' });
}

/**
 * Cliente que implementa el protocolo de `conexion-sqlite.protocolo.ts` contra
 * un Worker (real o de prueba), con correlación de mensajes por id.
 */
class ClienteWorkerSqlite {
  private siguienteId = 1;
  private readonly pendientes = new Map<number, (respuesta: RespuestaConexionSqlite) => void>();

  constructor(private readonly worker: WorkerSimilar) {
    this.worker.onmessage = (evento) => {
      const respuesta = evento.data;
      const resolver = this.pendientes.get(respuesta.id);
      if (resolver) {
        this.pendientes.delete(respuesta.id);
        resolver(respuesta);
      }
    };
  }

  private enviar(mensaje: MensajeConexionSqlite): Promise<RespuestaConexionSqlite> {
    return new Promise((resolve) => {
      this.pendientes.set(mensaje.id, resolve);
      this.worker.postMessage(mensaje);
    });
  }

  async inicializar(): Promise<{ opfsDisponible: boolean }> {
    const respuesta = await this.enviar({ id: this.siguienteId++, tipo: 'inicializar' });
    if (!respuesta.ok) throw new Error(respuesta.error);
    return { opfsDisponible: true };
  }

  async ejecutar<T>(sql: string, parametros?: BindingSpec): Promise<T[]> {
    const respuesta = await this.enviar({ id: this.siguienteId++, tipo: 'ejecutar', sql, parametros });
    if (!respuesta.ok) throw new Error(respuesta.error);
    return (respuesta as { filas: unknown[] }).filas as T[];
  }

  async ejecutarSinResultado(sql: string, parametros?: BindingSpec): Promise<void> {
    const respuesta = await this.enviar({ id: this.siguienteId++, tipo: 'ejecutarSinResultado', sql, parametros });
    if (!respuesta.ok) throw new Error(respuesta.error);
  }

  cerrar(): void {
    this.worker.terminate();
  }
}

export interface OpcionesInicializacionSqlite {
  /** Fuerza el modo en memoria, sin intentar crear un Worker (usado en pruebas). */
  forzarEnMemoria?: boolean;
  /** Fábrica alternativa del Worker, usada en pruebas para inyectar un doble. */
  fabricaWorker?: () => WorkerSimilar;
}

/**
 * Punto de acceso único a la persistencia SQLite para el resto de adaptadores
 * de Infrastructure. En el navegador delega en un Worker con OPFS (persistente
 * entre sesiones, FR-027); si el Worker no está disponible o falla al
 * inicializar OPFS, recurre a una base de datos en memoria y lo indica en
 * `opfsDisponible`, para que la aplicación pueda avisar de que los datos no se
 * conservarán (Assumptions del spec).
 */
@Injectable({ providedIn: 'root' })
export class SqliteConexionService {
  private cliente: ClienteWorkerSqlite | null = null;
  private motorEnMemoria: MotorSqlite | null = null;
  private opfsDisponible = false;
  private inicializacionEnCurso: Promise<{ opfsDisponible: boolean }> | null = null;

  async inicializar(opciones: OpcionesInicializacionSqlite = {}): Promise<{ opfsDisponible: boolean }> {
    if (this.cliente || this.motorEnMemoria) {
      return { opfsDisponible: this.opfsDisponible };
    }
    if (!this.inicializacionEnCurso) {
      this.inicializacionEnCurso = this.inicializarInterno(opciones);
    }
    return this.inicializacionEnCurso;
  }

  private async inicializarInterno(opciones: OpcionesInicializacionSqlite): Promise<{ opfsDisponible: boolean }> {
    const puedeUsarWorker = !opciones.forzarEnMemoria && (!!opciones.fabricaWorker || typeof Worker !== 'undefined');

    if (puedeUsarWorker) {
      try {
        const worker = (opciones.fabricaWorker ?? crearWorkerPorDefecto)();
        const cliente = new ClienteWorkerSqlite(worker);
        const resultado = await cliente.inicializar();
        this.cliente = cliente;
        this.opfsDisponible = resultado.opfsDisponible;
        return { opfsDisponible: this.opfsDisponible };
      } catch {
        // Se degrada silenciosamente al modo en memoria; el aviso al usuario
        // de que los datos no persistirán lo construye el caso de uso de
        // arranque a partir de `opfsDisponible` (FR-027).
      }
    }

    this.motorEnMemoria = await crearMotorSqliteEnMemoria();
    await this.motorEnMemoria.aplicarEsquema();
    this.opfsDisponible = false;
    return { opfsDisponible: false };
  }

  async ejecutar<T = Record<string, unknown>>(sql: string, parametros?: BindingSpec): Promise<T[]> {
    if (this.cliente) return this.cliente.ejecutar<T>(sql, parametros);
    if (this.motorEnMemoria) return this.motorEnMemoria.ejecutar<T>(sql, parametros);
    throw new Error('SqliteConexionService no inicializado: llama a inicializar() antes de usarlo');
  }

  async ejecutarSinResultado(sql: string, parametros?: BindingSpec): Promise<void> {
    if (this.cliente) return this.cliente.ejecutarSinResultado(sql, parametros);
    if (this.motorEnMemoria) return this.motorEnMemoria.ejecutarSinResultado(sql, parametros);
    throw new Error('SqliteConexionService no inicializado: llama a inicializar() antes de usarlo');
  }

  /** Libera los recursos (termina el Worker o cierra la base de datos en memoria). */
  async cerrar(): Promise<void> {
    this.cliente?.cerrar();
    this.cliente = null;
    if (this.motorEnMemoria) {
      await this.motorEnMemoria.cerrar();
      this.motorEnMemoria = null;
    }
    this.inicializacionEnCurso = null;
  }
}
