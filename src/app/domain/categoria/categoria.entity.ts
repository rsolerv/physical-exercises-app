/** Categoría de ejercicios (ver data-model.md § Categoría). */
export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  /** `true` únicamente para la categoría de fábrica "Sin categoría" (FR-011). */
  esGenerica: boolean;
}

export type DatosNuevaCategoria = Omit<Categoria, 'id' | 'esGenerica'>;
