import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { GoogleAutorizacionPort } from '../../../src/app/application/ports/google-autorizacion.port';
import type { ExportacionJSON, ImagenArchivoJSON } from '../../../src/app/application/ports/github-sync.port';
import { ErrorAutorizacionGoogle, ErrorRedSincronizacion } from '../../../src/app/domain/errores/errores-dominio';
import { ProveedorGoogleDriveSync } from '../../../src/app/infrastructure/google-drive-sync/proveedor-google-drive-sync';

const DATOS: ExportacionJSON = {
  version: 1,
  ejercicios: [],
  categorias: [],
  planificaciones: [],
  progresoDiario: [],
};
const IMAGEN: ImagenArchivoJSON = {
  id: 'imagen-1',
  nombreArchivo: 'foto.png',
  tipoMime: 'image/png',
  contenidoBase64: 'QUJD',
};
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

function esperarPeticionEncadenada(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('ProveedorGoogleDriveSync', () => {
  let proveedor: ProveedorGoogleDriveSync;
  let http: HttpTestingController;
  let obtenerTokenAcceso: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    obtenerTokenAcceso = vi.fn().mockResolvedValue('token-de-prueba');
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ProveedorGoogleDriveSync,
        { provide: GoogleAutorizacionPort, useValue: { obtenerTokenAcceso } },
      ],
    });
    proveedor = TestBed.inject(ProveedorGoogleDriveSync);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  it('lista solo appDataFolder con el orden, límite y campos del contrato', async () => {
    const lectura = proveedor.leerRemoto();
    await esperarPeticionEncadenada();
    const solicitud = http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL));

    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.get('spaces')).toBe('appDataFolder');
    expect(solicitud.request.params.get('orderBy')).toBe('createdTime');
    expect(solicitud.request.params.get('pageSize')).toBe('1000');
    expect(solicitud.request.params.get('fields')).toContain('files(id,name,size,version');
    expect(solicitud.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    solicitud.flush({ files: [] });

    await expect(lectura).resolves.toEqual({ existe: false });
  });

  it('lee datos.json y devuelve la versión del listado remoto', async () => {
    const lectura = proveedor.leerRemoto();
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL)).flush({
      files: [{ id: 'datos-1', name: 'datos.json', size: '99', version: 'version-8' }],
    });
    await esperarPeticionEncadenada();
    const descargar = http.expectOne(
      (request) => request.urlWithParams.startsWith('https://www.googleapis.com/drive/v3/files/datos-1'),
    );
    expect(descargar.request.params.get('alt')).toBe('media');
    expect(descargar.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    descargar.flush(DATOS);

    await expect(lectura).resolves.toEqual({ existe: true, datos: DATOS, version: 'version-8' });
  });

  it('interpreta un 404 de datos.json como un destino sin copia remota', async () => {
    const lectura = proveedor.leerRemoto();
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL)).flush({
      files: [{ id: 'datos-ausentes', name: 'datos.json', size: '1', version: 'version-1' }],
    });
    await esperarPeticionEncadenada();
    http.expectOne(
      (request) => request.urlWithParams.startsWith('https://www.googleapis.com/drive/v3/files/datos-ausentes'),
    ).flush('Not found', { status: 404, statusText: 'Not Found' });

    await expect(lectura).resolves.toEqual({ existe: false });
  });

  it('omite imágenes con el mismo tamaño remoto y actualiza las que han cambiado', async () => {
    const otraImagen = { ...IMAGEN, id: 'imagen-2', contenidoBase64: 'REVG' };
    const tamanoImagen = new TextEncoder().encode(JSON.stringify(IMAGEN)).byteLength;
    const promesa = proveedor.escribirRemoto(DATOS, [IMAGEN, otraImagen], 'version-1');
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL)).flush({
      files: [
        { id: 'imagen-1-remota', name: 'imagenes__imagen-1.json', size: String(tamanoImagen) },
        { id: 'imagen-2-remota', name: 'imagenes__imagen-2.json', size: '1' },
        { id: 'datos-remotos', name: 'datos.json', size: '80', version: 'version-1' },
      ],
    });
    await esperarPeticionEncadenada();
    const aperturaImagenCambiada = http.expectOne(
      (request) => request.urlWithParams.startsWith('https://www.googleapis.com/upload/drive/v3/files/imagen-2-remota'),
    );
    expect(aperturaImagenCambiada.request.method).toBe('PATCH');
    aperturaImagenCambiada.flush(null, {
      headers: { Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=changed-image' },
    });
    await esperarPeticionEncadenada();
    http.expectOne('https://www.googleapis.com/upload/drive/v3/files?upload_id=changed-image')
      .flush({ id: 'imagen-2-remota' });
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(`${DRIVE_FILES_URL}/datos-remotos`))
      .flush({ version: 'version-1' });
    await esperarPeticionEncadenada();
    const aperturaDatos = http.expectOne(
      (request) => request.urlWithParams.startsWith('https://www.googleapis.com/upload/drive/v3/files/datos-remotos'),
    );
    expect(aperturaDatos.request.method).toBe('PATCH');
    aperturaDatos.flush(null, {
      headers: { Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=updated-data' },
    });
    await esperarPeticionEncadenada();
    http.expectOne('https://www.googleapis.com/upload/drive/v3/files?upload_id=updated-data')
      .flush({ version: 'version-2' });

    await expect(promesa).resolves.toEqual({ versionNueva: 'version-2' });
    expect(http.match((request) => request.urlWithParams.includes('imagen-1-remota'))).toHaveLength(0);
  });

  it('sube las imágenes mediante sesión reanudable antes de escribir datos.json', async () => {
    const promesa = proveedor.escribirRemoto(DATOS, [IMAGEN], null);
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL)).flush({ files: [] });
    await esperarPeticionEncadenada();

    const abrirImagen = http.expectOne((request) => request.urlWithParams.startsWith('https://www.googleapis.com/upload/drive/v3/files'));
    expect(abrirImagen.request.method).toBe('POST');
    expect(abrirImagen.request.params.get('uploadType')).toBe('resumable');
    expect(abrirImagen.request.body).toEqual({
      name: 'imagenes__imagen-1.json',
      parents: ['appDataFolder'],
      mimeType: 'application/json',
    });
    abrirImagen.flush(null, {
      headers: { Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=image-session' },
    });
    await esperarPeticionEncadenada();
    const enviarImagen = http.expectOne('https://www.googleapis.com/upload/drive/v3/files?upload_id=image-session');
    expect(enviarImagen.request.method).toBe('PUT');
    expect(enviarImagen.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    expect(enviarImagen.request.body).toBe(JSON.stringify(IMAGEN));
    enviarImagen.flush({ id: 'imagen-remota' });
    await esperarPeticionEncadenada();

    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL))
      .flush({ files: [] });
    await esperarPeticionEncadenada();
    const abrirDatos = http.expectOne((request) => request.urlWithParams.startsWith('https://www.googleapis.com/upload/drive/v3/files'));
    expect(abrirDatos.request.method).toBe('POST');
    expect(abrirDatos.request.params.get('fields')).toBe('version');
    expect(abrirDatos.request.body).toEqual({
      name: 'datos.json',
      parents: ['appDataFolder'],
      mimeType: 'application/json',
    });
    abrirDatos.flush(null, {
      headers: { Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=data-session' },
    });
    await esperarPeticionEncadenada();
    const enviarDatos = http.expectOne('https://www.googleapis.com/upload/drive/v3/files?upload_id=data-session');
    expect(enviarDatos.request.body).toBe(JSON.stringify(DATOS));
    enviarDatos.flush({ version: 'version-9' });

    await expect(promesa).resolves.toEqual({ versionNueva: 'version-9' });
  });

  it('detecta una versión remota cambiada antes de escribir y no inicia la subida de datos', async () => {
    const promesa = proveedor.escribirRemoto(DATOS, [], 'version-esperada');
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL)).flush({
      files: [{ id: 'datos-1', name: 'datos.json', size: '99', version: 'version-esperada' }],
    });
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(`${DRIVE_FILES_URL}/datos-1`))
      .flush({ version: 'version-cambiada' });

    await expect(promesa).rejects.toMatchObject({ name: 'ErrorConflictoRemoto' });
    expect(http.match((request) => request.urlWithParams.startsWith('https://www.googleapis.com/upload/drive/v3/files')))
      .toHaveLength(0);
  });

  it('trata como conflicto un datos.json existente si la versión esperada es nula', async () => {
    const promesa = proveedor.escribirRemoto(DATOS, [], null);
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL)).flush({
      files: [{ id: 'datos-existentes', name: 'datos.json', size: '50', version: 'version-1' }],
    });
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(`${DRIVE_FILES_URL}/datos-existentes`))
      .flush({ version: 'version-1' });

    await expect(promesa).rejects.toMatchObject({ name: 'ErrorConflictoRemoto' });
  });

  it('recorre páginas del espacio de la aplicación para localizar datos.json', async () => {
    const lectura = proveedor.leerRemoto();
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL))
      .flush({ files: [], nextPageToken: 'pagina-2' });
    await esperarPeticionEncadenada();
    const segundaPagina = http.expectOne(
      (request) => request.urlWithParams.startsWith(DRIVE_FILES_URL) && request.params.get('pageToken') === 'pagina-2',
    );
    expect(segundaPagina.request.params.get('spaces')).toBe('appDataFolder');
    segundaPagina.flush({ files: [{ id: 'datos-pag-2', name: 'datos.json', version: 'v2' }] });
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(`${DRIVE_FILES_URL}/datos-pag-2`))
      .flush(DATOS);

    await expect(lectura).resolves.toEqual({ existe: true, datos: DATOS, version: 'v2' });
  });

  it('elige el datos.json más antiguo cuando el espacio tiene duplicados', async () => {
    const lectura = proveedor.leerRemoto();
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL)).flush({
      files: [
        { id: 'datos-nuevo', name: 'datos.json', version: 'v2', createdTime: '2026-10-02T10:00:00Z' },
        { id: 'datos-antiguo', name: 'datos.json', version: 'v1', createdTime: '2026-10-01T10:00:00Z' },
      ],
    });
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(`${DRIVE_FILES_URL}/datos-antiguo`))
      .flush(DATOS);

    await expect(lectura).resolves.toEqual({ existe: true, datos: DATOS, version: 'v1' });
  });

  it('traduce la ruta de imagen lógica al nombre de fichero de Drive', async () => {
    const lectura = proveedor.leerImagen('imagenes/imagen-1.json');
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL)).flush({
      files: [{ id: 'id-imagen', name: 'imagenes__imagen-1.json', size: '50', version: '1' }],
    });
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(`${DRIVE_FILES_URL}/id-imagen`))
      .flush(IMAGEN);

    await expect(lectura).resolves.toEqual(IMAGEN);
  });

  it('sube con reanudación un documento de imagen de aproximadamente 6,7 MB', async () => {
    const bytesImagen = 5 * 1024 * 1024;
    const base64 = `${'A'.repeat(Math.ceil(bytesImagen / 3) * 4 - 1)}=`;
    const imagenGrande = { ...IMAGEN, contenidoBase64: base64 };
    const promesa = proveedor.escribirRemoto(DATOS, [imagenGrande], null);
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL)).flush({ files: [] });
    await esperarPeticionEncadenada();
    const apertura = http.expectOne(
      (request) => request.urlWithParams.startsWith('https://www.googleapis.com/upload/drive/v3/files'),
    );
    expect(apertura.request.method).toBe('POST');
    apertura.flush(null, {
      headers: { Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=large-image' },
    });
    await esperarPeticionEncadenada();
    const envio = http.expectOne('https://www.googleapis.com/upload/drive/v3/files?upload_id=large-image');
    expect((envio.request.body as string).length).toBeGreaterThan(6_900_000);
    envio.flush({ id: 'large-image-id' });
    await esperarPeticionEncadenada();
    http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL)).flush({ files: [] });
    await esperarPeticionEncadenada();
    const aperturaDatos = http.expectOne(
      (request) => request.urlWithParams.startsWith('https://www.googleapis.com/upload/drive/v3/files'),
    );
    aperturaDatos.flush(null, {
      headers: { Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=large-data' },
    });
    await esperarPeticionEncadenada();
    http.expectOne('https://www.googleapis.com/upload/drive/v3/files?upload_id=large-data')
      .flush({ version: 'v1' });

    await expect(promesa).resolves.toEqual({ versionNueva: 'v1' });
  });

  it.each([
    { estado: 0, error: null, esperado: ErrorRedSincronizacion },
    { estado: 429, error: { error: { errors: [{ reason: 'rateLimitExceeded' }] } }, esperado: ErrorRedSincronizacion },
    { estado: 503, error: { error: { message: 'unavailable' } }, esperado: ErrorRedSincronizacion },
    { estado: 401, error: { error: { message: 'unauthorized' } }, esperado: ErrorAutorizacionGoogle },
    { estado: 403, error: { error: { errors: [{ reason: 'insufficientPermissions' }] } }, esperado: ErrorAutorizacionGoogle },
    { estado: 403, error: { error: { errors: [{ reason: 'userRateLimitExceeded' }] } }, esperado: ErrorRedSincronizacion },
  ])('traduce los errores HTTP $estado al error de dominio correspondiente', async ({ estado, error, esperado }) => {
    const lectura = proveedor.leerRemoto();
    await esperarPeticionEncadenada();
    const solicitud = http.expectOne((request) => request.urlWithParams.startsWith(DRIVE_FILES_URL));
    if (estado === 0) {
      solicitud.error(new ProgressEvent('error'));
    } else {
      solicitud.flush(error, { status: estado, statusText: 'Error' });
    }

    await expect(lectura).rejects.toBeInstanceOf(esperado);
  });
});
