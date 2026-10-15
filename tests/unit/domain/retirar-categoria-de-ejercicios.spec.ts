import { describe, it, expect } from 'vitest';
import { retirarCategoriaDeEjercicios } from '../../../src/app/domain/categoria/retirar-categoria-de-ejercicios';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

function ejercicio(id: string, categoriaIds: string[]): Ejercicio {
  return { id, nombre: `Ejercicio ${id}`, descripcion: 'desc', categoriaIds, enlaces: [], imagenes: [] };
}

describe('retirarCategoriaDeEjercicios', () => {
  it('retira la categoría de todos los ejercicios que la tenían', () => {
    const ejercicios = [ejercicio('e1', ['cat-a', 'cat-b']), ejercicio('e2', ['cat-a'])];
    const resultado = retirarCategoriaDeEjercicios(ejercicios, 'cat-a', 'cat-generica');

    expect(resultado.find((e) => e.id === 'e1')?.categoriaIds).toEqual(['cat-b']);
  });

  it('si un ejercicio se queda sin ninguna categoría, recibe la categoría genérica (FR-011)', () => {
    const ejercicios = [ejercicio('e1', ['cat-a'])];
    const resultado = retirarCategoriaDeEjercicios(ejercicios, 'cat-a', 'cat-generica');

    expect(resultado.find((e) => e.id === 'e1')?.categoriaIds).toEqual(['cat-generica']);
  });

  it('los ejercicios que conservan otra categoría no reciben la genérica', () => {
    const ejercicios = [ejercicio('e1', ['cat-a', 'cat-b'])];
    const resultado = retirarCategoriaDeEjercicios(ejercicios, 'cat-a', 'cat-generica');

    expect(resultado.find((e) => e.id === 'e1')?.categoriaIds).toEqual(['cat-b']);
    expect(resultado.find((e) => e.id === 'e1')?.categoriaIds).not.toContain('cat-generica');
  });

  it('los ejercicios que no tenían esa categoría no se modifican', () => {
    const ejercicios = [ejercicio('e1', ['cat-b'])];
    const resultado = retirarCategoriaDeEjercicios(ejercicios, 'cat-a', 'cat-generica');

    expect(resultado.find((e) => e.id === 'e1')?.categoriaIds).toEqual(['cat-b']);
  });
});
