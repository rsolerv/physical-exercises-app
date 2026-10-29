import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, type HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  ErrorAutenticacionGitHub,
  ErrorConflictoRemoto,
  ErrorRedSincronizacion,
  ErrorValidacion,
} from '../../domain/errores/errores-dominio';
import {
  GitHubSyncPort,
  type CredencialesGitHub,
  type ExportacionJSON,
  type ImagenArchivoJSON,
  type LecturaRemota,
} from '../../application/ports/github-sync.port';
import { API_BASE_GITHUB, aBase64, cabecerasGitHub, leerContenidoGitHub } from './github-contenido.util';

interface ContenidoGitHub {
  sha: string;
}

interface RespuestaEscrituraGitHub {
  content: { sha: string };
}

function esImagenArchivoValida(valor: unknown): valor is ImagenArchivoJSON {
  if (typeof valor !== 'object' || valor === null) return false;
  const imagen = valor as Record<string, unknown>;
  return (
    typeof imagen['id'] === 'string' &&
    typeof imagen['nombreArchivo'] === 'string' &&
    typeof imagen['tipoMime'] === 'string' &&
    typeof imagen['contenidoBase64'] === 'string'
  );
}

/**
 * Adaptador de `GitHubSyncPort` contra la API de contenidos de GitHub
 * (contracts/github-sync.port.md). Los Observables de `HttpClient` quedan
 * confinados a este adaptador; hacia Application expone `Promise` como
 * define el contrato.
 */
@Injectable({ providedIn: 'root' })
export class GithubSyncAdapter implements GitHubSyncPort {
  private readonly http = inject(HttpClient);

  async leerRemoto(credenciales: CredencialesGitHub): Promise<LecturaRemota> {
    try {
      const contenido = await this.leerContenidoRemoto(credenciales, 'datos.json');
      const datos = JSON.parse(contenido.texto) as ExportacionJSON;
      return { existe: true, datos, sha: contenido.sha };
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return { existe: false };
      }
      throw this.traducirError(error);
    }
  }

  async escribirRemoto(
    credenciales: CredencialesGitHub,
    datos: ExportacionJSON,
    imagenes: ImagenArchivoJSON[],
    shaEsperado: string | null
  ): Promise<{ shaNuevo: string }> {
    for (const imagen of imagenes) {
      const ruta = `imagenes/${imagen.id}.json`;
      const shaImagen = await this.obtenerShaRemoto(credenciales, ruta);
      await this.subirArchivo(credenciales, ruta, JSON.stringify(imagen), shaImagen);
    }
    const resultado = await this.subirArchivo(credenciales, 'datos.json', JSON.stringify(datos), shaEsperado);
    return { shaNuevo: resultado.sha };
  }

  async leerImagen(credenciales: CredencialesGitHub, ruta: string): Promise<ImagenArchivoJSON> {
    try {
      const contenido = await this.leerContenidoRemoto(credenciales, ruta);
      const imagen: unknown = JSON.parse(contenido.texto);
      if (!esImagenArchivoValida(imagen)) {
        throw new ErrorValidacion(`El documento remoto «${ruta}» no contiene una imagen con formato válido.`);
      }
      return imagen;
    } catch (error) {
      throw this.traducirError(error);
    }
  }

  private async leerContenidoRemoto(credenciales: CredencialesGitHub, ruta: string): Promise<{ texto: string; sha: string }> {
    return leerContenidoGitHub(this.http, credenciales.repositorio, ruta, credenciales.tokenPAT);
  }

  private async obtenerShaRemoto(credenciales: CredencialesGitHub, ruta: string): Promise<string | null> {
    try {
      const respuesta = await firstValueFrom(
        this.http.get<Pick<ContenidoGitHub, 'sha'>>(this.urlContenido(credenciales, ruta), {
          headers: this.cabeceras(credenciales),
        })
      );
      return respuesta.sha;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }
      throw this.traducirError(error);
    }
  }

  private async subirArchivo(
    credenciales: CredencialesGitHub,
    ruta: string,
    contenidoTexto: string,
    shaEsperado: string | null
  ): Promise<{ sha: string }> {
    try {
      const respuesta = await firstValueFrom(
        this.http.put<RespuestaEscrituraGitHub>(
          this.urlContenido(credenciales, ruta),
          { message: `Actualizar ${ruta}`, content: aBase64(contenidoTexto), sha: shaEsperado ?? undefined },
          { headers: this.cabeceras(credenciales) }
        )
      );
      return { sha: respuesta.content.sha };
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        throw new ErrorConflictoRemoto('Los datos remotos han cambiado desde la última sincronización.');
      }
      throw this.traducirError(error);
    }
  }

  private urlContenido(credenciales: CredencialesGitHub, ruta: string): string {
    return `${API_BASE_GITHUB}/${credenciales.repositorio}/contents/${ruta}`;
  }

  private cabeceras(credenciales: CredencialesGitHub): HttpHeaders {
    return cabecerasGitHub(credenciales.tokenPAT);
  }

  private traducirError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return new ErrorAutenticacionGitHub('El token de GitHub no es válido o no tiene permisos suficientes.');
      }
      return new ErrorRedSincronizacion('No se ha podido conectar con GitHub. Comprueba tu conexión a internet.');
    }
    return error instanceof Error ? error : new ErrorRedSincronizacion('Error desconocido al sincronizar con GitHub.');
  }
}
