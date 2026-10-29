/** Tipo de enlace de un Ejercicio (data-model.md § Ejercicio). */
export type TipoEnlaceEjercicio = 'web' | 'youtube';

export interface EnlaceEjercicio {
  tipo: TipoEnlaceEjercicio;
  url: string;
}

/** Tipo de imagen de un Ejercicio: URL externa o archivo subido (FR-036). */
export type TipoImagenEjercicio = 'url' | 'archivo';

export interface ImagenEjercicio {
  id: string;
  tipo: TipoImagenEjercicio;
  /** Presente cuando `tipo === 'url'`. */
  valorUrl?: string;
  /** Presente cuando `tipo === 'archivo'`: contenido en base64, máximo 5 MB (FR-036). */
  contenidoBase64?: string;
  tipoMime?: string;
  nombreArchivo?: string;
}

/** Ejercicio físico (ver data-model.md § Ejercicio). */
export interface Ejercicio {
  id: string;
  nombre: string;
  descripcion: string;
  /** Al menos una categoría (FR-006, RN8). */
  categoriaIds: string[];
  enlaces: EnlaceEjercicio[];
  imagenes: ImagenEjercicio[];
  observaciones?: string;
  /** Pasa a `true` tras una subida correcta al repositorio común; nunca vuelve a `false` (FR-021). */
  subidoRepositorioComun: boolean;
}

/** Datos de alta de un ejercicio: `subidoRepositorioComun` siempre arranca en `false`, no se recibe como entrada. */
export type DatosNuevoEjercicio = Omit<Ejercicio, 'id' | 'subidoRepositorioComun'>;
