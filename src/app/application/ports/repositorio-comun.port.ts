import type { EnlaceEjercicio } from '../../domain/ejercicio/ejercicio.entity';
import type { CredencialesGitHub, ImagenArchivoJSON } from './github-sync.port';

/** Categoría definida en `categorias.json` del repositorio común (data-model.md § Categoría común). */
export interface CategoriaComun {
  id: string;
  nombre: string;
  ejercicios?: (string | number)[];
}

/** Imagen de un ejercicio común: por URL o referenciando una ruta relativa a la carpeta del ejercicio. */
export interface ImagenEjercicioComun {
  id: string;
  tipo: 'url' | 'archivo';
  /** Presente cuando `tipo === 'url'`. */
  valorUrl?: string;
  /** Presente cuando `tipo === 'archivo'`: `"imagenes/<id>.json"`. */
  ruta?: string;
}

/** Documento `ejercicios/<id>/<id>.json` del repositorio común (data-model.md § Ejercicio común). */
export interface EjercicioComunArchivo {
  id: string;
  nombre: string;
  descripcion: string;
  /** Referencias a `CategoriaComun`; una o varias. */
  categoriaIds: string[];
  enlaces: EnlaceEjercicio[];
  imagenes: ImagenEjercicioComun[];
  observaciones?: string;
}

/**
 * Puerto que Application usa para leer el catálogo público del repositorio
 * común (`rsolerv/common-data-physical-exercises`) y para subir un ejercicio
 * nuevo (contracts/repositorio-comun.port.md). El repositorio y las ramas de
 * lectura (`main`) y escritura (`requests`) son constantes del adaptador.
 */
export abstract class RepositorioComunPort {
  /** Descarga `categorias.json` de `main`. Devuelve una lista vacía si el fichero no existe todavía. No requiere credenciales. */
  abstract listarCategorias(): Promise<CategoriaComun[]>;

  /**
   * Lista `/ejercicios` en `main` y filtra por texto (en nombre/descripción,
   * sin distinguir mayúsculas/minúsculas) y/o por `categoriaId`. Sin texto ni
   * categoría, devuelve el catálogo completo (FR-004). No requiere
   * credenciales (FR-007).
   */
  abstract buscarEjercicios(texto: string, categoriaId: string | null): Promise<EjercicioComunArchivo[]>;

  /** Descarga un ejercicio publicado de `main` por su id; devuelve `null` si no existe. No requiere credenciales. */
  abstract obtenerEjercicioPorId(id: string): Promise<EjercicioComunArchivo | null>;

  /** Descarga `ejercicios/<ejercicioId>/imagenes/<id>.json` de `main`, conservando `ruta` relativa del ejercicio. */
  abstract leerImagen(ejercicioId: string, ruta: string): Promise<ImagenArchivoJSON>;

  /**
   * Comprueba si ya existe un ejercicio con el mismo nombre normalizado en
   * `main` (FR-017). Lee el índice y el contenido público sin credenciales;
   * no consulta los ejercicios pendientes en `requests`.
   */
  abstract existeEjercicioPorNombre(nombre: string): Promise<boolean>;

  /** Devuelve el login que GitHub autentica para la PAT; nunca se infiere la identidad por la presencia del token. */
  abstract obtenerLoginGitHub(tokenPAT: string): Promise<string>;

  /**
   * Crea `ejercicios/<id>/<id>.json` y solo sus imágenes de archivo
   * referenciadas en `ejercicios/<id>/imagenes/<imagenId>.json`; actualiza
   * también `categorias.json` para indexar el ejercicio en sus categorías.
   * No escribe en `main` ni gestiona la pull request ni sus reglas de validación.
   */
  abstract subirEjercicio(
    credenciales: CredencialesGitHub,
    ejercicio: EjercicioComunArchivo,
    imagenesArchivo: ImagenArchivoJSON[]
  ): Promise<void>;

  /** Elimina del catálogo publicado el ejercicio, sus imágenes y sus referencias de categorías en una sola actualización de main. */
  abstract eliminarEjercicio(credenciales: CredencialesGitHub, ejercicioId: string): Promise<void>;
}
