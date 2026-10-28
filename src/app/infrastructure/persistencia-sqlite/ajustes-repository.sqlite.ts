import { Injectable, inject } from '@angular/core';
import { AjustesAplicacion, AjustesRepositoryPort } from '../../application/ports/ajustes-repository.port';
import { SqliteConexionService } from './sqlite-conexion.service';
import { ErrorValidacion } from '../../domain/errores/errores-dominio';
import { identificarDestinoSincronizacion } from '../../domain/sincronizacion/identificar-destino-sincronizacion';

interface FilaAjustes {
  token_github: string | null;
  repositorio_github: string | null;
  cambios_locales_pendientes: number;
  catalogo_predefinido_cargado: number;
  metodo_sincronizacion: string | null;
  cuenta_google: string | null;
}

interface FilaDestino {
  ultima_version: string;
  cambios_locales_pendientes: number;
  ultima_sincronizacion: string;
}

/** Adaptador SQLite del puerto `AjustesRepositoryPort` (contracts/ajustes-repository.port.md). */
@Injectable({ providedIn: 'root' })
export class AjustesRepositorySqlite implements AjustesRepositoryPort {
  private readonly conexion = inject(SqliteConexionService);

  async obtener(): Promise<AjustesAplicacion> {
    const filas = await this.conexion.ejecutar<FilaAjustes>(
      'SELECT token_github, repositorio_github, cambios_locales_pendientes, catalogo_predefinido_cargado, ' +
        'metodo_sincronizacion, cuenta_google FROM ajustes_aplicacion WHERE id = 1',
    );
    const fila = filas[0];
    if (fila.metodo_sincronizacion !== null && fila.metodo_sincronizacion !== 'github' && fila.metodo_sincronizacion !== 'google') {
      throw new ErrorValidacion('El método de sincronización guardado no es válido.');
    }

    const destino = identificarDestinoSincronizacion(
      fila.metodo_sincronizacion,
      fila.cuenta_google,
      fila.repositorio_github,
    );
    const filasDestino = destino
      ? await this.conexion.ejecutar<FilaDestino>(
          'SELECT ultima_version, cambios_locales_pendientes, ultima_sincronizacion ' +
            'FROM sincronizacion_destino WHERE destino = ?',
          [destino],
        )
      : [];
    const estadoDestino = filasDestino[0];

    return {
      tokenGitHub: fila.token_github,
      repositorioGitHub: fila.repositorio_github,
      ultimaVersionSincronizada: estadoDestino?.ultima_version ?? null,
      ultimaSincronizacionCorrecta: estadoDestino ? new Date(estadoDestino.ultima_sincronizacion) : null,
      cambiosLocalesPendientes: estadoDestino ? estadoDestino.cambios_locales_pendientes === 1 : false,
      catalogoPredefinidoCargado: fila.catalogo_predefinido_cargado === 1,
      metodoSincronizacion: fila.metodo_sincronizacion,
      cuentaGoogle: fila.cuenta_google,
    };
  }

  async guardarCredencialesGitHub(tokenPAT: string, repositorio: string): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      "UPDATE ajustes_aplicacion SET token_github = ?, repositorio_github = ?, " +
        "metodo_sincronizacion = CASE WHEN token_github IS NULL OR repositorio_github IS NULL " +
        "OR metodo_sincronizacion IS NULL THEN 'github' ELSE metodo_sincronizacion END WHERE id = 1",
      [tokenPAT, repositorio],
    );
  }

  async olvidarCredencialesGitHub(): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      "UPDATE ajustes_aplicacion SET token_github = NULL, repositorio_github = NULL, " +
        "metodo_sincronizacion = CASE WHEN metodo_sincronizacion = 'github' THEN NULL ELSE metodo_sincronizacion END WHERE id = 1",
    );
  }

  async conectarGoogle(correo: string): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      "UPDATE ajustes_aplicacion SET metodo_sincronizacion = 'google', cuenta_google = ? WHERE id = 1",
      [correo],
    );
  }

  async desconectarGoogle(): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      "UPDATE ajustes_aplicacion SET cuenta_google = NULL, " +
        "metodo_sincronizacion = CASE WHEN metodo_sincronizacion = 'google' THEN NULL ELSE metodo_sincronizacion END WHERE id = 1",
    );
  }

  async activarMetodo(metodo: 'github' | 'google'): Promise<void> {
    const ajustes = await this.obtener();
    const conectado =
      metodo === 'github'
        ? Boolean(ajustes.tokenGitHub && ajustes.repositorioGitHub)
        : ajustes.cuentaGoogle !== null;
    if (!conectado) throw new ErrorValidacion('Conecta este método antes de activarlo.');

    await this.conexion.ejecutarSinResultado(
      'UPDATE ajustes_aplicacion SET metodo_sincronizacion = ? WHERE id = 1',
      [metodo],
    );
  }

  async registrarSincronizacionCompletada(
    destino: string,
    version: string,
    fecha: Date,
    datosLocalesCambiados: boolean,
  ): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'INSERT INTO sincronizacion_destino ' +
        '(destino, ultima_version, cambios_locales_pendientes, ultima_sincronizacion) VALUES (?, ?, 0, ?) ' +
        'ON CONFLICT(destino) DO UPDATE SET ultima_version = excluded.ultima_version, ' +
        'cambios_locales_pendientes = 0, ultima_sincronizacion = excluded.ultima_sincronizacion',
      [destino, version, fecha.toISOString()],
    );
    if (datosLocalesCambiados) {
      await this.conexion.ejecutarSinResultado(
        'UPDATE sincronizacion_destino SET cambios_locales_pendientes = 1 WHERE destino <> ?',
        [destino],
      );
    }
  }

  async marcarCambiosLocalesPendientes(): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'UPDATE sincronizacion_destino SET cambios_locales_pendientes = 1',
    );
  }

  async estaCatalogoPredefinidoCargado(): Promise<boolean> {
    const filas = await this.conexion.ejecutar<{ catalogo_predefinido_cargado: number }>(
      'SELECT catalogo_predefinido_cargado FROM ajustes_aplicacion WHERE id = 1',
    );
    return filas[0].catalogo_predefinido_cargado === 1;
  }

  async marcarCatalogoPredefinidoCargado(): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'UPDATE ajustes_aplicacion SET catalogo_predefinido_cargado = 1 WHERE id = 1',
    );
  }
}
