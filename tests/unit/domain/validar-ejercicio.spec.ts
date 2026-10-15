import { describe, it, expect } from 'vitest';
import { validarEjercicio } from '../../../src/app/domain/ejercicio/validar-ejercicio';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';
import type { DatosNuevoEjercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

function datosValidos(sobrescribir: Partial<DatosNuevoEjercicio> = {}): DatosNuevoEjercicio {
  return {
    nombre: 'Sentadilla',
    descripcion: 'Flexionar las rodillas manteniendo la espalda recta.',
    categoriaIds: ['cat-1'],
    enlaces: [],
    imagenes: [],
    observaciones: '',
    ...sobrescribir,
  };
}

describe('validarEjercicio', () => {
  it('acepta datos válidos sin lanzar', () => {
    expect(() => validarEjercicio(datosValidos())).not.toThrow();
  });

  it('rechaza un nombre vacío (FR-005)', () => {
    expect(() => validarEjercicio(datosValidos({ nombre: '' }))).toThrow(ErrorValidacion);
    expect(() => validarEjercicio(datosValidos({ nombre: '   ' }))).toThrow(ErrorValidacion);
  });

  it('rechaza una descripción vacía (FR-005)', () => {
    expect(() => validarEjercicio(datosValidos({ descripcion: '' }))).toThrow(ErrorValidacion);
  });

  it('rechaza un ejercicio sin ninguna categoría (FR-006)', () => {
    expect(() => validarEjercicio(datosValidos({ categoriaIds: [] }))).toThrow(ErrorValidacion);
  });

  it('acepta un ejercicio con varias categorías (RN8)', () => {
    expect(() => validarEjercicio(datosValidos({ categoriaIds: ['cat-1', 'cat-2'] }))).not.toThrow();
  });

  it('rechaza un enlace web con formato de URL inválido (FR-007)', () => {
    expect(() =>
      validarEjercicio(datosValidos({ enlaces: [{ tipo: 'web', url: 'ejercicio1' }] }))
    ).toThrow(ErrorValidacion);
  });

  it('rechaza un enlace de YouTube con formato de URL inválido (FR-007)', () => {
    expect(() =>
      validarEjercicio(datosValidos({ enlaces: [{ tipo: 'youtube', url: 'no-es-una-url' }] }))
    ).toThrow(ErrorValidacion);
  });

  it('acepta enlaces web y de YouTube con formato válido', () => {
    expect(() =>
      validarEjercicio(
        datosValidos({
          enlaces: [
            { tipo: 'web', url: 'https://example.com/ejercicio' },
            { tipo: 'youtube', url: 'https://www.youtube.com/watch?v=abc123' },
          ],
        })
      )
    ).not.toThrow();
  });

  it('rechaza una imagen de tipo URL con formato inválido', () => {
    expect(() =>
      validarEjercicio(
        datosValidos({ imagenes: [{ id: 'img-1', tipo: 'url', valorUrl: 'no-url' }] })
      )
    ).toThrow(ErrorValidacion);
  });

  it('rechaza una imagen de tipo URL sin valorUrl (undefined)', () => {
    expect(() =>
      validarEjercicio(datosValidos({ imagenes: [{ id: 'img-1', tipo: 'url' }] }))
    ).toThrow(ErrorValidacion);
  });

  it('acepta una imagen de tipo URL con formato válido', () => {
    expect(() =>
      validarEjercicio(
        datosValidos({
          imagenes: [{ id: 'img-1', tipo: 'url', valorUrl: 'https://example.com/foto.jpg' }],
        })
      )
    ).not.toThrow();
  });

  it('rechaza una imagen de archivo que supera los 5 MB (FR-036)', () => {
    // Base64 de ~6 MB (6 * 1024 * 1024 bytes codificados).
    const contenidoGrande = 'A'.repeat(Math.ceil((6 * 1024 * 1024 * 4) / 3));
    expect(() =>
      validarEjercicio(
        datosValidos({
          imagenes: [
            { id: 'img-1', tipo: 'archivo', contenidoBase64: contenidoGrande, tipoMime: 'image/png', nombreArchivo: 'foto.png' },
          ],
        })
      )
    ).toThrow(ErrorValidacion);
  });

  it('acepta una imagen de archivo de hasta 5 MB', () => {
    const contenidoPequeno = 'A'.repeat(1000);
    expect(() =>
      validarEjercicio(
        datosValidos({
          imagenes: [
            { id: 'img-1', tipo: 'archivo', contenidoBase64: contenidoPequeno, tipoMime: 'image/png', nombreArchivo: 'foto.png' },
          ],
        })
      )
    ).not.toThrow();
  });

  it('cuando no se indican enlaces ni imágenes (undefined), no lanza error (son opcionales)', () => {
    const { enlaces: _enlaces, imagenes: _imagenes, ...resto } = datosValidos();
    expect(() => validarEjercicio(resto as DatosNuevoEjercicio)).not.toThrow();
  });

  it('rechaza un enlace con un protocolo distinto de http/https', () => {
    expect(() =>
      validarEjercicio(datosValidos({ enlaces: [{ tipo: 'web', url: 'ftp://example.com/archivo' }] }))
    ).toThrow(ErrorValidacion);
  });

  it('trata una imagen de archivo sin contenido (contenidoBase64 undefined) como 0 bytes, sin lanzar', () => {
    expect(() =>
      validarEjercicio(
        datosValidos({ imagenes: [{ id: 'img-1', tipo: 'archivo', tipoMime: 'image/png', nombreArchivo: 'foto.png' }] })
      )
    ).not.toThrow();
  });

  it('calcula correctamente el tamaño de un base64 con relleno simple (=) y doble (==)', () => {
    const base64ConUnIgual = btoa('AB'); // "QUI=" (2 bytes -> relleno simple)
    const base64ConDosIguales = btoa('A'); // "QQ==" (1 byte -> relleno doble)
    expect(() =>
      validarEjercicio(
        datosValidos({
          imagenes: [
            { id: 'img-1', tipo: 'archivo', contenidoBase64: base64ConUnIgual, tipoMime: 'image/png', nombreArchivo: 'a.png' },
            { id: 'img-2', tipo: 'archivo', contenidoBase64: base64ConDosIguales, tipoMime: 'image/png', nombreArchivo: 'b.png' },
          ],
        })
      )
    ).not.toThrow();
  });
});
