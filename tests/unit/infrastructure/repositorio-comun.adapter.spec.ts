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
const CREDENCIALES = { tokenPAT: 'token-secreto', repositorio: 'owner/datos-privados' };

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

function codificarJSON(documento: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(documento))));
}

function decodificarJSON(contenido: string): unknown {
  return JSON.parse(decodeURIComponent(escape(atob(contenido))));
}

function flushMicrotareas(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function documentoCategorias(
  categorias: { id: string | number; nombre: string; ejercicios?: (string | number)[] }[] = [
    { id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['ej-1'] },
  ]
) {
  return { version: 1, categorias };
}

describe('RepositorioComunAdapter', () => {
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
    it('descarga las categorías y sus ids de ejercicios de main sin autorización', async () => {
      const promesa = adapter.listarCategorias();
      const peticion = httpMock.expectOne(`${RAW_BASE}/categorias.json`);
      expect(peticion.request.headers.get('Authorization')).toBeNull();
      const categorias = [{ id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['23', 'ej-1'] }];
      peticion.flush(documentoCategorias(categorias));
      await expect(promesa).resolves.toEqual(categorias);
    });

    it('devuelve una lista vacía si categorias.json no existe todavía', async () => {
      const promesa = adapter.listarCategorias();
      httpMock
        .expectOne(`${RAW_BASE}/categorias.json`)
        .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
      await expect(promesa).resolves.toEqual([]);
    });

    it('normaliza ids numéricos de categoría y ejercicio a cadenas en el catálogo', async () => {
      const promesa = adapter.listarCategorias();
      httpMock
        .expectOne(`${RAW_BASE}/categorias.json`)
        .flush(documentoCategorias([{ id: 1, nombre: 'Piernas', ejercicios: [23] }]));
      await expect(promesa).resolves.toEqual([{ id: '1', nombre: 'Piernas', ejercicios: ['23'] }]);
    });

    it('rechaza un índice de categorías mal formado', async () => {
      const promesa = adapter.listarCategorias();
      const esperacion = expect(promesa).rejects.toThrow(ErrorValidacion);
      httpMock.expectOne(`${RAW_BASE}/categorias.json`).flush({ categorias: [{ id: 'cat-1' }] });
      await esperacion;
    });
  });

  describe('buscarEjercicios', () => {
    it('descarga solo los ejercicios indexados en la categoría seleccionada y filtra por texto', async () => {
      const promesa = adapter.buscarEjercicios('almeja', 'cat-comun-1');
      httpMock.expectOne(`${RAW_BASE}/categorias.json`).flush(
        documentoCategorias([
          { id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['23', '55', '23'] },
          { id: 'cat-comun-2', nombre: 'Piernas', ejercicios: ['34'] },
        ])
      );
      await flushMicrotareas();

      const ejercicio23 = ejercicioComun({ id: '23', nombre: 'Almeja' });
      httpMock.expectOne(`${RAW_BASE}/ejercicios/23/23.json`).flush(ejercicio23);
      httpMock.expectOne(`${RAW_BASE}/ejercicios/55/55.json`).flush(ejercicioComun({ id: '55', nombre: 'Sentadilla' }));

      await expect(promesa).resolves.toEqual([ejercicio23]);
      httpMock.expectNone(`${RAW_BASE}/ejercicios/34/34.json`);
      httpMock.expectNone(`${API_CONTENTS}/ejercicios?ref=main`);
    });

    it('sin categoría consulta la unión única de ids de todas las categorías', async () => {
      const promesa = adapter.buscarEjercicios('', null);
      httpMock.expectOne(`${RAW_BASE}/categorias.json`).flush(
        documentoCategorias([
          { id: 'cat-1', nombre: 'Rodilla', ejercicios: ['23', '55'] },
          { id: 'cat-2', nombre: 'Piernas', ejercicios: [55, '34'] },
        ])
      );
      await flushMicrotareas();

      const ids = ['23', '55', '34'];
      for (const id of ids) {
        httpMock.expectOne(`${RAW_BASE}/ejercicios/${id}/${id}.json`).flush(ejercicioComun({ id }));
      }

      await expect(promesa).resolves.toHaveLength(3);
    });

    it('no descarga ejercicios cuando la categoría seleccionada no tiene ids asociados', async () => {
      const promesa = adapter.buscarEjercicios('sentadilla', 'cat-vacia');
      httpMock
        .expectOne(`${RAW_BASE}/categorias.json`)
        .flush(documentoCategorias([{ id: 'cat-vacia', nombre: 'Vacía', ejercicios: [] }]));
      await flushMicrotareas();
      await expect(promesa).resolves.toEqual([]);
    });
  });

  describe('obtenerEjercicioPorId', () => {
    it('descarga directamente ejercicios/<id>/<id>.json sin credenciales', async () => {
      const promesa = adapter.obtenerEjercicioPorId('ej-1');
      const peticion = httpMock.expectOne(`${RAW_BASE}/ejercicios/ej-1/ej-1.json`);
      expect(peticion.request.headers.get('Authorization')).toBeNull();
      const ejercicio = ejercicioComun();
      peticion.flush(ejercicio);
      await expect(promesa).resolves.toEqual(ejercicio);
    });

    it('devuelve null si el ejercicio no existe', async () => {
      const promesa = adapter.obtenerEjercicioPorId('ej-inexistente');
      httpMock
        .expectOne(`${RAW_BASE}/ejercicios/ej-inexistente/ej-inexistente.json`)
        .flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
      await expect(promesa).resolves.toBeNull();
    });
  });

  describe('leerImagen', () => {
    it('lee la imagen desde el subdirectorio del ejercicio manteniendo la ruta del JSON', async () => {
      const promesa = adapter.leerImagen('23', 'imagenes/233433.json');
      const peticion = httpMock.expectOne(`${RAW_BASE}/ejercicios/23/imagenes/233433.json`);
      expect(peticion.request.headers.get('Authorization')).toBeNull();
      const imagen = { id: '233433', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'QUJD' };
      peticion.flush(imagen);
      await expect(promesa).resolves.toEqual(imagen);
    });

    it('rechaza rutas de imagen que no sean relativas a imagenes/', async () => {
      await expect(adapter.leerImagen('23', '../categorias.json')).rejects.toThrow(ErrorValidacion);
    });

    it('rechaza documentos remotos que no tienen formato de imagen', async () => {
      const promesa = adapter.leerImagen('23', 'imagenes/233433.json');
      const esperacion = expect(promesa).rejects.toThrow(ErrorValidacion);
      httpMock.expectOne(`${RAW_BASE}/ejercicios/23/imagenes/233433.json`).flush({ id: '233433' });
      await esperacion;
    });
  });

  describe('existeEjercicioPorNombre', () => {
    it('usa el índice de categorías para localizar ejercicios sin listar el directorio', async () => {
      const promesa = adapter.existeEjercicioPorNombre('  ALMEJA ');
      httpMock.expectOne(`${RAW_BASE}/categorias.json`).flush(
        documentoCategorias([{ id: 'cat-1', nombre: 'Rodilla', ejercicios: ['ej-1'] }])
      );
      await flushMicrotareas();
      httpMock.expectOne(`${RAW_BASE}/ejercicios/ej-1/ej-1.json`).flush(ejercicioComun());
      await expect(promesa).resolves.toBe(true);
      httpMock.expectNone(`${API_CONTENTS}/ejercicios?ref=main`);
    });

    it('devuelve false si el nombre no coincide con ningún ejercicio del índice', async () => {
      const promesa = adapter.existeEjercicioPorNombre('Sentadilla');
      httpMock.expectOne(`${RAW_BASE}/categorias.json`).flush(
        documentoCategorias([{ id: 'cat-1', nombre: 'Rodilla', ejercicios: ['ej-1'] }])
      );
      await flushMicrotareas();
      httpMock.expectOne(`${RAW_BASE}/ejercicios/ej-1/ej-1.json`).flush(ejercicioComun());
      await expect(promesa).resolves.toBe(false);
    });
  });

  describe('subirEjercicio', () => {
    it('sube imagen y ejercicio bajo su carpeta y actualiza categorias.json con su sha', async () => {
      const imagen: ImagenArchivoJSON = {
        id: 'img-1',
        nombreArchivo: 'foto.png',
        tipoMime: 'image/png',
        contenidoBase64: 'QUJD',
      };
      const ejercicio = ejercicioComun({
        id: 'ej-2',
        categoriaIds: ['1'],
        imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }],
      });
      const promesa = adapter.subirEjercicio(CREDENCIALES, ejercicio, [imagen]);
      const categoriasOriginales = documentoCategorias([
        { id: 1, nombre: 'Rodilla', ejercicios: [23] },
        { id: 'cat-comun-2', nombre: 'Piernas', ejercicios: [] },
      ]);
      const lecturaCategorias = httpMock.expectOne(`${API_CONTENTS}/categorias.json?ref=requests`);
      expect(lecturaCategorias.request.headers.get('Authorization')).toContain('token-secreto');
      lecturaCategorias.flush({ content: codificarJSON(categoriasOriginales), sha: 'sha-categorias' });
      await flushMicrotareas();

      const peticionImagen = httpMock.expectOne(`${API_CONTENTS}/ejercicios/ej-2/imagenes/img-1.json`);
      expect(peticionImagen.request.method).toBe('PUT');
      expect(peticionImagen.request.body.branch).toBe('requests');
      expect(peticionImagen.request.body.sha).toBeUndefined();
      expect(decodificarJSON(peticionImagen.request.body.content)).toEqual(imagen);
      peticionImagen.flush({ content: { sha: 'sha-imagen' } });
      await flushMicrotareas();

      const peticionEjercicio = httpMock.expectOne(`${API_CONTENTS}/ejercicios/ej-2/ej-2.json`);
      expect(peticionEjercicio.request.method).toBe('PUT');
      expect(peticionEjercicio.request.body.branch).toBe('requests');
      expect(decodificarJSON(peticionEjercicio.request.body.content)).toEqual(ejercicio);
      peticionEjercicio.flush({ content: { sha: 'sha-ejercicio' } });
      await flushMicrotareas();

      const actualizacion = httpMock.expectOne(`${API_CONTENTS}/categorias.json`);
      expect(actualizacion.request.method).toBe('PUT');
      expect(actualizacion.request.body.branch).toBe('requests');
      expect(actualizacion.request.body.sha).toBe('sha-categorias');
      expect(decodificarJSON(actualizacion.request.body.content)).toEqual({
        ...categoriasOriginales,
        categorias: [
          { id: 1, nombre: 'Rodilla', ejercicios: [23, 'ej-2'] },
          { id: 'cat-comun-2', nombre: 'Piernas', ejercicios: [] },
        ],
      });
      actualizacion.flush({ content: { sha: 'sha-categorias-nuevo' } });
      await expect(promesa).resolves.toBeUndefined();
    });

    it('rechaza categorías desconocidas antes de crear ficheros', async () => {
      const promesa = adapter.subirEjercicio(CREDENCIALES, ejercicioComun(), []);
      const esperacion = expect(promesa).rejects.toThrow(ErrorValidacion);
      httpMock.expectOne(`${API_CONTENTS}/categorias.json?ref=requests`).flush({
        content: codificarJSON(documentoCategorias([{ id: 'otra-categoria', nombre: 'Piernas', ejercicios: [] }])),
        sha: 'sha-categorias',
      });
      await flushMicrotareas();
      await esperacion;
      httpMock.expectNone(`${API_CONTENTS}/ejercicios/ej-1/ej-1.json`);
      httpMock.expectNone(`${API_CONTENTS}/categorias.json`);
    });

    it('no crea el ejercicio ni actualiza el índice si falla la subida de una imagen', async () => {
      const imagen: ImagenArchivoJSON = {
        id: 'img-1',
        nombreArchivo: 'foto.png',
        tipoMime: 'image/png',
        contenidoBase64: 'QUJD',
      };
      const ejercicio = ejercicioComun({
        imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }],
      });
      const promesa = adapter.subirEjercicio(CREDENCIALES, ejercicio, [imagen]);
      const esperacion = expect(promesa).rejects.toThrow(ErrorRedSincronizacion);
      httpMock.expectOne(`${API_CONTENTS}/categorias.json?ref=requests`).flush({
        content: codificarJSON(documentoCategorias()),
        sha: 'sha-categorias',
      });
      await flushMicrotareas();
      httpMock
        .expectOne(`${API_CONTENTS}/ejercicios/ej-1/imagenes/img-1.json`)
        .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
      await esperacion;
      httpMock.expectNone(`${API_CONTENTS}/ejercicios/ej-1/ej-1.json`);
      httpMock.expectNone(`${API_CONTENTS}/categorias.json`);
    });
  });

  it('traduce errores de red al leer categorias.json', async () => {
    const promesa = adapter.listarCategorias();
    const esperacion = expect(promesa).rejects.toThrow(ErrorRedSincronizacion);
    httpMock
      .expectOne(`${RAW_BASE}/categorias.json`)
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await esperacion;
  });
});
