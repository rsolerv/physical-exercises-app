import { Injectable, inject } from '@angular/core';
import { AjustesAplicacion, AjustesRepositoryPort } from '../../application/ports/ajustes-repository.port';
import { SqliteConexionService } from './sqlite-conexion.service';

interface FilaAjustes {
  token_github: string | null;
  repositorio_github: string | null;
  ultimo_sha_sincronizado: string | null;
  cambios_locales_pendientes: number;
  catalogo_predefinido_cargado: number;
}

/** Adaptador SQLite del puerto `AjustesRepositoryPort` (contracts/ajustes-repository.port.md). */
@Injectable({ providedIn: 'root' })
export class AjustesRepositorySqlite implements AjustesRepositoryPort {
  private readonly conexion = inject(SqliteConexionService);

  async obtener(): Promise<AjustesAplicacion> {
    const filas = await this.conexion.ejecutar<FilaAjustes>(
      'SELECT token_github, repositorio_github, ultimo_sha_sincronizado, cambios_locales_pendientes, catalogo_predefinido_cargado ' +
        'FROM ajustes_aplicacion WHERE id = 1'
    );
    const fila = filas[0];
    return {
      tokenGitHub: fila.token_github,
      repositorioGitHub: fila.repositorio_github,
      ultimoShaSincronizado: fila.ultimo_sha_sincronizado,
      cambiosLocalesPendientes: fila.cambios_locales_pendientes === 1,
      catalogoPredefinidoCargado: fila.catalogo_predefinido_cargado === 1,
    };
  }

  async guardarCredencialesGitHub(tokenPAT: string, repositorio: string): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'UPDATE ajustes_aplicacion SET token_github = ?, repositorio_github = ? WHERE id = 1',
      [tokenPAT, repositorio]
    );
  }

  async olvidarCredencialesGitHub(): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'UPDATE ajustes_aplicacion SET token_github = NULL, repositorio_github = NULL WHERE id = 1'
    );
  }

  async actualizarUltimoShaSincronizado(sha: string): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'UPDATE ajustes_aplicacion SET ultimo_sha_sincronizado = ? WHERE id = 1',
      [sha]
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
