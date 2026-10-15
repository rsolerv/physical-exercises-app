import { ErrorValidacion } from '../errores/errores-dominio';
import type { DatosNuevoEjercicio } from './ejercicio.entity';

/** Límite de tamaño por imagen de archivo (FR-036). */
export const TAMANO_MAXIMO_IMAGEN_BYTES = 5 * 1024 * 1024;

/**
 * Valida los datos de un ejercicio antes de crearlo o actualizarlo
 * (FR-005, FR-006, FR-007, FR-036). Es un caso de uso puro de Domain: no
 * realiza ninguna E/S, solo lanza `ErrorValidacion` si algo no es correcto.
 */
export function validarEjercicio(datos: DatosNuevoEjercicio): void {
  if (!datos.nombre?.trim()) {
    throw new ErrorValidacion('El nombre del ejercicio no puede estar vacío.');
  }
  if (!datos.descripcion?.trim()) {
    throw new ErrorValidacion('La descripción del ejercicio no puede estar vacía.');
  }
  if (!datos.categoriaIds || datos.categoriaIds.length < 1) {
    throw new ErrorValidacion('El ejercicio debe pertenecer al menos a una categoría.');
  }

  for (const enlace of datos.enlaces ?? []) {
    if (!esUrlValida(enlace.url)) {
      throw new ErrorValidacion(`El enlace "${enlace.url}" no tiene un formato de URL válido.`);
    }
  }

  for (const imagen of datos.imagenes ?? []) {
    if (imagen.tipo === 'url' && !esUrlValida(imagen.valorUrl ?? '')) {
      throw new ErrorValidacion(`La imagen "${imagen.valorUrl}" no tiene un formato de URL válido.`);
    }
    if (imagen.tipo === 'archivo') {
      const tamanoBytes = calcularTamanoBase64(imagen.contenidoBase64 ?? '');
      if (tamanoBytes > TAMANO_MAXIMO_IMAGEN_BYTES) {
        throw new ErrorValidacion('Cada imagen de archivo no puede superar los 5 MB.');
      }
    }
  }
}

function esUrlValida(url: string): boolean {
  try {
    const analizada = new URL(url);
    return analizada.protocol === 'http:' || analizada.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Calcula el tamaño en bytes de un contenido codificado en base64. */
function calcularTamanoBase64(base64: string): number {
  const limpio = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const relleno = limpio.endsWith('==') ? 2 : limpio.endsWith('=') ? 1 : 0;
  return Math.floor((limpio.length * 3) / 4) - relleno;
}
