/** Categoría de ejercicios (ver data-model.md § Categoría). */
export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
}

export type DatosNuevaCategoria = Omit<Categoria, 'id'>;
