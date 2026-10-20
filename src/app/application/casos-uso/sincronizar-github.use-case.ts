import { Injectable, inject } from '@angular/core';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { GitHubSyncPort, type CredencialesGitHub, type ExportacionJSON } from '../ports/github-sync.port';
import { ExportarImportarDatosUseCase } from './exportar-importar-datos.use-case';
import { decidirAccionSincronizacion } from '../../domain/sincronizacion/decidir-accion-sincronizacion';
import { ErrorValidacion } from '../../domain/errores/errores-dominio';

export type ResultadoSincronizacion =
  | { tipo: 'completada'; accion: 'subir' | 'descargar' | 'nada' }
  | { tipo: 'conflicto'; opcionPorDefecto: 'conservar_local' | 'conservar_remoto'; datosRemotos: ExportacionJSON; sha: string };

/**
 * Caso de uso de orquestación para la Historia de Usuario 5: sincroniza los
 * datos locales con GitHub. La decisión de qué acción tomar la calcula el
 * dominio puro `decidir-accion-sincronizacion`; este caso de uso solo la
 * ejecuta y persiste el resultado (`últimoShaSincronizado`,
 * `cambiosLocalesPendientes`). Ante cualquier error de red o autenticación,
 * no modifica ningún dato local (CL4, FR-032).
 */
@Injectable({ providedIn: 'root' })
export class SincronizarGithubUseCase {
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly githubSync = inject(GitHubSyncPort);
  private readonly exportarImportarDatos = inject(ExportarImportarDatosUseCase);

  async sincronizar(): Promise<ResultadoSincronizacion> {
    const ajustes = await this.ajustesRepository.obtener();
    if (!ajustes.tokenGitHub || !ajustes.repositorioGitHub) {
      throw new ErrorValidacion('Configura el token y el repositorio de GitHub antes de sincronizar.');
    }
    const credenciales: CredencialesGitHub = { tokenPAT: ajustes.tokenGitHub, repositorio: ajustes.repositorioGitHub };

    const lecturaRemota = await this.githubSync.leerRemoto(credenciales);
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: ajustes.cambiosLocalesPendientes,
      ultimoShaSincronizado: ajustes.ultimoShaSincronizado,
      lecturaRemota,
    });

    switch (accion.tipo) {
      case 'nada':
        await this.ajustesRepository.registrarSincronizacionCorrecta(new Date());
        return { tipo: 'completada', accion: 'nada' };
      case 'subir': {
        const shaEsperado = lecturaRemota.existe ? lecturaRemota.sha : null;
        await this.subir(credenciales, shaEsperado);
        return { tipo: 'completada', accion: 'subir' };
      }
      case 'descargar': {
        // Si la acción es "descargar", decidirAccionSincronizacion garantiza que el remoto existe.
        const remoto = lecturaRemota as Extract<typeof lecturaRemota, { existe: true }>;
        await this.aplicarDescarga(credenciales, remoto.datos, remoto.sha);
        return { tipo: 'completada', accion: 'descargar' };
      }
      case 'conflicto': {
        const remoto = lecturaRemota as Extract<typeof lecturaRemota, { existe: true }>;
        return { tipo: 'conflicto', opcionPorDefecto: accion.opcionPorDefecto, datosRemotos: remoto.datos, sha: remoto.sha };
      }
    }
  }

  /** Resuelve un conflicto de sincronización con la versión elegida por el usuario (FR-035). */
  async resolverConflicto(
    opcion: 'conservar_local' | 'conservar_remoto',
    datosRemotos: ExportacionJSON,
    sha: string
  ): Promise<void> {
    const credenciales = await this.obtenerCredenciales();
    if (opcion === 'conservar_local') {
      await this.subir(credenciales, sha);
    } else {
      await this.aplicarDescarga(credenciales, datosRemotos, sha);
    }
  }

  private async subir(credenciales: CredencialesGitHub, shaEsperado: string | null): Promise<void> {
    const { datos, imagenesParaSubir } = await this.exportarImportarDatos.exportar();
    const { shaNuevo } = await this.githubSync.escribirRemoto(credenciales, datos, imagenesParaSubir, shaEsperado);
    await this.ajustesRepository.actualizarUltimoShaSincronizado(shaNuevo);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(false);
    await this.ajustesRepository.registrarSincronizacionCorrecta(new Date());
  }

  private async aplicarDescarga(credenciales: CredencialesGitHub, datos: ExportacionJSON, sha: string): Promise<void> {
    await this.exportarImportarDatos.importar(datos, credenciales);
    await this.ajustesRepository.actualizarUltimoShaSincronizado(sha);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(false);
    await this.ajustesRepository.registrarSincronizacionCorrecta(new Date());
  }

  private async obtenerCredenciales(): Promise<CredencialesGitHub> {
    const ajustes = await this.ajustesRepository.obtener();
    if (!ajustes.tokenGitHub || !ajustes.repositorioGitHub) {
      throw new ErrorValidacion('Configura el token y el repositorio de GitHub antes de sincronizar.');
    }
    return { tokenPAT: ajustes.tokenGitHub, repositorio: ajustes.repositorioGitHub };
  }
}
