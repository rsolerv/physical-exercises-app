import { describe, it, expect } from 'vitest';
import { aEjercicioComun, aDatosNuevoEjercicio } from '../../../src/app/domain/ejercicio/convertir-ejercicio-comun';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';
import type { EjercicioComunArchivo } from '../../../src/app/application/ports/repositorio-comun.port';
import type { ImagenArchivoJSON } from '../../../src/app/application/ports/github-sync.port';

function ejercicioLocal(sobrescribir: Partial<Ejercicio> = {}): Ejercicio {
  return {
    id: 'ej-1',
    nombre: 'Almeja',
    descripcion: 'Tumbada de lado con las rodillas dobladas.',
    categoriaIds: ['cat-local-1'],
    enlaces: [{ tipo: 'youtube', url: 'https://www.youtube.com/watch?v=abc123' }],
    imagenes: [],
    subidoRepositorioComun: false,
    ...sobrescribir,
  };
}

describe('aEjercicioComun', () => {
  it('sustituye categoriaIds por las categorías comunes indicadas', () => {
    const { datos } = aEjercicioComun(ejercicioLocal(), ['cat-comun-1', 'cat-comun-2']);
    expect(datos.categoriaIds).toEqual(['cat-comun-1', 'cat-comun-2']);
  });

  it('conserva id, nombre, descripción y enlaces sin cambios', () => {
    const { datos } = aEjercicioComun(ejercicioLocal(), ['cat-comun-1']);
    expect(datos.id).toBe('ej-1');
    expect(datos.nombre).toBe('Almeja');
    expect(datos.descripcion).toBe('Tumbada de lado con las rodillas dobladas.');
    expect(datos.enlaces).toEqual([{ tipo: 'youtube', url: 'https://www.youtube.com/watch?v=abc123' }]);
  });

  it('conserva las imágenes de tipo url sin cambios', () => {
    const { datos, imagenesArchivo } = aEjercicioComun(
      ejercicioLocal({ imagenes: [{ id: 'img-url', tipo: 'url', valorUrl: 'https://example.com/foto.jpg' }] }),
      ['cat-comun-1']
    );
    expect(datos.imagenes).toEqual([{ id: 'img-url', tipo: 'url', valorUrl: 'https://example.com/foto.jpg' }]);
    expect(imagenesArchivo).toEqual([]);
  });

  it('separa las imágenes de archivo en un documento independiente con ruta imagenes/<id>.json', () => {
    const { datos, imagenesArchivo } = aEjercicioComun(
      ejercicioLocal({
        imagenes: [
          { id: 'img-1', tipo: 'archivo', contenidoBase64: 'QUJD', tipoMime: 'image/png', nombreArchivo: 'foto.png' },
        ],
      }),
      ['cat-comun-1']
    );
    expect(datos.imagenes).toEqual([{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }]);
    expect(imagenesArchivo).toEqual([
      { id: 'img-1', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'QUJD' },
    ]);
  });

  it('usa cadenas vacías si una imagen de archivo no tiene nombreArchivo, tipoMime o contenidoBase64', () => {
    const { imagenesArchivo } = aEjercicioComun(
      ejercicioLocal({ imagenes: [{ id: 'img-1', tipo: 'archivo' }] }),
      ['cat-comun-1']
    );
    expect(imagenesArchivo).toEqual([{ id: 'img-1', nombreArchivo: '', tipoMime: '', contenidoBase64: '' }]);
  });

  it('omite observaciones del fichero cuando está vacía', () => {
    const { datos } = aEjercicioComun(ejercicioLocal({ observaciones: '' }), ['cat-comun-1']);
    expect(datos.observaciones).toBeUndefined();
  });

  it('incluye observaciones cuando tiene contenido', () => {
    const { datos } = aEjercicioComun(ejercicioLocal({ observaciones: 'Hacerlo despacio.' }), ['cat-comun-1']);
    expect(datos.observaciones).toBe('Hacerlo despacio.');
  });
});

function ejercicioComun(sobrescribir: Partial<EjercicioComunArchivo> = {}): EjercicioComunArchivo {
  return {
    id: 'comun-1',
    nombre: 'Almeja',
    descripcion: 'Tumbada de lado con las rodillas dobladas.',
    categoriaIds: ['cat-comun-1'],
    enlaces: [{ tipo: 'youtube', url: 'https://www.youtube.com/watch?v=abc123' }],
    imagenes: [],
    ...sobrescribir,
  };
}

describe('aDatosNuevoEjercicio', () => {
  it('sustituye categoriaIds por las categorías locales ya resueltas por el mapeo', () => {
    const resultado = aDatosNuevoEjercicio(ejercicioComun(), ['cat-local-1', 'cat-local-2'], new Map());
    expect(resultado.categoriaIds).toEqual(['cat-local-1', 'cat-local-2']);
  });

  it('conserva nombre, descripción y enlaces sin cambios', () => {
    const resultado = aDatosNuevoEjercicio(ejercicioComun(), ['cat-local-1'], new Map());
    expect(resultado.nombre).toBe('Almeja');
    expect(resultado.descripcion).toBe('Tumbada de lado con las rodillas dobladas.');
    expect(resultado.enlaces).toEqual([{ tipo: 'youtube', url: 'https://www.youtube.com/watch?v=abc123' }]);
  });

  it('conserva las imágenes de tipo url sin cambios', () => {
    const resultado = aDatosNuevoEjercicio(
      ejercicioComun({ imagenes: [{ id: 'img-url', tipo: 'url', valorUrl: 'https://example.com/foto.jpg' }] }),
      ['cat-local-1'],
      new Map()
    );
    expect(resultado.imagenes).toEqual([{ id: 'img-url', tipo: 'url', valorUrl: 'https://example.com/foto.jpg' }]);
  });

  it('reincorpora el contenido base64 de una imagen de archivo a partir del mapa', () => {
    const imagenArchivo: ImagenArchivoJSON = {
      id: 'img-1',
      nombreArchivo: 'foto.png',
      tipoMime: 'image/png',
      contenidoBase64: 'QUJD',
    };
    const resultado = aDatosNuevoEjercicio(
      ejercicioComun({ imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }] }),
      ['cat-local-1'],
      new Map([['img-1', imagenArchivo]])
    );
    expect(resultado.imagenes).toEqual([
      { id: 'img-1', tipo: 'archivo', contenidoBase64: 'QUJD', tipoMime: 'image/png', nombreArchivo: 'foto.png' },
    ]);
  });

  it('omite una imagen de archivo ausente del mapa (lectura inválida, FR-011) sin lanzar error', () => {
    const resultado = aDatosNuevoEjercicio(
      ejercicioComun({ imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }] }),
      ['cat-local-1'],
      new Map()
    );
    expect(resultado.imagenes).toEqual([]);
  });

  it('omite observaciones cuando el ejercicio común no las tiene', () => {
    const resultado = aDatosNuevoEjercicio(ejercicioComun(), ['cat-local-1'], new Map());
    expect(resultado.observaciones).toBeUndefined();
  });

  it('conserva observaciones cuando el ejercicio común las tiene', () => {
    const resultado = aDatosNuevoEjercicio(
      ejercicioComun({ observaciones: 'Hacerlo despacio.' }),
      ['cat-local-1'],
      new Map()
    );
    expect(resultado.observaciones).toBe('Hacerlo despacio.');
  });
});
