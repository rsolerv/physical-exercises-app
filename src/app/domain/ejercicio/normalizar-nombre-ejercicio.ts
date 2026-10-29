/**
 * Normaliza un nombre de ejercicio para comparaciones (data-model.md §
 * Validaciones nuevas). Usada tanto para comparar nombres al buscar como para
 * detectar duplicados al subir (FR-017).
 */
export function normalizarNombreEjercicio(nombre: string): string {
  return nombre.trim().toLowerCase();
}
