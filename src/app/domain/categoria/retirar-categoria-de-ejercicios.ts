import type { Ejercicio } from '../ejercicio/ejercicio.entity';

/**
 * Retira una categoría de la lista de categorías de cada ejercicio que la
 * tuviera. Si algún ejercicio se queda sin ninguna categoría, se le asigna
 * automáticamente la categoría genérica indicada (FR-011).
 *
 * Caso de uso puro de Domain: no realiza ninguna E/S, solo transforma datos.
 */
export function retirarCategoriaDeEjercicios(
  ejercicios: Ejercicio[],
  categoriaIdARetirar: string,
  categoriaGenericaId: string
): Ejercicio[] {
  return ejercicios.map((ejercicio) => {
    if (!ejercicio.categoriaIds.includes(categoriaIdARetirar)) {
      return ejercicio;
    }
    const categoriasRestantes = ejercicio.categoriaIds.filter((id) => id !== categoriaIdARetirar);
    return {
      ...ejercicio,
      categoriaIds: categoriasRestantes.length > 0 ? categoriasRestantes : [categoriaGenericaId],
    };
  });
}
