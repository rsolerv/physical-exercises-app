import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import {
  GOOGLE_CLIENT_ID_CONFIG,
  GOOGLE_DRIVE_APP_DATA_SCOPE,
} from '../../../src/app/infrastructure/google-drive-sync/google-drive.config';
import {
  GoogleIdentityCargador,
  type GoogleIdentityApi,
} from '../../../src/app/infrastructure/google-drive-sync/google-identity.cargador';
import { GoogleIdentityAutorizacion } from '../../../src/app/infrastructure/google-drive-sync/google-identity-autorizacion';
import {
  ErrorAutorizacionGoogle,
  ErrorConexionCancelada,
  ErrorRedSincronizacion,
  ErrorVentanaBloqueada,
} from '../../../src/app/domain/errores/errores-dominio';

function crearApiGoogle(opciones: {
  respuesta?: Record<string, unknown>;
  errorVentana?: string;
  token?: string;
  expiraEn?: string;
  permisoConcedido?: boolean;
} = {}): {
  api: GoogleIdentityApi;
  initTokenClient: ReturnType<typeof vi.fn>;
  requestAccessToken: ReturnType<typeof vi.fn>;
  revoke: ReturnType<typeof vi.fn>;
  hasGrantedAllScopes: ReturnType<typeof vi.fn>;
} {
  let callback: ((respuesta: Record<string, unknown>) => void) | undefined;
  let errorCallback: ((error: { type: string }) => void) | undefined;
  const requestAccessToken = vi.fn(() => {
    if (opciones.errorVentana) {
      errorCallback?.({ type: opciones.errorVentana });
      return;
    }
    callback?.(
      opciones.respuesta ?? {
        access_token: opciones.token ?? 'token-en-memoria',
        expires_in: opciones.expiraEn ?? '3600',
        scope: GOOGLE_DRIVE_APP_DATA_SCOPE,
      },
    );
  });
  const initTokenClient = vi.fn((configuracion: {
    callback: (respuesta: Record<string, unknown>) => void;
    error_callback: (error: { type: string }) => void;
  }) => {
    callback = configuracion.callback;
    errorCallback = configuracion.error_callback;
    return { requestAccessToken };
  });
  const revoke = vi.fn();
  const hasGrantedAllScopes = vi.fn(() => opciones.permisoConcedido ?? true);
  return {
    api: {
      accounts: {
        oauth2: {
          initTokenClient,
          hasGrantedAllScopes,
          revoke,
        },
      },
    },
    initTokenClient,
    requestAccessToken,
    revoke,
    hasGrantedAllScopes,
  };
}

