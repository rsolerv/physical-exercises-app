import type { DatosNuevoEjercicio, Ejercicio, ImagenEjercicio } from './ejercicio.entity';
import type { EjercicioComunArchivo, ImagenEjercicioComun } from '../../application/ports/repositorio-comun.port';
import type { ImagenArchivoJSON } from '../../application/ports/github-sync.port';

/**
 * Convierte un `Ejercicio` local al formato de fichero independiente del
 * repositorio común (data-model.md § Validaciones nuevas, FR-016, FR-019).
 * Separa las imágenes de tipo `archivo` en documentos independientes
 * (mismo patrón que `GitHubSyncPort` de 001) y sustituye `categoriaIds` por
 * las categorías comunes elegidas por el usuario.
 */
export function aEjercicioComun(
  ejercicio: Ejercicio,
  categoriaIdsComunes: string[]
): { datos: EjercicioComunArchivo; imagenesArchivo: ImagenArchivoJSON[] } {
  const imagenesArchivo: ImagenArchivoJSON[] = [];
  const imagenes: ImagenEjercicioComun[] = ejercicio.imagenes.map((imagen) => {
    if (imagen.tipo === 'archivo') {
      imagenesArchivo.push({
        id: imagen.id,
        nombreArchivo: imagen.nombreArchivo ?? '',
        tipoMime: imagen.tipoMime ?? '',
        contenidoBase64: imagen.contenidoBase64 ?? '',
      });
      return { id: imagen.id, tipo: 'archivo', ruta: `imagenes/${imagen.id}.json` };
    }
    return { id: imagen.id, tipo: 'url', valorUrl: imagen.valorUrl };
  });

  const datos: EjercicioComunArchivo = {
    id: ejercicio.id,
    nombre: ejercicio.nombre,
    descripcion: ejercicio.descripcion,
    categoriaIds: categoriaIdsComunes,
    enlaces: ejercicio.enlaces,
    imagenes,
    ...(ejercicio.observaciones?.trim() ? { observaciones: ejercicio.observaciones } : {}),
  };

  return { datos, imagenesArchivo };
}

/**
 * Convierte un ejercicio del repositorio común al formato de alta local
 * (`DatosNuevoEjercicio`, FR-009). Reincorpora el contenido base64 de las
 * imágenes de archivo ya leídas (`imagenesArchivo`, indexadas por `id`) y
 * sustituye `categoriaIds` por las categorías locales ya resueltas por el
 * mapeo. Si una imagen de archivo no está en el mapa (lectura inválida,
 * FR-011), se omite sin lanzar error.
 */
export function aDatosNuevoEjercicio(
  ejercicioComun: EjercicioComunArchivo,
  categoriaIdsLocales: string[],
  imagenesArchivo: Map<string, ImagenArchivoJSON>
): DatosNuevoEjercicio {
  const imagenes: ImagenEjercicio[] = [];
  for (const imagen of ejercicioComun.imagenes) {
    if (imagen.tipo === 'url') {
      imagenes.push({ id: imagen.id, tipo: 'url', valorUrl: imagen.valorUrl });
      continue;
    }
    const imagenArchivo = imagenesArchivo.get(imagen.id);
    if (!imagenArchivo) continue;
    imagenes.push({
      id: imagen.id,
      tipo: 'archivo',
      contenidoBase64: imagenArchivo.contenidoBase64,
      tipoMime: imagenArchivo.tipoMime,
      nombreArchivo: imagenArchivo.nombreArchivo,
    });
  }

  return {
    nombre: ejercicioComun.nombre,
    descripcion: ejercicioComun.descripcion,
    categoriaIds: categoriaIdsLocales,
    enlaces: ejercicioComun.enlaces,
    imagenes,
    ...(ejercicioComun.observaciones ? { observaciones: ejercicioComun.observaciones } : {}),
  };
}
