import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { GithubSyncAdapter } from '../../../src/app/infrastructure/github-sync/github-sync.adapter';
import {
  ErrorAutenticacionGitHub,
  ErrorConflictoRemoto,
  ErrorRedSincronizacion,
  ErrorValidacion,
} from '../../../src/app/domain/errores/errores-dominio';
import type { ExportacionJSON, ImagenArchivoJSON } from '../../../src/app/application/ports/github-sync.port';

const CREDENCIALES = { tokenPAT: 'token-secreto', repositorio: 'owner/data-physical-exercises' };

const DATOS_VACIOS: ExportacionJSON = { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] };

function aBase64(texto: string): string {
  return btoa(unescape(encodeURIComponent(texto)));
}

/** Da tiempo a que se resuelvan las promesas encadenadas de `firstValueFrom` entre dos peticiones HTTP consecutivas. */
function flushMicrotareas(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('GithubSyncAdapter', () => {
  let adapter: GithubSyncAdapter;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    adapter = TestBed.inject(GithubSyncAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('leerRemoto() devuelve los datos y el SHA cuando el repositorio ya tiene datos.json', async () => {
    const promesa = adapter.leerRemoto(CREDENCIALES);

    const peticion = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/datos.json'
    );
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-secreto');
    peticion.flush({ content: aBase64(JSON.stringify(DATOS_VACIOS)), sha: 'sha-1' });

    const resultado = await promesa;
    expect(resultado).toEqual({ existe: true, datos: DATOS_VACIOS, sha: 'sha-1' });
  });

  it('leerRemoto() recupera datos.json en formato raw cuando GitHub omite su contenido codificado', async () => {
    const promesa = adapter.leerRemoto(CREDENCIALES);

    const respuestaMetadatos = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/datos.json'
    );
    respuestaMetadatos.flush({ content: '', sha: 'sha-grande' });
    await flushMicrotareas();

    const respuestaRaw = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/datos.json'
    );
    expect(respuestaRaw.request.responseType).toBe('text');
    expect(respuestaRaw.request.headers.get('Accept')).toBe('application/vnd.github.raw+json');
    respuestaRaw.flush(JSON.stringify(DATOS_VACIOS));

    await expect(promesa).resolves.toEqual({ existe: true, datos: DATOS_VACIOS, sha: 'sha-grande' });
  });

  it('leerRemoto() devuelve { existe: false } cuando el repositorio no tiene datos.json todavía', async () => {
    const promesa = adapter.leerRemoto(CREDENCIALES);

    const peticion = httpMock.expectOne('https://api.github.com/repos/owner/data-physical-exercises/contents/datos.json');
    peticion.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    const resultado = await promesa;
    expect(resultado).toEqual({ existe: false });
  });

  it('escribirRemoto() usa el SHA remoto al actualizar una imagen y después escribe datos.json con su SHA esperado', async () => {
    const imagen: ImagenArchivoJSON = { id: 'img-1', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'QUJD' };
    const promesa = adapter.escribirRemoto(CREDENCIALES, DATOS_VACIOS, [imagen], 'sha-anterior');

    const lecturaImagen = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/imagenes/img-1.json'
    );
    expect(lecturaImagen.request.method).toBe('GET');
    lecturaImagen.flush({ sha: 'sha-imagen-anterior' });
    await flushMicrotareas();

    const peticionImagen = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/imagenes/img-1.json'
    );
    expect(peticionImagen.request.method).toBe('PUT');
    expect(peticionImagen.request.body.sha).toBe('sha-imagen-anterior');
    peticionImagen.flush({ content: { sha: 'sha-imagen' } });
    await flushMicrotareas();

    const peticionDatos = httpMock.expectOne('https://api.github.com/repos/owner/data-physical-exercises/contents/datos.json');
    expect(peticionDatos.request.method).toBe('PUT');
    expect(peticionDatos.request.body.sha).toBe('sha-anterior');
    peticionDatos.flush({ content: { sha: 'sha-nuevo' } });

    const resultado = await promesa;
    expect(resultado).toEqual({ shaNuevo: 'sha-nuevo' });
  });

  it('escribirRemoto() crea una imagen nueva sin SHA cuando todavía no existe en GitHub', async () => {
    const imagen: ImagenArchivoJSON = { id: 'img-nueva', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'QUJD' };
    const promesa = adapter.escribirRemoto(CREDENCIALES, DATOS_VACIOS, [imagen], null);

    const lecturaImagen = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/imagenes/img-nueva.json'
    );
    expect(lecturaImagen.request.method).toBe('GET');
    lecturaImagen.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    await flushMicrotareas();

    const peticionImagen = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/imagenes/img-nueva.json'
    );
    expect(peticionImagen.request.method).toBe('PUT');
    expect(peticionImagen.request.body.sha).toBeUndefined();
    peticionImagen.flush({ content: { sha: 'sha-imagen-nueva' } });
    await flushMicrotareas();

    const peticionDatos = httpMock.expectOne('https://api.github.com/repos/owner/data-physical-exercises/contents/datos.json');
    peticionDatos.flush({ content: { sha: 'sha-nuevo' } });
    await expect(promesa).resolves.toEqual({ shaNuevo: 'sha-nuevo' });
  });

  it('leerImagen() descarga y parsea un documento imagenes/<id>.json', async () => {
    const imagen: ImagenArchivoJSON = { id: 'img-1', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'QUJD' };
    const promesa = adapter.leerImagen(CREDENCIALES, 'imagenes/img-1.json');

    const peticion = httpMock.expectOne('https://api.github.com/repos/owner/data-physical-exercises/contents/imagenes/img-1.json');
    peticion.flush({ content: aBase64(JSON.stringify(imagen)) });

    const resultado = await promesa;
    expect(resultado).toEqual(imagen);
  });

  it('leerImagen() recupera una imagen en formato raw cuando GitHub omite su contenido codificado', async () => {
    const imagen: ImagenArchivoJSON = { id: 'img-1', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'QUJD' };
    const promesa = adapter.leerImagen(CREDENCIALES, 'imagenes/img-1.json');

    const respuestaMetadatos = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/imagenes/img-1.json'
    );
    respuestaMetadatos.flush({ content: '', sha: 'sha-imagen' });
    await flushMicrotareas();

    const respuestaRaw = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/imagenes/img-1.json'
    );
    expect(respuestaRaw.request.responseType).toBe('text');
    respuestaRaw.flush(JSON.stringify(imagen));

    await expect(promesa).resolves.toEqual(imagen);
  });

  it('leerImagen() decodifica la respuesta de contenidos de GitHub si el servidor no devuelve el raw esperado', async () => {
    const imagen: ImagenArchivoJSON = { id: 'img-1', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'QUJD' };
    const promesa = adapter.leerImagen(CREDENCIALES, 'imagenes/img-1.json');

    const respuestaMetadatos = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/imagenes/img-1.json'
    );
    respuestaMetadatos.flush({ content: '', sha: 'sha-imagen' });
    await flushMicrotareas();

    const respuestaFallback = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/imagenes/img-1.json'
    );
    respuestaFallback.flush(JSON.stringify({
      content: aBase64(JSON.stringify(imagen)),
      encoding: 'base64',
      sha: 'sha-imagen',
    }));

    await expect(promesa).resolves.toEqual(imagen);
  });

  it('leerImagen() rechaza un documento remoto que no contiene contenidoBase64', async () => {
    const promesa = adapter.leerImagen(CREDENCIALES, 'imagenes/img-1.json');
    const peticion = httpMock.expectOne(
      'https://api.github.com/repos/owner/data-physical-exercises/contents/imagenes/img-1.json'
    );
    peticion.flush({ content: aBase64(JSON.stringify({ id: 'img-1' })), sha: 'sha-imagen' });

    await expect(promesa).rejects.toThrow(ErrorValidacion);
    await expect(promesa).rejects.toThrow(
      'El documento remoto «imagenes/img-1.json» no contiene una imagen con formato válido.'
    );
  });

  it('lanza ErrorConflictoRemoto si el SHA remoto cambió al escribir', async () => {
    const promesa = adapter.escribirRemoto(CREDENCIALES, DATOS_VACIOS, [], 'sha-antiguo');
    const esperacion = expect(promesa).rejects.toThrow(ErrorConflictoRemoto);

    const peticion = httpMock.expectOne('https://api.github.com/repos/owner/data-physical-exercises/contents/datos.json');
    peticion.flush({ message: 'Conflict' }, { status: 409, statusText: 'Conflict' });

    await esperacion;
  });

  it('lanza ErrorRedSincronizacion si no hay conexión (CL4, FR-032)', async () => {
    const promesa = adapter.leerRemoto(CREDENCIALES);
    const esperacion = expect(promesa).rejects.toThrow(ErrorRedSincronizacion);

    const peticion = httpMock.expectOne('https://api.github.com/repos/owner/data-physical-exercises/contents/datos.json');
    peticion.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    await esperacion;
  });

  it('lanza ErrorAutenticacionGitHub si el token es inválido (401)', async () => {
    const promesa = adapter.leerRemoto(CREDENCIALES);
    const esperacion = expect(promesa).rejects.toThrow(ErrorAutenticacionGitHub);

    const peticion = httpMock.expectOne('https://api.github.com/repos/owner/data-physical-exercises/contents/datos.json');
    peticion.flush({ message: 'Bad credentials' }, { status: 401, statusText: 'Unauthorized' });

    await esperacion;
  });

  it('lanza ErrorAutenticacionGitHub si el token no tiene permisos suficientes (403)', async () => {
    const promesa = adapter.leerRemoto(CREDENCIALES);
    const esperacion = expect(promesa).rejects.toThrow(ErrorAutenticacionGitHub);

    const peticion = httpMock.expectOne('https://api.github.com/repos/owner/data-physical-exercises/contents/datos.json');
    peticion.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    await esperacion;
  });

  it('el token solo se envía en la cabecera de autorización, nunca en el cuerpo de la petición', async () => {
    const promesa = adapter.escribirRemoto(CREDENCIALES, DATOS_VACIOS, [], null);

    const peticion = httpMock.expectOne('https://api.github.com/repos/owner/data-physical-exercises/contents/datos.json');
    expect(JSON.stringify(peticion.request.body)).not.toContain('token-secreto');
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-secreto');
    peticion.flush({ content: { sha: 'sha-nuevo' } });

    await promesa;
  });
});
