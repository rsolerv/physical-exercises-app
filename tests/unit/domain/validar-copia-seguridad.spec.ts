import { describe, expect, it } from 'vitest';
import { validarCopiaSeguridad } from '../../../src/app/domain/copia-seguridad/validar-copia-seguridad';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';

const datosValidos = {
  version: 1,
  ejercicios: [],
  categorias: [],
  planificaciones: [],
  progresoDiario: [],
};

function datos(sobrescribir: Record<string, unknown> = {}) {
  return JSON.stringify({ ...datosValidos, ...sobrescribir });
}

function imagen(id: string, contenidoBase64 = 'ABC123') {
  return JSON.stringify({
    id,
    nombreArchivo: 'foto.png',
    tipoMime: 'image/png',
    contenidoBase64,
  });
}

function datosConImagen(ruta = 'imagenes/img-1.json') {
  return datos({
    ejercicios: [{
      id: 'ej-1',
      nombre: 'Sentadilla',
      descripcion: 'desc',
      categoriaIds: [],
      enlaces: [],
      imagenes: [{ id: 'img-1', tipo: 'archivo', ruta }],
    }],
  });
}

describe('validarCopiaSeguridad', () => {
  it('rechaza datos que no son JSON', () => {
    expect(() => validarCopiaSeguridad('no es JSON', {})).toThrow(
      new ErrorValidacion('El fichero no es una copia de seguridad válida.')
    );
  });

  it('rechaza datos incompletos o estructuras internas con tipos incorrectos', () => {
    expect(() => validarCopiaSeguridad('null', {})).toThrow(ErrorValidacion);
    expect(() => validarCopiaSeguridad(datos({ ejercicios: null }), {})).toThrow(
      new ErrorValidacion('El fichero está dañado o incompleto.')
    );
    expect(() => validarCopiaSeguridad(datos({ categorias: [{}] }), {})).toThrow(
      new ErrorValidacion('El fichero está dañado o incompleto.')
    );
  });

  it('rechaza una imagen referenciada que falta', () => {
    expect(() => validarCopiaSeguridad(datosConImagen(), {})).toThrow(
      new ErrorValidacion('El fichero está dañado o incompleto.')
    );
  });

  it('rechaza rutas fuera de imagenes o con traversal', () => {
    for (const ruta of ['../img-1.json', 'imagenes/../img-1.json', 'imagenes\\img-1.json', 'imagenes/img-1.png']) {
      expect(() => validarCopiaSeguridad(datosConImagen(ruta), { 'imagenes/img-1.json': imagen('img-1') })).toThrow(
        new ErrorValidacion('El fichero está dañado o incompleto.')
      );
    }
  });

  it('rechaza ficheros de imagen inválidos o con id distinto al nombre', () => {
    expect(() => validarCopiaSeguridad(JSON.stringify(datosValidos), {
      'imagenes/img-1.json': 'no es JSON',
    })).toThrow(new ErrorValidacion('El fichero está dañado o incompleto.'));

    expect(() => validarCopiaSeguridad(JSON.stringify(datosValidos), {
      'imagenes/img-1.json': imagen('otro-id'),
    })).toThrow(new ErrorValidacion('El fichero está dañado o incompleto.'));
  });

  it('rechaza un fichero fuera de imagenes', () => {
    expect(() => validarCopiaSeguridad(JSON.stringify(datosValidos), {
      '../datos.json': imagen('img-1'),
    })).toThrow(new ErrorValidacion('El fichero está dañado o incompleto.'));
  });

  it('rechaza imágenes de archivo que superan 5 MB', () => {
    const demasiadoGrande = 'A'.repeat(Math.ceil(((5 * 1024 * 1024 + 1) * 4) / 3));
    expect(() => validarCopiaSeguridad(datosConImagen(), {
      'imagenes/img-1.json': imagen('img-1', demasiadoGrande),
    })).toThrow(new ErrorValidacion('Cada imagen de archivo no puede superar los 5 MB.'));
  });

  it('devuelve datos validados y ficheros de imagen por ruta', () => {
    const documentosImagen = { 'imagenes/img-1.json': imagen('img-1') };
    const resultado = validarCopiaSeguridad(datosConImagen(), documentosImagen);

    expect(resultado).toEqual({
      datos: expect.objectContaining({ ejercicios: expect.any(Array) }),
      imagenes: { 'imagenes/img-1.json': expect.objectContaining({ id: 'img-1' }) },
    });
  });

  it('acepta datos con todas sus colecciones válidas', () => {
    const contenido = datos({
      ejercicios: [{
        id: 'ej-1',
        nombre: 'Sentadilla',
        descripcion: 'desc',
        categoriaIds: ['cat-1'],
        enlaces: [
          { tipo: 'web', url: 'https://ejemplo.es' },
          { tipo: 'youtube', url: 'https://youtube.com/watch?v=demo' },
        ],
        imagenes: [{ id: 'img-url', tipo: 'url', valorUrl: 'https://ejemplo.es/foto.png' }],
        observaciones: 'Tres series.',
      }],
      categorias: [{ id: 'cat-1', nombre: 'Piernas', descripcion: 'Fuerza' }],
      planificaciones: [{
        id: 'plan-1',
        nombre: 'Semana',
        fechaInicio: '2026-10-26',
        dias: [{ diaSemana: 'lunes', ejercicioIds: ['ej-1'] }],
      }],
      progresoDiario: [{ fecha: '2026-10-26', ejercicioId: 'ej-1', realizado: true }],
    });

    expect(() => validarCopiaSeguridad(contenido, {})).not.toThrow();
  });

  it('acepta imágenes con relleno base64 de uno o dos caracteres', () => {
    expect(() => validarCopiaSeguridad(JSON.stringify(datosValidos), {
      'imagenes/img-1.json': imagen('img-1', 'A='),
      'imagenes/img-2.json': imagen('img-2', 'AA=='),
    })).not.toThrow();
  });
});
