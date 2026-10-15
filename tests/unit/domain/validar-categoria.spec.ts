import { describe, it, expect } from 'vitest';
import { validarCategoria } from '../../../src/app/domain/categoria/validar-categoria';
import { ErrorValidacion, ErrorOperacionNoPermitida, ErrorNombreDuplicado } from '../../../src/app/domain/errores/errores-dominio';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';

function categoria(sobrescribir: Partial<Categoria> = {}): Categoria {
  return { id: 'cat-1', nombre: 'Rodilla', descripcion: '', esGenerica: false, ...sobrescribir };
}

describe('validarCategoria', () => {
  it('acepta un nombre no vacío sin colisión', () => {
    expect(() => validarCategoria('Cadera', [])).not.toThrow();
  });

  it('rechaza un nombre vacío', () => {
    expect(() => validarCategoria('', [])).toThrow(ErrorValidacion);
    expect(() => validarCategoria('   ', [])).toThrow(ErrorValidacion);
  });

  it('rechaza un nombre ya existente en el sistema (FR-010)', () => {
    expect(() => validarCategoria('Rodilla', [categoria({ nombre: 'Rodilla' })])).toThrow(ErrorNombreDuplicado);
  });

  it('la comparación de nombre duplicado no distingue mayúsculas de minúsculas', () => {
    expect(() => validarCategoria('rodilla', [categoria({ nombre: 'Rodilla' })])).toThrow(ErrorNombreDuplicado);
  });

  it('al renombrar, no cuenta como duplicado el nombre de la propia categoría', () => {
    const existente = categoria({ id: 'cat-1', nombre: 'Rodilla' });
    expect(() => validarCategoria('Rodilla', [existente], 'cat-1')).not.toThrow();
  });

  it('impide renombrar la categoría genérica "Sin categoría" (FR-011)', () => {
    const generica = categoria({ id: 'cat-generica', nombre: 'Sin categoría', esGenerica: true });
    expect(() => validarCategoria('Otro nombre', [generica], 'cat-generica')).toThrow(ErrorOperacionNoPermitida);
  });
});
