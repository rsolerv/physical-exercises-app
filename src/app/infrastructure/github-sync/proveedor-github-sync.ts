import { Injectable, inject } from '@angular/core';
import { AjustesRepositoryPort } from '../../application/ports/ajustes-repository.port';
import { GitHubSyncPort, type ExportacionJSON, type ImagenArchivoJSON } from '../../application/ports/github-sync.port';
import { ProveedorSincronizacionPort, type LecturaRemota } from '../../application/ports/proveedor-sincronizacion.port';
import { ErrorValidacion } from '../../domain/errores/errores-dominio';

@Injectable({ providedIn: 'root' })
export class ProveedorGithubSync implements ProveedorSincronizacionPort {
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly githubSync = inject(GitHubSyncPort);

  async leerRemoto(): Promise<LecturaRemota> {
    const credenciales = await this.obtenerCredenciales();
    const lectura = await this.githubSync.leerRemoto(credenciales);
    return lectura.existe
      ? { existe: true, datos: lectura.datos, version: lectura.sha }
      : { existe: false };
  }

  async escribirRemoto(
    datos: ExportacionJSON,
    imagenes: ImagenArchivoJSON[],
    versionEsperada: string | null
  ): Promise<{ versionNueva: string }> {
    const credenciales = await this.obtenerCredenciales();
    const resultado = await this.githubSync.escribirRemoto(credenciales, datos, imagenes, versionEsperada);
    return { versionNueva: resultado.shaNuevo };
  }

  async leerImagen(ruta: string): Promise<ImagenArchivoJSON> {
    const credenciales = await this.obtenerCredenciales();
    return this.githubSync.leerImagen(credenciales, ruta);
  }

  private async obtenerCredenciales(): Promise<{ tokenPAT: string; repositorio: string }> {
    const ajustes = await this.ajustesRepository.obtener();
    if (!ajustes.tokenGitHub || !ajustes.repositorioGitHub) {
      throw new ErrorValidacion('Configura el token y el repositorio de GitHub antes de sincronizar.');
    }
    return { tokenPAT: ajustes.tokenGitHub, repositorio: ajustes.repositorioGitHub };
  }
}
