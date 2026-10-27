import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GoogleAutorizacionPort } from '../../application/ports/google-autorizacion.port';
import type { ExportacionJSON, ImagenArchivoJSON } from '../../application/ports/github-sync.port';
import {
  ProveedorSincronizacionPort,
  type LecturaRemota,
} from '../../application/ports/proveedor-sincronizacion.port';
import {
  ErrorAutorizacionGoogle,
  ErrorConflictoRemoto,
  ErrorNoEncontrado,
  ErrorRedSincronizacion,
  ErrorValidacion,
} from '../../domain/errores/errores-dominio';

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const TAMANO_MAXIMO_IMAGEN_BYTES = 5 * 1024 * 1024;

interface FicheroDrive {
  id: string;
  name: string;
  size?: string;
  version?: string;
  createdTime?: string;
}

interface RespuestaListado {
  files?: FicheroDrive[];
  nextPageToken?: string;
}

interface RespuestaVersion {
  version?: string;
}

@Injectable({ providedIn: 'root' })
export class ProveedorGoogleDriveSync extends ProveedorSincronizacionPort {
  private readonly http = inject(HttpClient);
  private readonly autorizacion = inject(GoogleAutorizacionPort);

  async leerRemoto(): Promise<LecturaRemota> {
    const ficheros = await this.listarFicheros();
    const datosRemotos = this.encontrarFicheroMasAntiguo(ficheros, 'datos.json');
    if (!datosRemotos) return { existe: false };

    try {
      const datos = await this.leerJson<ExportacionJSON>(`${DRIVE_FILES_URL}/${encodeURIComponent(datosRemotos.id)}`);
      if (!datosRemotos.version) throw new ErrorRedSincronizacion('Google no ha devuelto la versión de los datos.');
      return { existe: true, datos, version: datosRemotos.version };
    } catch (error) {
      if (error instanceof ErrorNoEncontrado) return { existe: false };
      throw error;
    }
  }

  async escribirRemoto(
    datos: ExportacionJSON,
    imagenes: ImagenArchivoJSON[],
    versionEsperada: string | null,
  ): Promise<{ versionNueva: string }> {
    const ficheros = await this.listarFicheros();
    for (const imagen of imagenes) {
      this.validarTamanoImagen(imagen);
      const contenido = JSON.stringify(imagen);
      const nombre = this.nombreFicheroImagen(imagen.id);
      const remoto = this.encontrarFicheroMasAntiguo(ficheros, nombre);
      const tamanoEsperado = new TextEncoder().encode(contenido).byteLength;
      if (remoto && Number(remoto.size) === tamanoEsperado) continue;
      await this.subirFichero(nombre, contenido, remoto?.id);
    }

    const remotoDatos = this.encontrarFicheroMasAntiguo(ficheros, 'datos.json');
    await this.comprobarVersion(remotoDatos, versionEsperada);
    const respuesta = await this.subirFichero('datos.json', JSON.stringify(datos), remotoDatos?.id, true);
    if (!respuesta.version) throw new ErrorRedSincronizacion('Google no ha devuelto la nueva versión de los datos.');
    return { versionNueva: respuesta.version };
  }

  async leerImagen(ruta: string): Promise<ImagenArchivoJSON> {
    const coincidencia = /^imagenes\/([^/]+)\.json$/.exec(ruta);
    if (!coincidencia) throw new ErrorValidacion('La ruta de la imagen no es válida.');

    const ficheros = await this.listarFicheros();
    const remoto = this.encontrarFicheroMasAntiguo(ficheros, this.nombreFicheroImagen(coincidencia[1]));
    if (!remoto) throw new ErrorNoEncontrado('No se ha encontrado la imagen guardada en Google.');
    return this.leerJson<ImagenArchivoJSON>(`${DRIVE_FILES_URL}/${encodeURIComponent(remoto.id)}`);
  }

  private async listarFicheros(): Promise<FicheroDrive[]> {
    const ficheros: FicheroDrive[] = [];
    let pageToken: string | null = null;
    do {
      const respuesta: RespuestaListado = await this.solicitud<RespuestaListado>(
        DRIVE_FILES_URL,
        {
          spaces: 'appDataFolder',
          orderBy: 'createdTime',
          pageSize: '1000',
          fields: 'files(id,name,size,version,createdTime),nextPageToken',
          ...(pageToken ? { pageToken } : {}),
        },
      );
      ficheros.push(...(respuesta.files ?? []));
      pageToken = respuesta.nextPageToken ?? null;
    } while (pageToken);
    return ficheros;
  }

  private encontrarFicheroMasAntiguo(ficheros: FicheroDrive[], nombre: string): FicheroDrive | undefined {
    return ficheros
      .filter((fichero) => fichero.name === nombre)
      .sort((a, b) => {
        const fechaA = a.createdTime ?? '';
        const fechaB = b.createdTime ?? '';
        return fechaA.localeCompare(fechaB) || a.id.localeCompare(b.id);
      })[0];
  }

