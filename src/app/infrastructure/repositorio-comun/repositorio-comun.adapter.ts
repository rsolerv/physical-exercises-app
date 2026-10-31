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
import { API_BASE_GITHUB, aBase64, cabecerasGitHub, desdeBase64 } from '../github-sync/github-contenido.util';

/** Repositorio y ramas fijas del repositorio común (research.md, sección 3). */
const OWNER_REPO = 'rsolerv/common-data-physical-exercises';
const RAMA_LECTURA = 'main';
const RAMA_ESCRITURA = 'requests';
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER_REPO}`;
const API_CONTENTS = `${API_BASE_GITHUB}/${OWNER_REPO}/contents`;

interface DocumentoCategoriasComun {
  version: number;
  categorias: CategoriaComunDocumento[];
}

interface CategoriaComunDocumento {
  id: string | number;
  nombre: string;
  ejercicios?: (string | number)[];
}

interface ContenidoGitHub {
  content?: string;
  sha: string;
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
 * las escrituras actualizan el índice de categorías de la rama requests.
 */
@Injectable({ providedIn: 'root' })
export class RepositorioComunAdapter implements RepositorioComunPort {
  private readonly http = inject(HttpClient);

  async listarCategorias(): Promise<CategoriaComun[]> {
    try {
      const documento = await firstValueFrom(
        this.http.get<DocumentoCategoriasComun>(`${RAW_BASE}/${RAMA_LECTURA}/categorias.json`)
      );
      return this.validarDocumentoCategorias(documento).categorias.map((categoria) => ({
        id: String(categoria.id),
        nombre: categoria.nombre,
        ejercicios: (categoria.ejercicios ?? []).map(String),
      }));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) return [];
      throw this.traducirError(error);
    }
  }

  async buscarEjercicios(texto: string, categoriaId: string | null): Promise<EjercicioComunArchivo[]> {
    const categorias = await this.listarCategorias();
    const idsEjercicios = new Set(
      categorias
        .filter((categoria) => categoriaId === null || categoria.id === categoriaId)
        .flatMap((categoria) => (categoria.ejercicios ?? []).map(String))
    );
    const ejercicios = await Promise.all([...idsEjercicios].map((id) => this.leerEjercicioComun(id)));

    const textoNormalizado = texto.trim().toLowerCase();
    return ejercicios.filter((ejercicio) => {
      const coincideTexto =
        !textoNormalizado ||
        ejercicio.nombre.toLowerCase().includes(textoNormalizado) ||
        ejercicio.descripcion.toLowerCase().includes(textoNormalizado);
      return coincideTexto;
    });
  }

  async obtenerEjercicioPorId(id: string): Promise<EjercicioComunArchivo | null> {
    try {
      return await firstValueFrom(
        this.http.get<EjercicioComunArchivo>(
          `${RAW_BASE}/${RAMA_LECTURA}/ejercicios/${encodeURIComponent(id)}/${encodeURIComponent(id)}.json`
        )
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) return null;
      throw this.traducirError(error);
    }
  }

  async leerImagen(ejercicioId: string, ruta: string): Promise<ImagenArchivoJSON> {
    try {
      const rutaImagen = this.rutaImagen(ejercicioId, ruta);
      const documento = await firstValueFrom(this.http.get<unknown>(`${RAW_BASE}/${RAMA_LECTURA}/${rutaImagen}`));
      if (!esImagenArchivoValida(documento)) {
        throw new ErrorValidacion(`El documento remoto «${ruta}» no contiene una imagen con formato válido.`);
      }
      return documento;
    } catch (error) {
      if (error instanceof ErrorValidacion) throw error;
      throw this.traducirError(error);
    }
  }

  async existeEjercicioPorNombre(nombre: string): Promise<boolean> {
    const buscado = normalizarNombreEjercicio(nombre);
    const idsEjercicios = new Set(
      (await this.listarCategorias()).flatMap((categoria) => (categoria.ejercicios ?? []).map(String))
    );
    const ejercicios = await Promise.all([...idsEjercicios].map((id) => this.leerEjercicioComun(id)));
    return ejercicios.some((ejercicio) => normalizarNombreEjercicio(ejercicio.nombre) === buscado);
  }

  async subirEjercicio(
    credenciales: CredencialesGitHub,
    ejercicio: EjercicioComunArchivo,
    imagenesArchivo: ImagenArchivoJSON[]
  ): Promise<void> {
    const documentoCategorias = await this.leerDocumentoCategoriasEscritura(credenciales);
    const idsCategorias = new Set(ejercicio.categoriaIds);
    const categoriasEncontradas = new Set(
      documentoCategorias.documento.categorias.map((categoria) => String(categoria.id))
    );
    const inexistentes = [...idsCategorias].filter((id) => !categoriasEncontradas.has(id));
    if (inexistentes.length > 0) {
      throw new ErrorValidacion(`No existen estas categorías comunes: ${inexistentes.join(', ')}.`);
    }

    const idsImagenesAsociadas = new Set(
      ejercicio.imagenes.filter((imagen) => imagen.tipo === 'archivo').map((imagen) => imagen.id)
    );
    for (const imagen of imagenesArchivo) {
      if (!idsImagenesAsociadas.has(imagen.id)) continue;
      await this.crearArchivo(
        credenciales,
        `ejercicios/${encodeURIComponent(ejercicio.id)}/imagenes/${encodeURIComponent(imagen.id)}.json`,
        JSON.stringify(imagen)
      );
    }
    await this.crearArchivo(
      credenciales,
      `ejercicios/${encodeURIComponent(ejercicio.id)}/${encodeURIComponent(ejercicio.id)}.json`,
      JSON.stringify(ejercicio)
    );

    const categoriasActualizadas = documentoCategorias.documento.categorias.map((categoria) => {
      if (!idsCategorias.has(String(categoria.id))) return categoria;
      const idsEjercicios = (categoria.ejercicios ?? []).map(String);
      return {
        ...categoria,
        ejercicios: idsEjercicios.includes(ejercicio.id)
          ? categoria.ejercicios
          : [...(categoria.ejercicios ?? []), ejercicio.id],
      };
    });
    await this.actualizarArchivo(
      credenciales,
      'categorias.json',
      JSON.stringify({ ...documentoCategorias.documento, categorias: categoriasActualizadas }),
      documentoCategorias.sha
    );
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

  private async actualizarArchivo(
    credenciales: CredencialesGitHub,
    ruta: string,
    contenidoTexto: string,
    sha: string
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(
          `${API_CONTENTS}/${ruta}`,
          {
            message: `Actualizar ${ruta}`,
            content: aBase64(contenidoTexto),
            branch: RAMA_ESCRITURA,
            sha,
          },
          { headers: cabecerasGitHub(credenciales.tokenPAT) }
        )
      );
    } catch (error) {
      throw this.traducirError(error);
    }
  }

  private async leerEjercicioComun(id: string): Promise<EjercicioComunArchivo> {
    try {
      return await firstValueFrom(
        this.http.get<EjercicioComunArchivo>(
          `${RAW_BASE}/${RAMA_LECTURA}/ejercicios/${encodeURIComponent(id)}/${encodeURIComponent(id)}.json`
        )
      );
    } catch (error) {
      throw this.traducirError(error);
    }
  }

  private async leerDocumentoCategoriasEscritura(
    credenciales: CredencialesGitHub
  ): Promise<{ documento: DocumentoCategoriasComun; sha: string }> {
    try {
      const respuesta = await firstValueFrom(
        this.http.get<ContenidoGitHub>(`${API_CONTENTS}/categorias.json?ref=${RAMA_ESCRITURA}`, {
          headers: cabecerasGitHub(credenciales.tokenPAT),
        })
      );
      if (!respuesta.content?.trim()) {
        throw new ErrorValidacion('GitHub no ha devuelto el contenido de categorias.json en la rama requests.');
      }
      let contenido: unknown;
      const texto = desdeBase64(respuesta.content);
      try {
        contenido = JSON.parse(texto);
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        throw new ErrorValidacion('El documento categorias.json del repositorio común no contiene JSON válido.');
      }
      const documento = this.validarDocumentoCategorias(contenido as DocumentoCategoriasComun);
      return { documento, sha: respuesta.sha };
    } catch (error) {
      if (error instanceof ErrorValidacion) throw error;
      throw this.traducirError(error);
    }
  }

  private validarDocumentoCategorias(documento: DocumentoCategoriasComun): DocumentoCategoriasComun {
    if (
      typeof documento !== 'object' ||
      documento === null ||
      !Array.isArray(documento.categorias) ||
      !documento.categorias.every(
        (categoria) =>
          typeof categoria === 'object' &&
          categoria !== null &&
          (typeof categoria.id === 'string' || typeof categoria.id === 'number') &&
          typeof categoria.nombre === 'string' &&
          (categoria.ejercicios === undefined ||
            (Array.isArray(categoria.ejercicios) &&
              categoria.ejercicios.every((id) => typeof id === 'string' || typeof id === 'number')))
      )
    ) {
      throw new ErrorValidacion('El documento categorias.json del repositorio común no tiene un formato válido.');
    }
    return documento;
  }

  private rutaImagen(ejercicioId: string, ruta: string): string {
    if (!/^imagenes\/[^/]+\.json$/.test(ruta)) {
      throw new ErrorValidacion(`La ruta de imagen «${ruta}» no tiene un formato válido.`);
    }
    return `ejercicios/${encodeURIComponent(ejercicioId)}/${ruta
      .split('/')
      .map((segmento) => encodeURIComponent(segmento))
      .join('/')}`;
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
