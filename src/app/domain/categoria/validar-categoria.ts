import { ErrorValidacion, ErrorOperacionNoPermitida, ErrorNombreDuplicado } from '../errores/errores-dominio';
import type { Categoria } from './categoria.entity';

/**
 * Valida el nombre de una categoría antes de crearla o renombrarla
 * (FR-010, FR-011). Es un caso de uso puro de Domain.
 *
 * @param nombre nombre propuesto
 * @param existentes todas las categorías ya existentes en el sistema
 * @param idPropio si se está renombrando una categoría ya existente, su id
 *   (para no considerar su propio nombre actual como un duplicado)
 */
export function validarCategoria(nombre: string, existentes: Categoria[], idPropio?: string): void {
  if (!nombre?.trim()) {
    throw new ErrorValidacion('El nombre de la categoría no puede estar vacío.');
  }

  const propia = idPropio ? existentes.find((c) => c.id === idPropio) : undefined;
  if (propia?.esGenerica) {
    throw new ErrorOperacionNoPermitida('La categoría "Sin categoría" no se puede renombrar.');
  }

  const duplicada = existentes.some(
    (c) => c.id !== idPropio && c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
  );
  if (duplicada) {
    throw new ErrorNombreDuplicado(`Ya existe una categoría con el nombre "${nombre}".`);
  }
}