describe('GoogleIdentityAutorizacion', () => {
  let http: HttpTestingController;
  let cargar: ReturnType<typeof vi.fn>;
  let autorizado: GoogleIdentityAutorizacion;
  let almacenLocal: Storage;
  let almacenSesion: Storage;

  function configurar(api: GoogleIdentityApi, clientId = 'cliente-publico.apps.googleusercontent.com') {
    cargar = vi.fn().mockResolvedValue(api);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        GoogleIdentityAutorizacion,
        { provide: GoogleIdentityCargador, useValue: { cargar } },
        { provide: GOOGLE_CLIENT_ID_CONFIG, useValue: clientId },
      ],
    });
    autorizado = TestBed.inject(GoogleIdentityAutorizacion);
    http = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    almacenLocal = window.localStorage;
    almacenSesion = window.sessionStorage;
    almacenLocal.clear();
    almacenSesion.clear();
  });

  afterEach(() => {
    try {
      http?.verify();
    } finally {
      TestBed.resetTestingModule();
      window.localStorage.clear();
      window.sessionStorage.clear();
      vi.restoreAllMocks();
    }
  });

  it('no carga Google hasta llamar a conectar y solicita el permiso mínimo', async () => {
    const google = crearApiGoogle();
    configurar(google.api);
    expect(cargar).not.toHaveBeenCalled();

    const conexion = autorizado.conectar();
    await vi.waitFor(() => expect(google.initTokenClient).toHaveBeenCalledOnce());
    expect(cargar).toHaveBeenCalledOnce();
    expect(google.initTokenClient).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'cliente-publico.apps.googleusercontent.com',
        scope: GOOGLE_DRIVE_APP_DATA_SCOPE,
      }),
    );
    expect(google.hasGrantedAllScopes).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: 'token-en-memoria' }),
      GOOGLE_DRIVE_APP_DATA_SCOPE,
    );
    http.expectOne(
      (request) =>
        request.method === 'GET' &&
        request.url === 'https://www.googleapis.com/drive/v3/about' &&
        request.params.get('fields') === 'user(displayName,emailAddress)',
    ).flush({ user: { displayName: 'Raquel', emailAddress: 'raquel@example.com' } });

    await expect(conexion).resolves.toEqual({ correo: 'raquel@example.com', nombre: 'Raquel' });
  });

  it('mantiene el token solo en memoria y devuelve el token vigente', async () => {
    const google = crearApiGoogle();
    configurar(google.api);
    const abrirIndexedDb = typeof indexedDB === 'undefined' ? null : vi.spyOn(indexedDB, 'open');
    const conexion = autorizado.conectar();
    await vi.waitFor(() => expect(google.initTokenClient).toHaveBeenCalledOnce());
    http.expectOne('https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)')
      .flush({ user: { emailAddress: 'raquel@example.com' } });
    await conexion;

    await expect(autorizado.obtenerTokenAcceso()).resolves.toBe('token-en-memoria');
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(almacenLocal.getItem('token-en-memoria')).toBeNull();
    expect(almacenSesion.getItem('token-en-memoria')).toBeNull();
    if (abrirIndexedDb) expect(abrirIndexedDb).not.toHaveBeenCalled();
    expect(google.requestAccessToken).toHaveBeenCalledOnce();
  });

  it('cancela la conexión cuando Google no concede el permiso completo', async () => {
    const google = crearApiGoogle({ permisoConcedido: false });
    configurar(google.api);

    await expect(autorizado.conectar()).rejects.toBeInstanceOf(ErrorConexionCancelada);
    expect(http.match(() => true)).toHaveLength(0);
  });

  it('traduce una ventana cerrada a conexión cancelada', async () => {
    const google = crearApiGoogle({ respuesta: { error: 'popup_closed' } });
    configurar(google.api);

    await expect(autorizado.conectar()).rejects.toBeInstanceOf(ErrorConexionCancelada);
  });

  it('traduce un permiso denegado a conexión cancelada', async () => {
    const google = crearApiGoogle({ respuesta: { error: 'access_denied' } });
    configurar(google.api);

    await expect(autorizado.conectar()).rejects.toBeInstanceOf(ErrorConexionCancelada);
  });

  it('traduce la ventana emergente bloqueada', async () => {
    const google = crearApiGoogle({ errorVentana: 'popup_failed_to_open' });
    configurar(google.api);

    await expect(autorizado.conectar()).rejects.toBeInstanceOf(ErrorVentanaBloqueada);
  });

  it('traduce el fallo del cargador y rechaza un identificador vacío', async () => {
    configurar(crearApiGoogle().api);
    cargar.mockRejectedValueOnce(new Error('network'));
    await expect(autorizado.conectar()).rejects.toBeInstanceOf(ErrorRedSincronizacion);

    TestBed.resetTestingModule();
    configurar(crearApiGoogle().api, '');
    await expect(autorizado.conectar()).rejects.toBeInstanceOf(ErrorAutorizacionGoogle);
    expect(cargar).not.toHaveBeenCalled();
  });

  it('renueva el token caducado en el gesto del usuario con prompt vacío y login_hint', async () => {
    const google = crearApiGoogle({ expiraEn: '1' });
    configurar(google.api);
    const conexion = autorizado.conectar();
    await vi.waitFor(() => expect(google.initTokenClient).toHaveBeenCalledOnce());
    http.expectOne('https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)')
      .flush({ user: { emailAddress: 'raquel@example.com' } });
    await conexion;

    await expect(autorizado.obtenerTokenAcceso()).resolves.toBe('token-en-memoria');
    expect(google.initTokenClient).toHaveBeenLastCalledWith(
      expect.objectContaining({ login_hint: 'raquel@example.com' }),
    );
    expect(google.requestAccessToken).toHaveBeenLastCalledWith({ prompt: '' });
  });

  it('traduce el fallo al renovar el token a ErrorAutorizacionGoogle', async () => {
    const google = crearApiGoogle({ expiraEn: '1' });
    configurar(google.api);
    const conexion = autorizado.conectar();
    await vi.waitFor(() => expect(google.initTokenClient).toHaveBeenCalledOnce());
    http.expectOne('https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)')
      .flush({ user: { emailAddress: 'raquel@example.com' } });
    await conexion;
    google.requestAccessToken.mockImplementationOnce(() => {
      throw new Error('popup');
    });

    await expect(autorizado.obtenerTokenAcceso()).rejects.toBeInstanceOf(ErrorAutorizacionGoogle);
  });

  it('descarta el token y trata la revocación como mejor esfuerzo', async () => {
    const google = crearApiGoogle();
    configurar(google.api);
    const conexion = autorizado.conectar();
    await vi.waitFor(() => expect(google.initTokenClient).toHaveBeenCalledOnce());
    http.expectOne('https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)')
      .flush({ user: { emailAddress: 'raquel@example.com' } });
    await conexion;
    google.revoke.mockImplementation(() => {
      throw new Error('network');
    });

    await expect(autorizado.desconectar()).resolves.toBeUndefined();
    await expect(autorizado.obtenerTokenAcceso()).rejects.toBeInstanceOf(ErrorAutorizacionGoogle);
    expect(google.revoke).toHaveBeenCalledWith('token-en-memoria', expect.any(Function));
  });
});
