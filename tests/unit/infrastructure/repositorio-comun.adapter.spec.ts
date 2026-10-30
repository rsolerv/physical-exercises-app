import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RepositorioComunAdapter } from '../../../src/app/infrastructure/repositorio-comun/repositorio-comun.adapter';
import { ErrorRedSincronizacion, ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';
import type { EjercicioComunArchivo } from '../../../src/app/application/ports/repositorio-comun.port';
import type { ImagenArchivoJSON } from '../../../src/app/application/ports/github-sync.port';

const RAW_BASE = 'https://raw.githubusercontent.com/rsolerv/common-data-physical-exercises/main';
const API_CONTENTS = 'https://api.github.com/repos/rsolerv/common-data-physical-exercises/contents';

function ejercicioComun(sobrescribir: Partial<EjercicioComunArchivo> = {}): EjercicioComunArchivo {
  return {
    id: 'ej-1',
    nombre: 'Almeja',
    descripcion: 'Tumbada de lado con las rodillas dobladas.',
    categoriaIds: ['cat-comun-1'],
    enlaces: [],
    imagenes: [],
    ...sobrescribir,
  };
}

/** Da tiempo a que se resuelvan las promesas encadenadas entre dos peticiones HTTP consecutivas. */
function flushMicrotareas(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('RepositorioComunAdapter (lectura pública, US1)', () => {
  let adapter: RepositorioComunAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    adapter = TestBed.inject(RepositorioComunAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('listarCategorias', () => {
    it('descarga categorias.json de main por su URL raw, sin cabecera de autorización', async () => {
      const promesa = adapter.listarCategorias();

      const peticion = httpMock.expectOne(`${RAW_BASE}/categorias.json`);
      expect(peticion.request.headers.get('Authorization')).toBeNull();
      peticion.flush({ version: 1, categorias: [{ id: 'cat-comun-1', nombre: 'Rodilla' }] });

      await expect(promesa).resolves.toEqual([{ id: 'cat-comun-1', nombre: 'Rodilla' }]);
    });

    it('devuelve una lista vacía (no un error) si categorias.json no existe todavía', async () => {
      const promesa = adapter.listarCategorias();

      httpMock.expectOne(`${RAW_BASE}/categorias.json`).flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

      await expect(promesa).resolves.toEqual([]);
    });
  });

  describe('buscarEjercicios', () => {
    it('sin texto ni categoría, devuelve el catálogo completo (FR-004) sin credenciales', async () => {
      const promesa = adapter.buscarEjercicios('', null);

      const listado = httpMock.expectOne(`${API_CONTENTS}/ejercicios?ref=main`);
      expect(listado.request.headers.get('Authorization')).toBeNull();
      listado.flush([{ name: 'ej-1.json' }, { name: 'ej-2.json' }]);
      await flushMicrotareas();

      const ej1 = ejercicioComun({ id: 'ej-1', nombre: 'Almeja' });
      const ej2 = ejercicioComun({ id: 'ej-2', nombre: 'Sentadilla' });
      httpMock.expectOne(`${RAW_BASE}/ejercicios/ej-1.json`).flush(ej1);
      httpMock.expectOne(`${RAW_BASE}/ejercicios/ej-2.json`).flush(ej2);

      const resultado = await promesa;
      expect(resultado).toEqual(expect.arrayContaining([ej1, ej2]));
      expect(resultado).toHaveLength(2);
    });

    it('devuelve una lista vacía si /ejercicios no existe todavía en main', async () => {
      const promesa = adapter.buscarEjercicios('', null);

      httpMock.expectOne(`${API_CONTENTS}/ejercicios?ref=main`).flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

      await expect(promesa).resolves.toEqual([]);
    });

    it('filtra por texto parcial en nombre o descripción, sin distinguir mayúsculas/minúsculas', async () => {
      const promesa = adapter.buscarEjercicios('almeja', null);

      httpMock.expectOne(`${API_CONTENTS}/ejercicios?ref=main`).flush([{ name: 'ej-1.json' }, { name: 'ej-2.json' }]);
      await flushMicrotareas();

      httpMock.expectOne(`${RAW_BASE}/ejercicios/ej-1.json`).flush(ejercicioComun({ id: 'ej-1', nombre: 'Almeja' }));
      httpMock.expectOne(`${RAW_BASE}/ejercicios/ej-2.json`).flush(ejercicioComun({ id: 'ej-2', nombre: 'Sentadilla' }));

      const resultado = await promesa;
      expect(resultado.map((e) => e.id)).toEqual(['ej-1']);
    });

    it('filtra por categoriaId cuando se indica (selección única, FR-002)', async () => {
      const promesa = adapter.buscarEjercicios('', 'cat-comun-2');

      httpMock.expectOne(`${API_CONTENTS}/ejercicios?ref=main`).flush([{ name: 'ej-1.json' }, { name: 'ej-2.json' }]);
      await flushMicrotareas();

      httpMock
        .expectOne(`${RAW_BASE}/ejercicios/ej-1.json`)
        .flush(ejercicioComun({ id: 'ej-1', categoriaIds: ['cat-comun-1'] }));
      httpMock
        .expectOne(`${RAW_BASE}/ejercicios/ej-2.json`)
        .flush(ejercicioComun({ id: 'ej-2', categoriaIds: ['cat-comun-2'] }));

      const resultado = await promesa;
      expect(resultado.map((e) => e.id)).toEqual(['ej-2']);
    });

    it('combina texto y categoría cuando se indican ambos', async () => {
      const promesa = adapter.buscarEjercicios('sentadilla', 'cat-comun-1');

      httpMock.expectOne(`${API_CONTENTS}/ejercicios?ref=main`).flush([{ name: 'ej-1.json' }, { name: 'ej-2.json' }]);
      await flushMicrotareas();

      httpMock
        .expectOne(`${RAW_BASE}/ejercicios/ej-1.json`)
        .flush(ejercicioComun({ id: 'ej-1', nombre: 'Sentadilla', categoriaIds: ['cat-comun-2'] }));
      httpMock
        .expectOne(`${RAW_BASE}/ejercicios/ej-2.json`)
        .flush(ejercicioComun({ id: 'ej-2', nombre: 'Sentadilla', categoriaIds: ['cat-comun-1'] }));

      const resultado = await promesa;
      expect(resultado.map((e) => e.id)).toEqual(['ej-2']);
    });
  });

  describe('obtenerEjercicioPorId', () => {
    it('descarga un ejercicio concreto de main sin credenciales', async () => {
      const promesa = adapter.obtenerEjercicioPorId('ej-1');
      const peticion = httpMock.expectOne(`${RAW_BASE}/ejercicios/ej-1.json`);
      expect(peticion.request.headers.get('Authorization')).toBeNull();
      const ejercicio = ejercicioComun();
      peticion.flush(ejercicio);

      await expect(promesa).resolves.toEqual(ejercicio);
    });

    it('devuelve null si el ejercicio no existe en main', async () => {
      const promesa = adapter.obtenerEjercicioPorId('ej-inexistente');

      httpMock
        .expectOne(`${RAW_BASE}/ejercicios/ej-inexistente.json`)
        .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

      await expect(promesa).resolves.toBeNull();
    });
  });

  describe('leerImagen', () => {
    it('descarga y parsea imagenes/<id>.json de main por su URL raw', async () => {
      const promesa = adapter.leerImagen('imagenes/img-1.json');

      const peticion = httpMock.expectOne(`${RAW_BASE}/imagenes/img-1.json`);
      expect(peticion.request.headers.get('Authorization')).toBeNull();
      peticion.flush({ id: 'img-1', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'QUJD' });

      await expect(promesa).resolves.toEqual({
        id: 'img-1',
        nombreArchivo: 'foto.png',
        tipoMime: 'image/png',
        contenidoBase64: 'QUJD',
      });
    });

    it('lanza ErrorValidacion si el documento remoto no tiene el formato de ImagenArchivoJSON (FR-011)', async () => {
      const promesa = adapter.leerImagen('imagenes/img-1.json');
      const esperacion = expect(promesa).rejects.toThrow(ErrorValidacion);

      httpMock.expectOne(`${RAW_BASE}/imagenes/img-1.json`).flush({ id: 'img-1' });

      await esperacion;
    });
  });

  it('lanza ErrorRedSincronizacion si no hay conexión (FR-023)', async () => {
    const promesa = adapter.listarCategorias();
    const esperacion = expect(promesa).rejects.toThrow(ErrorRedSincronizacion);

    httpMock.expectOne(`${RAW_BASE}/categorias.json`).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    await esperacion;
  });
});

const CREDENCIALES = { tokenPAT: 'token-secreto', repositorio: 'owner/datos-privados' };

describe('RepositorioComunAdapter (subida, US2)', () => {
  let adapter: RepositorioComunAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    adapter = TestBed.inject(RepositorioComunAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('existeEjercicioPorNombre', () => {
    it('lista /ejercicios en main de forma autenticada y compara por nombre normalizado (FR-017)', async () => {
      const promesa = adapter.existeEjercicioPorNombre(CREDENCIALES, '  ALMEJA ');

      const listado = httpMock.expectOne(`${API_CONTENTS}/ejercicios?ref=main`);
      expect(listado.request.headers.get('Authorization')).toContain('token-secreto');
      listado.flush([{ name: 'ej-1.json' }]);
      await flushMicrotareas();

      httpMock.expectOne(`${RAW_BASE}/ejercicios/ej-1.json`).flush(ejercicioComun({ nombre: 'Almeja' }));

      await expect(promesa).resolves.toBe(true);
    });

    it('devuelve false si ningún ejercicio publicado coincide por nombre', async () => {
      const promesa = adapter.existeEjercicioPorNombre(CREDENCIALES, 'Sentadilla');

      httpMock.expectOne(`${API_CONTENTS}/ejercicios?ref=main`).flush([{ name: 'ej-1.json' }]);
      await flushMicrotareas();
      httpMock.expectOne(`${RAW_BASE}/ejercicios/ej-1.json`).flush(ejercicioComun({ nombre: 'Almeja' }));

      await expect(promesa).resolves.toBe(false);
    });
  });

  describe('subirEjercicio', () => {
    it('crea primero cada imagen de archivo y después el ejercicio, ambos en requests, sin SHA (FR-017, FR-019)', async () => {
      const imagen: ImagenArchivoJSON = { id: 'img-1', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'QUJD' };
      const ejercicio = ejercicioComun({ imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }] });
      const promesa = adapter.subirEjercicio(CREDENCIALES, ejercicio, [imagen]);

      const peticionImagen = httpMock.expectOne(`${API_CONTENTS}/imagenes/img-1.json`);
      expect(peticionImagen.request.method).toBe('PUT');
      expect(peticionImagen.request.body.branch).toBe('requests');
      expect(peticionImagen.request.body.sha).toBeUndefined();
      peticionImagen.flush({ content: { sha: 'sha-imagen' } });
      await flushMicrotareas();

      const peticionEjercicio = httpMock.expectOne(`${API_CONTENTS}/ejercicios/${ejercicio.id}.json`);
      expect(peticionEjercicio.request.method).toBe('PUT');
      expect(peticionEjercicio.request.body.branch).toBe('requests');
      peticionEjercicio.flush({ content: { sha: 'sha-ejercicio' } });

      await expect(promesa).resolves.toBeUndefined();
    });

    it('solo sube las imágenes de archivo referenciadas por el ejercicio', async () => {
      const imagenAsociada: ImagenArchivoJSON = {
        id: 'img-asociada',
        nombreArchivo: 'foto.png',
        tipoMime: 'image/png',
        contenidoBase64: 'QUJD',
      };
      const imagenAjena: ImagenArchivoJSON = {
        id: 'img-ajena',
        nombreArchivo: 'otra.png',
        tipoMime: 'image/png',
        contenidoBase64: 'REVG',
      };
      const ejercicio = ejercicioComun({
        imagenes: [{ id: 'img-asociada', tipo: 'archivo', ruta: 'imagenes/img-asociada.json' }],
      });
      const promesa = adapter.subirEjercicio(CREDENCIALES, ejercicio, [imagenAsociada, imagenAjena]);

      const peticionImagen = httpMock.expectOne(`${API_CONTENTS}/imagenes/img-asociada.json`);
      peticionImagen.flush({ content: { sha: 'sha-imagen' } });
      await flushMicrotareas();

      const peticionEjercicio = httpMock.expectOne(`${API_CONTENTS}/ejercicios/${ejercicio.id}.json`);
      peticionEjercicio.flush({ content: { sha: 'sha-ejercicio' } });

      await expect(promesa).resolves.toBeUndefined();
      httpMock.expectNone(`${API_CONTENTS}/imagenes/img-ajena.json`);
    });

    it('no sube documentos de imagen si el ejercicio no tiene imágenes de archivo', async () => {
      const imagenAjena: ImagenArchivoJSON = {
        id: 'img-ajena',
        nombreArchivo: 'otra.png',
        tipoMime: 'image/png',
        contenidoBase64: 'REVG',
      };
      const ejercicio = ejercicioComun({ imagenes: [{ id: 'img-url', tipo: 'url', valorUrl: 'https://example.com/foto.jpg' }] });
      const promesa = adapter.subirEjercicio(CREDENCIALES, ejercicio, [imagenAjena]);

      const peticionEjercicio = httpMock.expectOne(`${API_CONTENTS}/ejercicios/${ejercicio.id}.json`);
      peticionEjercicio.flush({ content: { sha: 'sha-ejercicio' } });

      await expect(promesa).resolves.toBeUndefined();
      httpMock.expectNone(`${API_CONTENTS}/imagenes/img-ajena.json`);
    });

    it('no envía el ejercicio si falla antes la subida de una imagen (sin cambios parciales)', async () => {
      const imagen: ImagenArchivoJSON = { id: 'img-1', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'QUJD' };
      const ejercicio = ejercicioComun({ imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }] });
      const promesa = adapter.subirEjercicio(CREDENCIALES, ejercicio, [imagen]);
      const esperacion = expect(promesa).rejects.toThrow(ErrorRedSincronizacion);

      httpMock
        .expectOne(`${API_CONTENTS}/imagenes/img-1.json`)
        .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      await esperacion;
      httpMock.expectNone(`${API_CONTENTS}/ejercicios/${ejercicio.id}.json`);
    });
  });
});
