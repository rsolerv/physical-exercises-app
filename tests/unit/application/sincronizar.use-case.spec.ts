import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SincronizarUseCase } from '../../../src/app/application/casos-uso/sincronizar.use-case';
import { ExportarImportarDatosUseCase } from '../../../src/app/application/casos-uso/exportar-importar-datos.use-case';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { ProveedorSincronizacionPort } from '../../../src/app/application/ports/proveedor-sincronizacion.port';
import type { AjustesAplicacion } from '../../../src/app/application/ports/ajustes-repository.port';
import type { ExportacionJSON } from '../../../src/app/application/ports/github-sync.port';
import {
  ErrorAutorizacionGoogle,
  ErrorConflictoRemoto,
  ErrorRedSincronizacion,
} from '../../../src/app/domain/errores/errores-dominio';

const DATOS_VACIOS: ExportacionJSON = { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] };

function ajustes(sobrescribir: Partial<AjustesAplicacion> = {}): AjustesAplicacion {
  return {
    tokenGitHub: 'token',
    repositorioGitHub: 'owner/data',
    ultimaVersionSincronizada: null,
    ultimaSincronizacionCorrecta: null,
    cambiosLocalesPendientes: false,
    catalogoPredefinidoCargado: true,
    metodoSincronizacion: 'github',
    cuentaGoogle: null,
    ...sobrescribir,
  };
}

