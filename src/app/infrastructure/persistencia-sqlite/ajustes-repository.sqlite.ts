import { Injectable, inject } from '@angular/core';
import { AjustesAplicacion, AjustesRepositoryPort } from '../../application/ports/ajustes-repository.port';
import { SqliteConexionService } from './sqlite-conexion.service';
import { ErrorValidacion } from '../../domain/errores/errores-dominio';

interface FilaAjustes {
  token_github: string | null;
  repositorio_github: string | null;
  ultimo_sha_sincronizado: string | null;
  ultima_sincronizacion_correcta: string | null;
  cambios_locales_pendientes: number;
  catalogo_predefinido_cargado: number;
  metodo_sincronizacion: string | null;
  cuenta_google: string | null;
  destino_ultima_sincronizacion: string | null;
}

/** Adaptador SQLite del puerto `AjustesRepositoryPort` (contracts/ajustes-repository.port.md). */
@Injectable({ providedIn: 'root' })
export class AjustesRepositorySqlite implements AjustesRepositoryPort {
  private readonly conexion = inject(SqliteConexionService);

  async obtener(): Promise<AjustesAplicacion> {
    const filas = await this.conexion.ejecutar<FilaAjustes>(
      'SELECT token_github, repositorio_github, ultimo_sha_sincronizado, ultima_sincronizacion_correcta, cambios_locales_pendientes, catalogo_predefinido_cargado, ' +
        'metodo_sincronizacion, cuenta_google, destino_ultima_sincronizacion ' +
        'FROM ajustes_aplicacion WHERE id = 1'
    );
    const fila = filas[0];
    if (fila.metodo_sincronizacion !== null && fila.metodo_sincronizacion !== 'github' && fila.metodo_sincronizacion !== 'google') {
      throw new ErrorValidacion('El método de sincronización guardado no es válido.');
    }
    return {
      tokenGitHub: fila.token_github,
      repositorioGitHub: fila.repositorio_github,
      ultimaVersionSincronizada: fila.ultimo_sha_sincronizado,
      ultimaSincronizacionCorrecta: fila.ultima_sincronizacion_correcta ? new Date(fila.ultima_sincronizacion_correcta) : null,
      cambiosLocalesPendientes: fila.cambios_locales_pendientes === 1,
      catalogoPredefinidoCargado: fila.catalogo_predefinido_cargado === 1,
      metodoSincronizacion: fila.metodo_sincronizacion,
      cuentaGoogle: fila.cuenta_google,
      destinoUltimaSincronizacion: fila.destino_ultima_sincronizacion,
    };
  }

  async guardarCredencialesGitHub(tokenPAT: string, repositorio: string): Promise<void> {
    if ((await this.obtener()).metodoSincronizacion === 'google') {
      throw new ErrorValidacion('Desconecta tu cuenta de Google antes de configurar GitHub.');
    }
    await this.conexion.ejecutarSinResultado(
      "UPDATE ajustes_aplicacion SET token_github = ?, repositorio_github = ?, metodo_sincronizacion = 'github', cuenta_google = NULL WHERE id = 1",
      [tokenPAT, repositorio]
    );
  }

  async olvidarCredencialesGitHub(): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      "UPDATE ajustes_aplicacion SET token_github = NULL, repositorio_github = NULL, " +
        "metodo_sincronizacion = CASE WHEN metodo_sincronizacion = 'github' THEN NULL ELSE metodo_sincronizacion END WHERE id = 1"
    );
  }

  async actualizarUltimaVersionSincronizada(version: string): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'UPDATE ajustes_aplicacion SET ultimo_sha_sincronizado = ? WHERE id = 1',
      [version]
    );
  }

  async conectarGoogle(correo: string): Promise<void> {
    if ((await this.obtener()).metodoSincronizacion === 'github') {
      throw new ErrorValidacion('Olvida el token de GitHub antes de conectar Google.');
    }
    await this.conexion.ejecutarSinResultado(
      "UPDATE ajustes_aplicacion SET metodo_sincronizacion = 'google', cuenta_google = ? WHERE id = 1",
      [correo]
    );
  }

  async desconectarGoogle(): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'UPDATE ajustes_aplicacion SET metodo_sincronizacion = NULL, cuenta_google = NULL WHERE id = 1'
    );
  }

  async registrarDestinoSincronizado(destino: string): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'UPDATE ajustes_aplicacion SET destino_ultima_sincronizacion = ? WHERE id = 1',
      [destino]
    );
  }

  async registrarSincronizacionCorrecta(fecha: Date): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'UPDATE ajustes_aplicacion SET ultima_sincronizacion_correcta = ? WHERE id = 1',
      [fecha.toISOString()]
    );
  }

  async marcarCambiosLocalesPendientes(pendientes: boolean): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'UPDATE ajustes_aplicacion SET cambios_locales_pendientes = ? WHERE id = 1',
      [pendientes ? 1 : 0]
    );
  }

  async estaCatalogoPredefinidoCargado(): Promise<boolean> {
    return (await this.obtener()).catalogoPredefinidoCargado;
  }

  async marcarCatalogoPredefinidoCargado(): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'UPDATE ajustes_aplicacion SET catalogo_predefinido_cargado = 1 WHERE id = 1'
    );
  }
}
