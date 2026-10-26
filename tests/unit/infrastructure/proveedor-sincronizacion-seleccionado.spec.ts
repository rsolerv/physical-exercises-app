import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import {
  GOOGLE_DRIVE_SYNC_PROVIDER,
  ProveedorSincronizacionSeleccionado,
} from '../../../src/app/infrastructure/sincronizacion/proveedor-sincronizacion-seleccionado';
import { ProveedorGithubSync } from '../../../src/app/infrastructure/github-sync/proveedor-github-sync';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';

describe('ProveedorSincronizacionSeleccionado', () => {
  let ajustesRepository: { obtener: ReturnType<typeof vi.fn> };
  let github: {
    leerRemoto: ReturnType<typeof vi.fn>;
    escribirRemoto: ReturnType<typeof vi.fn>;
    leerImagen: ReturnType<typeof vi.fn>;
  };
  let google: {
    leerRemoto: ReturnType<typeof vi.fn>;
    escribirRemoto: ReturnType<typeof vi.fn>;
    leerImagen: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    ajustesRepository = { obtener: vi.fn().mockResolvedValue({ metodoSincronizacion: 'github' }) };
    github = {
      leerRemoto: vi.fn().mockResolvedValue({ existe: false }),
      escribirRemoto: vi.fn().mockResolvedValue({ versionNueva: 'github-v1' }),
      leerImagen: vi.fn().mockResolvedValue({}),
    };
    google = {
      leerRemoto: vi.fn().mockResolvedValue({ existe: false }),
      escribirRemoto: vi.fn().mockResolvedValue({ versionNueva: 'google-v1' }),
      leerImagen: vi.fn().mockResolvedValue({}),
    };
    TestBed.configureTestingModule({
      providers: [
        ProveedorSincronizacionSeleccionado,
        { provide: AjustesRepositoryPort, useValue: ajustesRepository },
        { provide: ProveedorGithubSync, useValue: github },
        { provide: GOOGLE_DRIVE_SYNC_PROVIDER, useValue: google },
      ],
    });
  });

  it('delega las lecturas en GitHub cuando GitHub es el método activo', async () => {
    ajustesRepository.obtener.mockResolvedValue({ metodoSincronizacion: 'github' });
    const proveedor = TestBed.inject(ProveedorSincronizacionSeleccionado);

    await proveedor.leerRemoto();

    expect(github.leerRemoto).toHaveBeenCalledOnce();
    expect(google.leerRemoto).not.toHaveBeenCalled();
  });

  it('delega las lecturas en Google cuando Google es el método activo', async () => {
    ajustesRepository.obtener.mockResolvedValue({ metodoSincronizacion: 'google' });
    const proveedor = TestBed.inject(ProveedorSincronizacionSeleccionado);

    await proveedor.leerRemoto();

    expect(google.leerRemoto).toHaveBeenCalledOnce();
    expect(github.leerRemoto).not.toHaveBeenCalled();
  });

  it('delega las escrituras y la lectura de imágenes al proveedor seleccionado', async () => {
    ajustesRepository.obtener.mockResolvedValue({ metodoSincronizacion: 'google' });
    const proveedor = TestBed.inject(ProveedorSincronizacionSeleccionado);
    const datos = { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] };

    await proveedor.escribirRemoto(datos, [], null);
    await proveedor.leerImagen('imagenes/1.json');

    expect(google.escribirRemoto).toHaveBeenCalledWith(datos, [], null);
    expect(google.leerImagen).toHaveBeenCalledWith('imagenes/1.json');
    expect(github.escribirRemoto).not.toHaveBeenCalled();
    expect(github.leerImagen).not.toHaveBeenCalled();
  });

  it('rechaza la sincronización si no hay un método activo sin invocar proveedores', async () => {
    ajustesRepository.obtener.mockResolvedValue({ metodoSincronizacion: null });
    const proveedor = TestBed.inject(ProveedorSincronizacionSeleccionado);

    await expect(proveedor.leerRemoto()).rejects.toBeInstanceOf(ErrorValidacion);

    expect(github.leerRemoto).not.toHaveBeenCalled();
    expect(google.leerRemoto).not.toHaveBeenCalled();
  });
});