describe('SincronizarUseCase', () => {
  function configurar(opciones: {
    ajustes: AjustesAplicacion;
    obtenerAjustes?: ReturnType<typeof vi.fn>;
    leerRemoto?: ReturnType<typeof vi.fn>;
    escribirRemoto?: ReturnType<typeof vi.fn>;
    leerImagen?: ReturnType<typeof vi.fn>;
  }) {
    const registrarSincronizacionCompletada = vi.fn().mockResolvedValue(undefined);
    const marcarCambiosLocalesPendientes = vi.fn().mockResolvedValue(undefined);
    const exportar = vi.fn().mockResolvedValue({ datos: DATOS_VACIOS, imagenesParaSubir: [] });
    const importar = vi.fn().mockResolvedValue({ imagenesOmitidas: 0 });
    const leerRemoto = opciones.leerRemoto ?? vi.fn().mockResolvedValue({ existe: false });
    const escribirRemoto = opciones.escribirRemoto ?? vi.fn().mockResolvedValue({ versionNueva: 'v-nueva' });
    const leerImagen = opciones.leerImagen ?? vi.fn().mockResolvedValue({
      id: 'img-1',
      nombreArchivo: 'foto.png',
      tipoMime: 'image/png',
      contenidoBase64: 'base64',
    });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AjustesRepositoryPort,
          useValue: {
            obtener: opciones.obtenerAjustes ?? vi.fn().mockResolvedValue(opciones.ajustes),
            registrarSincronizacionCompletada,
            marcarCambiosLocalesPendientes,
          },
        },
        { provide: ProveedorSincronizacionPort, useValue: { leerRemoto, escribirRemoto, leerImagen } },
        { provide: ExportarImportarDatosUseCase, useValue: { exportar, importar } },
      ],
    });
    return {
      caso: TestBed.inject(SincronizarUseCase),
      leerRemoto,
      escribirRemoto,
      leerImagen,
      registrarSincronizacionCompletada,
      marcarCambiosLocalesPendientes,
      exportar,
      importar,
    };
  }

  it('sube los datos al destino activo y registra que los datos locales no cambiaron', async () => {
    const { caso, escribirRemoto, registrarSincronizacionCompletada } = configurar({
      ajustes: ajustes({ cambiosLocalesPendientes: true }),
      escribirRemoto: vi.fn().mockResolvedValue({ versionNueva: 'v-1' }),
    });

    await expect(caso.sincronizar()).resolves.toEqual({ tipo: 'completada', accion: 'subir' });
    expect(escribirRemoto).toHaveBeenCalledWith(DATOS_VACIOS, [], null);
    expect(registrarSincronizacionCompletada).toHaveBeenCalledWith(
      'github:owner/data',
      'v-1',
      expect.any(Date),
      false,
    );
  });

  it('descarga cambios del destino activo y resuelve imágenes por su ruta', async () => {
    const { caso, importar, leerImagen, registrarSincronizacionCompletada } = configurar({
      ajustes: ajustes({ ultimaVersionSincronizada: 'v-1' }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, version: 'v-2' }),
    });

    await expect(caso.sincronizar()).resolves.toEqual({
      tipo: 'completada',
      accion: 'descargar',
      imagenesOmitidas: 0,
    });
    expect(importar).toHaveBeenCalledWith(DATOS_VACIOS, expect.any(Function), true);
    await importar.mock.calls[0][1]('imagenes/img-1.json');
    expect(leerImagen).toHaveBeenCalledWith('imagenes/img-1.json');
    expect(registrarSincronizacionCompletada).toHaveBeenCalledWith(
      'github:owner/data',
      'v-2',
      expect.any(Date),
      true,
    );
  });

  it('no hace nada si la versión del destino activo coincide y registra el estado', async () => {
    const { caso, importar, exportar, registrarSincronizacionCompletada } = configurar({
      ajustes: ajustes({ ultimaVersionSincronizada: 'v-1' }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, version: 'v-1' }),
    });

    await expect(caso.sincronizar()).resolves.toEqual({ tipo: 'completada', accion: 'nada' });
    expect(importar).not.toHaveBeenCalled();
    expect(exportar).not.toHaveBeenCalled();
    expect(registrarSincronizacionCompletada).toHaveBeenCalledWith(
      'github:owner/data',
      'v-1',
      expect.any(Date),
      false,
    );
  });

  it('trata un destino sin fila sincronizada como primera sincronización', async () => {
    const { caso, escribirRemoto, registrarSincronizacionCompletada } = configurar({
      ajustes: ajustes({ metodoSincronizacion: 'google', cuentaGoogle: 'Persona@example.com' }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, version: 'v-remota' }),
    });

    await expect(caso.sincronizar()).resolves.toMatchObject({
      tipo: 'conflicto',
      opcionPorDefecto: 'conservar_remoto',
    });
    expect(escribirRemoto).not.toHaveBeenCalled();
    expect(registrarSincronizacionCompletada).not.toHaveBeenCalled();
  });

  it('sube los cambios a Google y después a GitHub usando el estado independiente de cada destino', async () => {
    const estados = [
      ajustes({
        metodoSincronizacion: 'google',
        cuentaGoogle: 'Persona@example.com',
        ultimaVersionSincronizada: null,
        cambiosLocalesPendientes: false,
      }),
      ajustes({
        metodoSincronizacion: 'github',
        ultimaVersionSincronizada: 'sha-github',
        cambiosLocalesPendientes: true,
      }),
    ];
    const obtenerAjustes = vi.fn().mockImplementation(async () => estados.shift());
    const leerRemoto = vi
      .fn()
      .mockResolvedValueOnce({ existe: false })
      .mockResolvedValueOnce({ existe: true, datos: DATOS_VACIOS, version: 'sha-github' });
    const escribirRemoto = vi
      .fn()
      .mockResolvedValueOnce({ versionNueva: 'v-google' })
      .mockResolvedValueOnce({ versionNueva: 'sha-github-nuevo' });
    const { caso, registrarSincronizacionCompletada } = configurar({
      ajustes: ajustes(),
      obtenerAjustes,
      leerRemoto,
      escribirRemoto,
    });

    await expect(caso.sincronizar()).resolves.toEqual({ tipo: 'completada', accion: 'subir' });
    await expect(caso.sincronizar()).resolves.toEqual({ tipo: 'completada', accion: 'subir' });

    expect(escribirRemoto).toHaveBeenNthCalledWith(1, DATOS_VACIOS, [], null);
    expect(escribirRemoto).toHaveBeenNthCalledWith(2, DATOS_VACIOS, [], 'sha-github');
    expect(registrarSincronizacionCompletada).toHaveBeenNthCalledWith(
      1,
      'google:persona@example.com',
      'v-google',
      expect.any(Date),
      false,
    );
    expect(registrarSincronizacionCompletada).toHaveBeenNthCalledWith(
      2,
      'github:owner/data',
      'sha-github-nuevo',
      expect.any(Date),
      false,
    );
  });

  it('resuelve conservar_local subiendo y registrando que los datos locales se conservan', async () => {
    const { caso, escribirRemoto, registrarSincronizacionCompletada } = configurar({ ajustes: ajustes() });

    await caso.resolverConflicto('conservar_local', DATOS_VACIOS, 'v-remota');

    expect(escribirRemoto).toHaveBeenCalledWith(DATOS_VACIOS, [], 'v-remota');
    expect(registrarSincronizacionCompletada).toHaveBeenCalledWith(
      'github:owner/data',
      'v-nueva',
      expect.any(Date),
      false,
    );
  });

  it('resuelve conservar_remoto e indica que han cambiado los datos locales', async () => {
    const { caso, importar, registrarSincronizacionCompletada } = configurar({ ajustes: ajustes() });

    await caso.resolverConflicto('conservar_remoto', DATOS_VACIOS, 'v-remota');

    expect(importar).toHaveBeenCalledWith(DATOS_VACIOS, expect.any(Function), true);
    expect(registrarSincronizacionCompletada).toHaveBeenCalledWith(
      'github:owner/data',
      'v-remota',
      expect.any(Date),
      true,
    );
  });

  it('no lee ni escribe proveedores si no hay método activo', async () => {
    const { caso, leerRemoto, escribirRemoto } = configurar({
      ajustes: ajustes({ metodoSincronizacion: null }),
    });

    await expect(caso.sincronizar()).rejects.toThrow('No hay ningún método de sincronización activo.');
    expect(leerRemoto).not.toHaveBeenCalled();
    expect(escribirRemoto).not.toHaveBeenCalled();
  });

  it.each([
    new ErrorRedSincronizacion('Sin conexión.'),
    new ErrorAutorizacionGoogle(),
  ])('propaga errores del proveedor sin registrar ni cambiar datos locales', async (error) => {
    const { caso, registrarSincronizacionCompletada, marcarCambiosLocalesPendientes, importar, exportar } = configurar({
      ajustes: ajustes({ cambiosLocalesPendientes: true }),
      leerRemoto: vi.fn().mockRejectedValue(error),
    });

    await expect(caso.sincronizar()).rejects.toBe(error);
    expect(registrarSincronizacionCompletada).not.toHaveBeenCalled();
    expect(marcarCambiosLocalesPendientes).not.toHaveBeenCalled();
    expect(importar).not.toHaveBeenCalled();
    expect(exportar).not.toHaveBeenCalled();
  });

  it('no registra la sincronización si falla la escritura remota', async () => {
    const { caso, registrarSincronizacionCompletada } = configurar({
      ajustes: ajustes({ cambiosLocalesPendientes: true }),
      escribirRemoto: vi.fn().mockRejectedValue(new ErrorRedSincronizacion('Sin conexión.')),
    });

    await expect(caso.sincronizar()).rejects.toBeInstanceOf(ErrorRedSincronizacion);
    expect(registrarSincronizacionCompletada).not.toHaveBeenCalled();
  });

  it('no registra la sincronización si hay conflicto remoto durante la escritura', async () => {
    const { caso, importar, registrarSincronizacionCompletada } = configurar({
      ajustes: ajustes({ ultimaVersionSincronizada: 'v-1', cambiosLocalesPendientes: true }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, version: 'v-1' }),
      escribirRemoto: vi.fn().mockRejectedValue(new ErrorConflictoRemoto('Los datos han cambiado.')),
    });

    await expect(caso.sincronizar()).rejects.toBeInstanceOf(ErrorConflictoRemoto);
    expect(importar).not.toHaveBeenCalled();
    expect(registrarSincronizacionCompletada).not.toHaveBeenCalled();
  });

  it('ignora una segunda sincronización mientras la primera sigue en curso', async () => {
    let completarLectura: (lectura: { existe: false }) => void = () => undefined;
    const leerRemoto = vi.fn(
      () => new Promise<{ existe: false }>((resolve) => (completarLectura = resolve)),
    );
    const { caso } = configurar({ ajustes: ajustes(), leerRemoto });
    const primera = caso.sincronizar();
    await vi.waitFor(() => expect(leerRemoto).toHaveBeenCalledOnce());

    await expect(caso.sincronizar()).resolves.toBeNull();
    completarLectura({ existe: false });
    await expect(primera).resolves.toEqual({ tipo: 'completada', accion: 'subir' });
    expect(leerRemoto).toHaveBeenCalledOnce();
  });
});
