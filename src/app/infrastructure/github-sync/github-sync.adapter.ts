import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  ErrorAutenticacionGitHub,
  ErrorConflictoRemoto,
  ErrorRedSincronizacion,
} from '../../domain/errores/errores-dominio';
import {
  GitHubSyncPort,
  type CredencialesGitHub,
  type ExportacionJSON,
  type ImagenArchivoJSON,
  type LecturaRemota,
} from '../../application/ports/github-sync.port';

const API_BASE = 'https://api.github.com/repos';

interface ContenidoGitHub {
  content: string;
  sha: string;
}

interface RespuestaEscrituraGitHub {
  content: { sha: string };
}

function aBase64(texto: string): string {
  // btoa solo admite Latin1; codificamos primero a UTF-8 para admitir cualquier texto (unescape/encodeURIComponent
  // es el truco clásico, documentado y sin dependencias adicionales, para ese paso intermedio).
  return btoa(unescape(encodeURIComponent(texto)));
}

function desdeBase64(base64: string): string {
  return decodeURIComponent(escape(atob(base64.replace(/\n/g, ''))));
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
      const respuesta = await firstValueFrom(
        this.http.get<ContenidoGitHub>(this.urlContenido(credenciales, 'datos.json'), {
          headers: this.cabeceras(credenciales),
        })
      );
      const datos = JSON.parse(desdeBase64(respuesta.content)) as ExportacionJSON;
      return { existe: true, datos, sha: respuesta.sha };
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
      await this.subirArchivo(credenciales, `imagenes/${imagen.id}.json`, JSON.stringify(imagen), null);
    }
    const resultado = await this.subirArchivo(credenciales, 'datos.json', JSON.stringify(datos), shaEsperado);
    return { shaNuevo: resultado.sha };
  }

  async leerImagen(credenciales: CredencialesGitHub, ruta: string): Promise<ImagenArchivoJSON> {
    try {
      const respuesta = await firstValueFrom(
        this.http.get<ContenidoGitHub>(this.urlContenido(credenciales, ruta), { headers: this.cabeceras(credenciales) })
      );
      return JSON.parse(desdeBase64(respuesta.content)) as ImagenArchivoJSON;
    } catch (error) {
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
    return `${API_BASE}/${credenciales.repositorio}/contents/${ruta}`;
  }

  private cabeceras(credenciales: CredencialesGitHub): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${credenciales.tokenPAT}`,
      Accept: 'application/vnd.github+json',
    });
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