  private async comprobarVersion(ficheroInicial: FicheroDrive | undefined, versionEsperada: string | null): Promise<void> {
    const fichero = ficheroInicial ?? this.encontrarFicheroMasAntiguo(await this.listarFicheros(), 'datos.json');
    if (!fichero) {
      if (versionEsperada !== null) throw new ErrorConflictoRemoto('Los datos de Google han cambiado. Vuelve a sincronizar.');
      return;
    }

    let versionActual: string | undefined;
    try {
      const respuesta = await this.solicitud<RespuestaVersion>(
        `${DRIVE_FILES_URL}/${encodeURIComponent(fichero.id)}`,
        { fields: 'version' },
      );
      versionActual = respuesta.version;
    } catch (error) {
      if (!(error instanceof ErrorNoEncontrado)) throw error;
    }

    if (versionActual !== versionEsperada) {
      throw new ErrorConflictoRemoto('Los datos de Google han cambiado. Vuelve a sincronizar.');
    }
  }

  private async subirFichero(
    nombre: string,
    contenido: string,
    idExistente?: string,
    devolverVersion = false,
  ): Promise<RespuestaVersion> {
    const cuerpo = new TextEncoder().encode(contenido);
    const metadatos = idExistente
      ? { name: nombre, mimeType: 'application/json' }
      : { name: nombre, parents: ['appDataFolder'], mimeType: 'application/json' };
    const url = idExistente
      ? `${DRIVE_UPLOAD_URL}/${encodeURIComponent(idExistente)}`
      : DRIVE_UPLOAD_URL;
    const apertura = await this.solicitudRespuesta<unknown>(
      url,
      metadatos,
      'POST',
      undefined,
      idExistente ? { 'X-HTTP-Method-Override': 'PATCH' } : undefined,
      {
        uploadType: 'resumable',
        ...(devolverVersion ? { fields: 'version' } : {}),
        contentLength: String(cuerpo.byteLength),
      },
    );
    const ubicacion = apertura.headers.get('Location');
    if (!ubicacion) throw new ErrorRedSincronizacion('Google no ha devuelto la dirección para subir el fichero.');

    return this.solicitud<RespuestaVersion>(ubicacion, undefined, 'PUT', undefined, contenido, {
      'Content-Type': 'application/json',
    });
  }

  private async leerJson<T>(url: string): Promise<T> {
    return this.solicitud<T>(url, { alt: 'media' });
  }

  private async solicitud<T>(
    url: string,
    parametros?: Record<string, string>,
    metodo = 'GET',
    opcionesCarga?: { uploadType: string; fields?: string; contentLength: string },
    cuerpo?: string,
    cabecerasAdicionales?: Record<string, string>,
  ): Promise<T> {
    const respuesta = await this.solicitudRespuesta<T>(
      url,
      cuerpo,
      metodo,
      parametros,
      cabecerasAdicionales,
      opcionesCarga,
    );
    return respuesta.body as T;
  }

  private async solicitudRespuesta<T>(
    url: string,
    cuerpo?: unknown,
    metodo = 'GET',
    parametros?: Record<string, string>,
    cabecerasAdicionales?: Record<string, string>,
    opcionesCarga?: { uploadType: string; fields?: string; contentLength: string },
  ): Promise<HttpResponse<T>> {
    const token = await this.autorizacion.obtenerTokenAcceso();
    const params = {
      ...(parametros ?? {}),
      ...(opcionesCarga
        ? {
            uploadType: opcionesCarga.uploadType,
            ...(opcionesCarga.fields ? { fields: opcionesCarga.fields } : {}),
          }
        : {}),
    };
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...(cabecerasAdicionales ?? {}),
      ...(opcionesCarga
        ? {
            'X-Upload-Content-Type': 'application/json',
            'X-Upload-Content-Length': opcionesCarga.contentLength,
          }
        : {}),
    };
    const esEnvioReanudable = metodo === 'PUT';
    try {
      return await firstValueFrom(
        this.http.request<T>(metodo, url, {
          body: cuerpo,
          headers,
          params,
          observe: 'response',
          responseType: esEnvioReanudable ? 'json' : 'json',
        }),
      );
    } catch (error) {
      throw this.traducirError(error);
    }
  }

  private traducirError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) {
      return error instanceof Error ? error : new ErrorRedSincronizacion('No se ha podido conectar con Google.');
    }
    if (error.status === 404) return new ErrorNoEncontrado('El fichero solicitado no existe en Google.');
    if (error.status === 401) return new ErrorAutorizacionGoogle();
    if (error.status === 403) {
      const razon = this.obtenerRazon(error);
      return /rate.?limit|quota|usage/i.test(razon)
        ? new ErrorRedSincronizacion('Google está limitando temporalmente las solicitudes. Inténtalo de nuevo.')
        : new ErrorAutorizacionGoogle();
    }
    if (error.status === 0 || error.status === 429 || error.status >= 500) {
      return new ErrorRedSincronizacion('No se ha podido conectar con Google. Comprueba la conexión e inténtalo de nuevo.');
    }
    return new ErrorRedSincronizacion('No se ha podido completar la sincronización con Google.');
  }

  private obtenerRazon(error: HttpErrorResponse): string {
    const cuerpo = error.error as { error?: { errors?: { reason?: string }[] } } | null;
    return cuerpo?.error?.errors?.map((detalle) => detalle.reason ?? '').join(' ') ?? '';
  }

  private nombreFicheroImagen(id: string): string {
    return `imagenes__${id}.json`;
  }

  private validarTamanoImagen(imagen: ImagenArchivoJSON): void {
    const base64 = imagen.contenidoBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    const tamano = Math.floor((base64.length * 3) / 4) - padding;
    if (tamano > TAMANO_MAXIMO_IMAGEN_BYTES) {
      throw new ErrorValidacion('Cada imagen de archivo no puede superar los 5 MB.');
    }
  }
}
