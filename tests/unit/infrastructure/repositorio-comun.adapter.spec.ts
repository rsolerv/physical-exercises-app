import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RepositorioComunAdapter } from '../../../src/app/infrastructure/repositorio-comun/repositorio-comun.adapter';
import {
  ErrorAutenticacionGitHub,
  ErrorConflictoRemoto,
  ErrorRedSincronizacion,
  ErrorValidacion,
} from '../../../src/app/domain/errores/errores-dominio';
import type { EjercicioComunArchivo } from '../../../src/app/application/ports/repositorio-comun.port';
import type { ImagenArchivoJSON } from '../../../src/app/application/ports/github-sync.port';

const RAW_REPOSITORIO = 'https://raw.githubusercontent.com/rsolerv/common-data-physical-exercises';
const RAW_BASE = `${RAW_REPOSITORIO}/main`;
const API_CONTENTS = 'https://api.github.com/repos/rsolerv/common-data-physical-exercises/contents';
const API_REPOSITORIO = 'https://api.github.com/repos/rsolerv/common-data-physical-exercises';
const API_GRAPHQL_GITHUB = 'https://api.github.com/graphql';
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

    it('no considera ejercicios en categorías antiguas que carecen de índice', async () => {
      const promesa = adapter.existeEjercicioPorNombre('Sentadilla');
      httpMock
        .expectOne(`${RAW_BASE}/categorias.json`)
        .flush(documentoCategorias([{ id: 'cat-antigua', nombre: 'Antigua' }]));
      await expect(promesa).resolves.toBe(false);
    });

    it('normaliza ids numéricos de categoría y ejercicio a cadenas en el catálogo', async () => {
      const promesa = adapter.listarCategorias();
      httpMock
        .expectOne(`${RAW_BASE}/categorias.json`)
        .flush(documentoCategorias([{ id: 1, nombre: 'Piernas', ejercicios: [23] }]));
      await expect(promesa).resolves.toEqual([{ id: '1', nombre: 'Piernas', ejercicios: ['23'] }]);
    });

    it('trata como vacía una categoría antigua sin lista de ejercicios', async () => {
      const promesa = adapter.listarCategorias();
      httpMock
        .expectOne(`${RAW_BASE}/categorias.json`)
        .flush(documentoCategorias([{ id: 'cat-antigua', nombre: 'Antigua' }]));
      await expect(promesa).resolves.toEqual([{ id: 'cat-antigua', nombre: 'Antigua', ejercicios: [] }]);
    });

    it('rechaza un índice de categorías mal formado', async () => {
      const promesa = adapter.listarCategorias();
      const esperacion = expect(promesa).rejects.toThrow(ErrorValidacion);
      httpMock.expectOne(`${RAW_BASE}/categorias.json`).flush({ categorias: [{ id: 'cat-1' }] });
      await esperacion;
    });

    it('traduce fallos de red al leer una imagen', async () => {
      const promesa = adapter.leerImagen('23', 'imagenes/233433.json');
      const esperacion = expect(promesa).rejects.toThrow(ErrorRedSincronizacion);
      httpMock
        .expectOne(`${RAW_BASE}/ejercicios/23/imagenes/233433.json`)
        .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
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
          { id: 'cat-3', nombre: 'Sin índice' },
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

    it('rechaza una imagen que no es un objeto', async () => {
      const promesa = adapter.leerImagen('23', 'imagenes/233433.json');
      const esperacion = expect(promesa).rejects.toThrow(ErrorValidacion);
      httpMock.expectOne(`${RAW_BASE}/ejercicios/23/imagenes/233433.json`).flush(null);
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

    describe('obtenerLoginGitHub', () => {
      it('consulta a GitHub la identidad asociada a la PAT', async () => {
        const promesa = adapter.obtenerLoginGitHub('pat-admin');
        const peticion = httpMock.expectOne('https://api.github.com/user');
        expect(peticion.request.headers.get('Authorization')).toContain('pat-admin');
        peticion.flush({ login: 'rsolerv' });
        await expect(promesa).resolves.toBe('rsolerv');
      });

      it('rechaza una respuesta sin login de usuario', async () => {
        const promesa = adapter.obtenerLoginGitHub('pat-admin');
        const esperacion = expect(promesa).rejects.toThrow(ErrorValidacion);
        httpMock.expectOne('https://api.github.com/user').flush({});
        await esperacion;
      });

      it('rechaza un login vacío y traduce un token rechazado por GitHub', async () => {
        const loginVacio = adapter.obtenerLoginGitHub('pat-admin');
        const errorLogin = expect(loginVacio).rejects.toThrow(ErrorValidacion);
        httpMock.expectOne('https://api.github.com/user').flush({ login: '  ' });
        await errorLogin;

        const patRechazada = adapter.obtenerLoginGitHub('pat-invalida');
        const errorAuth = expect(patRechazada).rejects.toThrow(ErrorAutenticacionGitHub);
        httpMock.expectOne('https://api.github.com/user').flush(
          { message: 'Bad credentials' },
          { status: 401, statusText: 'Unauthorized' }
        );
        await errorAuth;
      });
    });

    describe('eliminarEjercicio', () => {
      async function prepararArbolRama(
        rama: 'main' | 'requests',
        sha: string,
        categorias: unknown | null,
        tree: unknown[],
        truncated = false
      ): Promise<void> {
        httpMock.expectOne(`${API_REPOSITORIO}/git/ref/heads/${rama}`).flush({ object: { sha } });
        await flushMicrotareas();

        const lecturaCategorias = httpMock.expectOne(`${API_CONTENTS}/categorias.json?ref=${rama}`);
        if (categorias === null) {
          lecturaCategorias.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
        } else {
          lecturaCategorias.flush({ content: codificarJSON(categorias), sha: `sha-${rama}-categorias` });
        }
        await flushMicrotareas();

        httpMock.expectOne(`${API_REPOSITORIO}/git/commits/${sha}`).flush({ tree: { sha: `tree-${rama}` } });
        await flushMicrotareas();
        httpMock.expectOne(`${API_REPOSITORIO}/git/trees/tree-${rama}?recursive=1`).flush({ truncated, tree });
        await flushMicrotareas();
      }

      it('rechaza identificadores que no se pueden usar como carpeta', async () => {
        await expect(adapter.eliminarEjercicio(CREDENCIALES, '../otro')).rejects.toThrow(ErrorValidacion);
        httpMock.expectNone(`${API_REPOSITORIO}/git/ref/heads/main`);
        httpMock.expectNone(`${API_REPOSITORIO}/git/ref/heads/requests`);
      });

      it('prepara ambas ramas y elimina documentos, imagenes e indices antes de invalidar la cache', async () => {
        const categorias = documentoCategorias([
          { id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['ej-1', 'ej-2'] },
          { id: 'cat-comun-2', nombre: 'Piernas', ejercicios: ['ej-1'] },
          { id: 'cat-sin-indice', nombre: 'Sin indice', ejercicios: [] },
        ]);
        const categoriasActualizadas = documentoCategorias([
          { id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['ej-2'] },
          { id: 'cat-comun-2', nombre: 'Piernas', ejercicios: [] },
          { id: 'cat-sin-indice', nombre: 'Sin indice', ejercicios: [] },
        ]);
        const promesa = adapter.eliminarEjercicio(CREDENCIALES, 'ej-1');

        await prepararArbolRama('main', 'main-base', categorias, [
          { path: 'ejercicios/ej-1/ej-1.json', type: 'blob' },
          { path: 'ejercicios/ej-1/imagenes/main.png.json', type: 'blob' },
          { path: 'ejercicios/ej-2/ej-2.json', type: 'blob' },
        ]);
        await prepararArbolRama('requests', 'requests-base', categorias, [
          { path: 'ejercicios/ej-1/ej-1.json', type: 'blob' },
          { path: 'ejercicios/ej-1/imagenes/requests.png.json', type: 'blob' },
          { path: 'ejercicios/ej-2/ej-2.json', type: 'blob' },
        ]);

        const commitRequests = httpMock.expectOne(API_GRAPHQL_GITHUB);
        expect(commitRequests.request.body.variables.input.branch.branchName).toBe('requests');
        expect(commitRequests.request.body.variables.input.fileChanges.deletions).toEqual([
          { path: 'ejercicios/ej-1/ej-1.json' },
          { path: 'ejercicios/ej-1/imagenes/requests.png.json' },
        ]);
        expect(JSON.parse(atob(commitRequests.request.body.variables.input.fileChanges.additions[0].contents)).categorias)
          .toEqual(categoriasActualizadas.categorias);
        commitRequests.flush({ data: { createCommitOnBranch: { commit: { oid: 'requests-nuevo' } } } });
        await flushMicrotareas();

        const commitMain = httpMock.expectOne(API_GRAPHQL_GITHUB);
        expect(commitMain.request.body.variables.input.branch.branchName).toBe('main');
        expect(commitMain.request.body.variables.input.expectedHeadOid).toBe('main-base');
        expect(commitMain.request.body.variables.input.fileChanges.deletions).toEqual([
          { path: 'ejercicios/ej-1/ej-1.json' },
          { path: 'ejercicios/ej-1/imagenes/main.png.json' },
        ]);
        commitMain.flush({ data: { createCommitOnBranch: { commit: { oid: 'main-nuevo' } } } });
        await expect(promesa).resolves.toBeUndefined();

        const lecturaActualizada = adapter.listarCategorias();
        httpMock.expectOne(`${RAW_REPOSITORIO}/main-nuevo/categorias.json`).flush(categoriasActualizadas);
        await expect(lecturaActualizada).resolves.toEqual(categoriasActualizadas.categorias);
      });

      it('actualiza solo requests cuando main ya no contiene el ejercicio', async () => {
        const categorias = documentoCategorias([{ id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['ej-2'] }]);
        const promesa = adapter.eliminarEjercicio(CREDENCIALES, 'ej-1');
        await prepararArbolRama('main', 'main-base', categorias, [
          { path: 'ejercicios/ej-2/ej-2.json', type: 'blob' },
        ]);
        await prepararArbolRama('requests', 'requests-base', categorias, [
          { path: 'ejercicios/ej-1/ej-1.json', type: 'blob' },
          { path: 'ejercicios/ej-2/ej-2.json', type: 'blob' },
        ]);

        const commitRequests = httpMock.expectOne(API_GRAPHQL_GITHUB);
        expect(commitRequests.request.body.variables.input.branch.branchName).toBe('requests');
        commitRequests.flush({ data: { createCommitOnBranch: { commit: { oid: 'requests-nuevo' } } } });
        await expect(promesa).resolves.toBeUndefined();

        const lecturaCategorias = adapter.listarCategorias();
        httpMock.expectOne(`${RAW_BASE}/categorias.json`).flush(categorias);
        await expect(lecturaCategorias).resolves.toEqual(categorias.categorias);
      });

      it('completa en main un borrado ya realizado en requests', async () => {
        const categoriasMain = documentoCategorias([{ id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['ej-1'] }]);
        const categoriasRequests = documentoCategorias([{ id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['ej-2'] }]);
        const promesa = adapter.eliminarEjercicio(CREDENCIALES, 'ej-1');
        await prepararArbolRama('main', 'main-base', categoriasMain, [
          { path: 'ejercicios/ej-1/ej-1.json', type: 'blob' },
        ]);
        await prepararArbolRama('requests', 'requests-base', categoriasRequests, [
          { path: 'ejercicios/ej-2/ej-2.json', type: 'blob' },
        ]);

        const commitMain = httpMock.expectOne(API_GRAPHQL_GITHUB);
        expect(commitMain.request.body.variables.input.branch.branchName).toBe('main');
        expect(commitMain.request.body.variables.input.fileChanges.deletions).toEqual([
          { path: 'ejercicios/ej-1/ej-1.json' },
        ]);
        commitMain.flush({ data: { createCommitOnBranch: { commit: { oid: 'main-nuevo' } } } });
        await expect(promesa).resolves.toBeUndefined();
        httpMock.expectNone(API_GRAPHQL_GITHUB);
      });

      it('elimina archivos huerfanos aunque categorias.json no exista en una rama', async () => {
        const promesa = adapter.eliminarEjercicio(CREDENCIALES, 'ej-1');
        await prepararArbolRama('main', 'main-base', null, [
          { path: 'ejercicios/ej-1/ej-1.json', type: 'blob' },
          { path: 'ejercicios/ej-1/imagenes/main.png.json', type: 'blob' },
        ]);
        await prepararArbolRama('requests', 'requests-base', null, [
          { path: 'ejercicios/ej-1/ej-1.json', type: 'blob' },
          { path: 'ejercicios/ej-1/imagenes/orphan.png.json', type: 'blob' },
        ]);

        const commit = httpMock.expectOne(API_GRAPHQL_GITHUB);
        expect(commit.request.body.variables.input.branch.branchName).toBe('requests');
        expect(commit.request.body.variables.input.fileChanges).toEqual({
          deletions: [
            { path: 'ejercicios/ej-1/ej-1.json' },
            { path: 'ejercicios/ej-1/imagenes/orphan.png.json' },
          ],
        });
        commit.flush({ data: { createCommitOnBranch: { commit: { oid: 'requests-nuevo' } } } });
        await flushMicrotareas();

        const commitMain = httpMock.expectOne(API_GRAPHQL_GITHUB);
        expect(commitMain.request.body.variables.input.branch.branchName).toBe('main');
        expect(commitMain.request.body.variables.input.fileChanges).toEqual({
          deletions: [
            { path: 'ejercicios/ej-1/ej-1.json' },
            { path: 'ejercicios/ej-1/imagenes/main.png.json' },
          ],
        });
        commitMain.flush({ data: { createCommitOnBranch: { commit: { oid: 'main-nuevo' } } } });
        await expect(promesa).resolves.toBeUndefined();
      });

      it('rechaza si el ejercicio no tiene archivos ni referencias en ninguna rama', async () => {
        const categorias = documentoCategorias([{ id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['ej-2'] }]);
        const promesa = adapter.eliminarEjercicio(CREDENCIALES, 'ej-1');
        const error = expect(promesa).rejects.toThrow('No se han encontrado');
        await prepararArbolRama('main', 'main-base', categorias, [{ path: 'ejercicios/ej-2/ej-2.json', type: 'blob' }]);
        await prepararArbolRama('requests', 'requests-base', categorias, [{ path: 'ejercicios/ej-2/ej-2.json', type: 'blob' }]);
        await error;
        httpMock.expectNone(API_GRAPHQL_GITHUB);
      });

      it('rechaza entradas invalidas en el arbol antes de escribir en ninguna rama', async () => {
        const categorias = documentoCategorias([{ id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['ej-1'] }]);
        const promesa = adapter.eliminarEjercicio(CREDENCIALES, 'ej-1');
        const error = expect(promesa).rejects.toThrow(ErrorValidacion);
        await prepararArbolRama('main', 'main-base', categorias, [{ path: 42, type: 'blob' }]);
        await error;
        httpMock.expectNone(API_GRAPHQL_GITHUB);
      });

      it('permite reintentar en main si requests ya se actualizo y el commit de main falla', async () => {
        const categorias = documentoCategorias([{ id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['ej-1'] }]);
        const promesa = adapter.eliminarEjercicio(CREDENCIALES, 'ej-1');
        const error = expect(promesa).rejects.toThrow(ErrorConflictoRemoto);
        await prepararArbolRama('main', 'main-base', categorias, [
          { path: 'ejercicios/ej-1/ej-1.json', type: 'blob' },
        ]);
        await prepararArbolRama('requests', 'requests-base', categorias, [
          { path: 'ejercicios/ej-1/ej-1.json', type: 'blob' },
        ]);

        httpMock.expectOne(API_GRAPHQL_GITHUB).flush({
          data: { createCommitOnBranch: { commit: { oid: 'requests-nuevo' } } },
        });
        await flushMicrotareas();
        httpMock.expectOne(API_GRAPHQL_GITHUB).flush({
          errors: [{ message: 'expectedHeadOid does not match the current branch head' }],
        });
        await error;
      });
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
    it('no repite un id ya presente en la categoría seleccionada', async () => {
      const ejercicio = ejercicioComun();
      const promesa = adapter.subirEjercicio(CREDENCIALES, ejercicio, []);
      const categorias = documentoCategorias([{ id: 'cat-comun-1', nombre: 'Rodilla', ejercicios: ['ej-1'] }]);
      httpMock.expectOne(`${API_CONTENTS}/categorias.json?ref=requests`).flush({
        content: codificarJSON(categorias),
        sha: 'sha-categorias',
      });
      await flushMicrotareas();
      httpMock.expectOne(`${API_CONTENTS}/ejercicios/ej-1/ej-1.json`).flush({ content: { sha: 'sha-ejercicio' } });
      await flushMicrotareas();

      const actualizar = httpMock.expectOne(`${API_CONTENTS}/categorias.json`);
      expect(decodificarJSON(actualizar.request.body.content)).toEqual(categorias);
      actualizar.flush({ content: { sha: 'sha-categorias' } });
      await expect(promesa).resolves.toBeUndefined();
    });

    it('rechaza categorias.json ausente o con JSON inválido en requests', async () => {
      const ausente = adapter.subirEjercicio(CREDENCIALES, ejercicioComun(), []);
      const errorAusente = expect(ausente).rejects.toThrow(ErrorValidacion);
      httpMock.expectOne(`${API_CONTENTS}/categorias.json?ref=requests`).flush({ content: '', sha: 'sha-categorias' });
      await errorAusente;

      const jsonInvalido = adapter.subirEjercicio(CREDENCIALES, ejercicioComun(), []);
      const errorJson = expect(jsonInvalido).rejects.toThrow(ErrorValidacion);
      httpMock.expectOne(`${API_CONTENTS}/categorias.json?ref=requests`).flush({
        content: btoa('no es json'),
        sha: 'sha-categorias',
      });
      await errorJson;
    });

    it('sube imagen y ejercicio bajo su carpeta y actualiza categorias.json con su sha', async () => {
      const imagen: ImagenArchivoJSON = {
        id: 'img-1',
        nombreArchivo: 'foto.png',
        tipoMime: 'image/png',
        contenidoBase64: 'QUJD',
      };
      const ejercicio = ejercicioComun({
        id: 'ej-2',
        categoriaIds: ['1', 'cat-sin-indice'],
        imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }],
      });
      const imagenNoAsociada = { ...imagen, id: 'img-otro' };
      const promesa = adapter.subirEjercicio(CREDENCIALES, ejercicio, [imagen, imagenNoAsociada]);
      const categoriasOriginales = documentoCategorias([
        { id: 1, nombre: 'Rodilla', ejercicios: [23] },
        { id: 'cat-comun-2', nombre: 'Piernas', ejercicios: [] },
        { id: 'cat-sin-indice', nombre: 'Sin índice' },
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
          { id: 'cat-sin-indice', nombre: 'Sin índice', ejercicios: ['ej-2'] },
        ],
      });
      actualizacion.flush({ content: { sha: 'sha-categorias-nuevo' } });
      await expect(promesa).resolves.toBeUndefined();
      httpMock.expectNone(`${API_CONTENTS}/ejercicios/ej-2/imagenes/img-otro.json`);
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
