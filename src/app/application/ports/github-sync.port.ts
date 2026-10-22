import type { EnlaceEjercicio } from '../../domain/ejercicio/ejercicio.entity';
import type { DiaPlanificacion } from '../../domain/planificacion/planificacion.entity';

/** Formato de una imagen dentro de `ExportacionJSON`: por URL o, si es de archivo, solo su ruta (FR-036, FR-037). */
export interface ImagenEjercicioExportada {
  id: string;
  tipo: 'url' | 'archivo';
  valorUrl?: string;
  /** Presente cuando `tipo === 'archivo'`: ruta `imagenes/<id>.json` dentro del repositorio de datos. */
  ruta?: string;
}

export interface EjercicioExportado {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaIds: string[];
  enlaces: EnlaceEjercicio[];
  imagenes: ImagenEjercicioExportada[];
  observaciones?: string;
}

export interface CategoriaExportada {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface PlanificacionExportada {
  id: string;
  nombre: string;
  fechaInicio?: string;
  dias: DiaPlanificacion[];
}

export interface ProgresoDiarioExportado {
  fecha: string;
  ejercicioId: string;
  realizado: boolean;
}

/**
 * Documento JSON único (`datos.json`) con el estado íntegro de los datos del
 * usuario. Nunca contiene el token, el repositorio ni ningún otro dato de
 * "Ajustes de aplicación" (FR-037).
 */
export interface ExportacionJSON {
  version: number;
  ejercicios: EjercicioExportado[];
  categorias: CategoriaExportada[];
  planificaciones: PlanificacionExportada[];
  progresoDiario: ProgresoDiarioExportado[];
}

/** Documento `imagenes/<id>.json` con el contenido de una imagen de archivo. */
export interface ImagenArchivoJSON {
  id: string;
  nombreArchivo: string;
  tipoMime: string;
  contenidoBase64: string;
}

export interface CredencialesGitHub {
  /** Solo se usa en la cabecera de autorización; nunca se escribe en el repositorio. */
  tokenPAT: string;
  /** "owner/repo" del repositorio PRIVADO de datos (FR-037). */
  repositorio: string;
}

export type LecturaRemota = { existe: false } | { existe: true; datos: ExportacionJSON; sha: string };

/**
 * Puerto que Application usa para leer y escribir en el repositorio de datos
 * de GitHub, sin conocer el detalle de la API REST (contracts/github-sync.port.md).
 * Solo transporta datos: la decisión de qué hacer la toma el caso de uso puro
 * de dominio `decidir-accion-sincronizacion`.
 */
export abstract class GitHubSyncPort {
  /** Descarga `datos.json` del repositorio y su SHA actual; `{ existe: false }` si el repositorio aún no contiene datos. */
  abstract leerRemoto(credenciales: CredencialesGitHub): Promise<LecturaRemota>;

  /**
   * Sube cada imagen de archivo como un documento JSON independiente
   * `imagenes/<id>.json` y después `datos.json`. Usa `shaEsperado` como
   * control de concurrencia optimista: si GitHub ya tiene otro SHA, lanza
   * `ErrorConflictoRemoto` sin sobrescribir nada.
   */
  abstract escribirRemoto(
    credenciales: CredencialesGitHub,
    datos: ExportacionJSON,
    imagenes: ImagenArchivoJSON[],
    shaEsperado: string | null
  ): Promise<{ shaNuevo: string }>;

  /** Descarga y parsea un documento `imagenes/<id>.json`. */
  abstract leerImagen(credenciales: CredencialesGitHub, ruta: string): Promise<ImagenArchivoJSON>;
}
