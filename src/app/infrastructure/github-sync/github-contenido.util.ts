import type { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ErrorValidacion } from '../../domain/errores/errores-dominio';

/** Base de la API de contenidos de GitHub, compartida por los adaptadores de Infrastructure. */
export const API_BASE_GITHUB = 'https://api.github.com/repos';

interface ContenidoGitHub {
  content?: string;
  sha: string;
}

export interface ContenidoRemotoGitHub {
  texto: string;
  sha: string;
}

/**
 * Codifica texto a base64 admitiendo cualquier carácter: btoa solo admite
 * Latin1, así que se codifica primero a UTF-8 (unescape/encodeURIComponent es
 * el truco clásico, documentado y sin dependencias adicionales, para ese paso
 * intermedio).
 */
export function aBase64(texto: string): string {
  return btoa(unescape(encodeURIComponent(texto)));
}

export function desdeBase64(base64: string): string {
  return decodeURIComponent(escape(atob(base64.replace(/\n/g, ''))));
}

/** Cabeceras estándar de autorización y formato para la API de GitHub. */
export function cabecerasGitHub(tokenPAT: string): HttpHeaders {
  return new HttpHeaders({
    Authorization: `Bearer ${tokenPAT}`,
    Accept: 'application/vnd.github+json',
  });
}

/**
 * Descarga el contenido de un fichero remoto de GitHub por la API de
 * contenidos, recurriendo a la API de blobs cuando la primera omite el
 * cuerpo (ficheros de más de 1 MB, hasta 100 MB vía blobs). Extraído de
 * `GithubSyncAdapter` para reutilizarse también en `RepositorioComunAdapter`
 * (research.md, sección 5).
 */
export async function leerContenidoGitHub(
  http: HttpClient,
  repositorio: string,
  ruta: string,
  tokenPAT: string
): Promise<ContenidoRemotoGitHub> {
  const cabeceras = cabecerasGitHub(tokenPAT);
  const respuesta = await firstValueFrom(
    http.get<ContenidoGitHub>(`${API_BASE_GITHUB}/${repositorio}/contents/${ruta}`, { headers: cabeceras })
  );
  if (respuesta.content?.trim()) {
    return { texto: desdeBase64(respuesta.content), sha: respuesta.sha };
  }

  // Por encima de 1 MB la API de contenidos no devuelve el cuerpo; la API de blobs admite hasta 100 MB.
  const blob = await firstValueFrom(
    http.get<ContenidoGitHub>(`${API_BASE_GITHUB}/${repositorio}/git/blobs/${respuesta.sha}`, { headers: cabeceras })
  );
  if (!blob.content?.trim()) {
    throw new ErrorValidacion(`GitHub no ha devuelto el contenido del documento remoto «${ruta}».`);
  }
  return { texto: desdeBase64(blob.content), sha: respuesta.sha };
}
