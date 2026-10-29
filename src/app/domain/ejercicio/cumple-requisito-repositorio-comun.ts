import type { Ejercicio } from './ejercicio.entity';

/**
 * Comprueba el requisito mínimo para ofrecer "Subir al repositorio común"
 * (FR-015, data-model.md § Validaciones nuevas): al menos una imagen o al
 * menos un enlace de YouTube. Nombre, descripción y categoría no se
 * revalidan aquí: son invariantes ya garantizados por `validar-ejercicio.ts`
 * para todo `Ejercicio` persistido.
 */
export function cumpleRequisitoRepositorioComun(ejercicio: Ejercicio): boolean {
  return ejercicio.imagenes.length > 0 || ejercicio.enlaces.some((enlace) => enlace.tipo === 'youtube');
}
