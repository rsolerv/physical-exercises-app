import { describe, it, expect } from 'vitest';
import { cumpleRequisitoRepositorioComun } from '../../../src/app/domain/ejercicio/cumple-requisito-repositorio-comun';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

function ejercicio(sobrescribir: Partial<Ejercicio> = {}): Ejercicio {
  return {
    id: 'ej-1',
    nombre: 'Sentadilla',
    descripcion: 'Flexionar las rodillas.',
    categoriaIds: ['cat-1'],
    enlaces: [],
    imagenes: [],
    subidoRepositorioComun: false,
    ...sobrescribir,
  };
}

describe('cumpleRequisitoRepositorioComun', () => {
  it('devuelve false si no tiene ninguna imagen ni ningún enlace de YouTube (FR-015)', () => {
    expect(cumpleRequisitoRepositorioComun(ejercicio())).toBe(false);
  });

  it('devuelve true si tiene al menos una imagen', () => {
    expect(
      cumpleRequisitoRepositorioComun(
        ejercicio({ imagenes: [{ id: 'img-1', tipo: 'url', valorUrl: 'https://example.com/foto.jpg' }] })
      )
    ).toBe(true);
  });

  it('devuelve true si tiene al menos un enlace de YouTube', () => {
    expect(
      cumpleRequisitoRepositorioComun(
        ejercicio({ enlaces: [{ tipo: 'youtube', url: 'https://www.youtube.com/watch?v=abc123' }] })
      )
    ).toBe(true);
  });

  it('devuelve false si solo tiene enlaces web, sin ninguno de YouTube', () => {
    expect(
      cumpleRequisitoRepositorioComun(ejercicio({ enlaces: [{ tipo: 'web', url: 'https://example.com/guia' }] }))
    ).toBe(false);
  });

  it('devuelve true si tiene imágenes y enlaces web (sin YouTube)', () => {
    expect(
      cumpleRequisitoRepositorioComun(
        ejercicio({
          imagenes: [{ id: 'img-1', tipo: 'url', valorUrl: 'https://example.com/foto.jpg' }],
          enlaces: [{ tipo: 'web', url: 'https://example.com/guia' }],
        })
      )
    ).toBe(true);
  });
});
