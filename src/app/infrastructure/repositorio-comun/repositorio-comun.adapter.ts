import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  ErrorAutenticacionGitHub,
  ErrorRedSincronizacion,
  ErrorValidacion,
} from '../../domain/errores/errores-dominio';
import { normalizarNombreEjercicio } from '../../domain/ejercicio/normalizar-nombre-ejercicio';
import {
  RepositorioComunPort,
  type CategoriaComun,
  type EjercicioComunArchivo,
} from '../../application/ports/repositorio-comun.port';
import type { CredencialesGitHub, ImagenArchivoJSON } from '../../application/ports/github-sync.port';
import { API_BASE_GITHUB, aBase64, cabecerasGitHub } from '../github-sync/github-contenido.util';

/** Repositorio y ramas fijas del repositorio común (research.md, sección 3). */
const OWNER_REPO = 'rsolerv/common-data-physical-exercises';
const RAMA_LECTURA = 'main';
const RAMA_ESCRITURA = 'requests';
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER_REPO}`;
const API_CONTENTS = `${API_BASE_GITHUB}/${OWNER_REPO}/contents`;

interface ElementoDirectorioGitHub {
  name: string;
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
 * Adaptador de `RepositorioComunPort` contra el repositorio público
 * `rsolerv/common-data-physical-exercises` (contracts/repositorio-comun.port.md).
 * La lectura usa URLs "raw" (sin cuota de API ni credenciales, research.md §1);
 * solo el listado de `/ejercicios` usa la API de contenidos de GitHub.
 */
@Injectable({ providedIn: 'root' })
export class RepositorioComunAdapter implements RepositorioComunPort {
  private readonly http = inject(HttpClient);

  async listarCategorias(): Promise<CategoriaComun[]> {
    try {
      const documento = await firstValueFrom(
        this.http.get<{ version: number; categorias: CategoriaComun[] }>(`${RAW_BASE}/${RAMA_LECTURA}/categorias.json`)
      );
      return documento.categorias ?? [];
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) return [];
      throw this.traducirError(error);
    }
  }

  async buscarEjercicios(texto: string, categoriaId: string | null): Promise<EjercicioComunArchivo[]> {
    const nombresArchivo = await this.listarArchivosJson('ejercicios');
    const ejercicios = await Promise.all(nombresArchivo.map((nombre) => this.leerEjercicioComun(nombre)));

    const textoNormalizado = texto.trim().toLowerCase();
    return ejercicios.filter((ejercicio) => {
      const coincideTexto =
        !textoNormalizado ||
        ejercicio.nombre.toLowerCase().includes(textoNormalizado) ||
        ejercicio.descripcion.toLowerCase().includes(textoNormalizado);
      const coincideCategoria = !categoriaId || ejercicio.categoriaIds.includes(categoriaId);
      return coincideTexto && coincideCategoria;
    });
  }

  async obtenerEjercicioPorId(id: string): Promise<EjercicioComunArchivo | null> {
    try {
      return await firstValueFrom(
        this.http.get<EjercicioComunArchivo>(`${RAW_BASE}/${RAMA_LECTURA}/ejercicios/${encodeURIComponent(id)}.json`)
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) return null;
      throw this.traducirError(error);
    }
  }

  async leerImagen(ruta: string): Promise<ImagenArchivoJSON> {
    try {
      const documento = await firstValueFrom(this.http.get<unknown>(`${RAW_BASE}/${RAMA_LECTURA}/${ruta}`));
      if (!esImagenArchivoValida(documento)) {
        throw new ErrorValidacion(`El documento remoto «${ruta}» no contiene una imagen con formato válido.`);
      }
      return documento;
    } catch (error) {
      if (error instanceof ErrorValidacion) throw error;
      throw this.traducirError(error);
    }
  }

  async existeEjercicioPorNombre(credenciales: CredencialesGitHub, nombre: string): Promise<boolean> {
    const nombresArchivo = await this.listarArchivosJson('ejercicios', credenciales);
    const buscado = normalizarNombreEjercicio(nombre);
    for (const nombreArchivo of nombresArchivo) {
      const ejercicio = await this.leerEjercicioComun(nombreArchivo);
      if (normalizarNombreEjercicio(ejercicio.nombre) === buscado) return true;
    }
    return false;
  }

  async subirEjercicio(
    credenciales: CredencialesGitHub,
    ejercicio: EjercicioComunArchivo,
    imagenesArchivo: ImagenArchivoJSON[]
  ): Promise<void> {
    const idsImagenesAsociadas = new Set(
      ejercicio.imagenes.filter((imagen) => imagen.tipo === 'archivo').map((imagen) => imagen.id)
    );
    for (const imagen of imagenesArchivo) {
      if (!idsImagenesAsociadas.has(imagen.id)) continue;
      await this.crearArchivo(credenciales, `imagenes/${imagen.id}.json`, JSON.stringify(imagen));
    }
    await this.crearArchivo(credenciales, `ejercicios/${ejercicio.id}.json`, JSON.stringify(ejercicio));
  }

  private async crearArchivo(credenciales: CredencialesGitHub, ruta: string, contenidoTexto: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(
          `${API_CONTENTS}/${ruta}`,
          { message: `Añadir ${ruta}`, content: aBase64(contenidoTexto), branch: RAMA_ESCRITURA },
          { headers: cabecerasGitHub(credenciales.tokenPAT) }
        )
      );
    } catch (error) {
      throw this.traducirError(error);
    }
  }

  private async listarArchivosJson(carpeta: string, credenciales?: CredencialesGitHub): Promise<string[]> {
    try {
      const respuesta = await firstValueFrom(
        this.http.get<ElementoDirectorioGitHub[]>(`${API_CONTENTS}/${carpeta}?ref=${RAMA_LECTURA}`, {
          headers: credenciales ? cabecerasGitHub(credenciales.tokenPAT) : undefined,
        })
      );
      return respuesta.filter((elemento) => elemento.name.endsWith('.json')).map((elemento) => elemento.name);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) return [];
      throw this.traducirError(error);
    }
  }

  private async leerEjercicioComun(nombreArchivo: string): Promise<EjercicioComunArchivo> {
    return firstValueFrom(
      this.http.get<EjercicioComunArchivo>(`${RAW_BASE}/${RAMA_LECTURA}/ejercicios/${nombreArchivo}`)
    );
  }

  private traducirError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 403) {
        return new ErrorAutenticacionGitHub('El token de GitHub no es válido o no tiene permisos suficientes.');
      }
      return new ErrorRedSincronizacion('No se ha podido conectar con el repositorio común. Comprueba tu conexión a internet.');
    }
    return error instanceof Error
      ? error
      : new ErrorRedSincronizacion('Error desconocido al conectar con el repositorio común.');
  }
}
