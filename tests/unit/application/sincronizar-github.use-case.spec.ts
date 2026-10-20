import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SincronizarGithubUseCase } from '../../../src/app/application/casos-uso/sincronizar-github.use-case';
import { ExportarImportarDatosUseCase } from '../../../src/app/application/casos-uso/exportar-importar-datos.use-case';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { GitHubSyncPort } from '../../../src/app/application/ports/github-sync.port';
import type { AjustesAplicacion } from '../../../src/app/application/ports/ajustes-repository.port';
import type { ExportacionJSON } from '../../../src/app/application/ports/github-sync.port';
import { ErrorRedSincronizacion } from '../../../src/app/domain/errores/errores-dominio';

const DATOS_VACIOS: ExportacionJSON = { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] };

function ajustes(sobrescribir: Partial<AjustesAplicacion> = {}): AjustesAplicacion {
  return {
    tokenGitHub: 'token',
    repositorioGitHub: 'owner/data',
    ultimoShaSincronizado: null,
    ultimaSincronizacionCorrecta: null,
    cambiosLocalesPendientes: false,
    catalogoPredefinidoCargado: true,
    ...sobrescribir,
  };
}

describe('SincronizarGithubUseCase', () => {
  function configurar(opciones: {
    ajustes: AjustesAplicacion;
    leerRemoto?: ReturnType<typeof vi.fn>;
    escribirRemoto?: ReturnType<typeof vi.fn>;
  }) {
    const actualizarUltimoShaSincronizado = vi.fn().mockResolvedValue(undefined);
    const registrarSincronizacionCorrecta = vi.fn().mockResolvedValue(undefined);
    const marcarCambiosLocalesPendientes = vi.fn().mockResolvedValue(undefined);
    const exportar = vi.fn().mockResolvedValue({ datos: DATOS_VACIOS, imagenesParaSubir: [] });
    const importar = vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AjustesRepositoryPort,
          useValue: {
            obtener: vi.fn().mockResolvedValue(opciones.ajustes),
            actualizarUltimoShaSincronizado,
            registrarSincronizacionCorrecta,
            marcarCambiosLocalesPendientes,
          },
        },
        {
          provide: GitHubSyncPort,
          useValue: {
            leerRemoto: opciones.leerRemoto ?? vi.fn().mockResolvedValue({ existe: false }),
            escribirRemoto: opciones.escribirRemoto ?? vi.fn().mockResolvedValue({ shaNuevo: 'sha-nuevo' }),
          },
        },
        { provide: ExportarImportarDatosUseCase, useValue: { exportar, importar } },
      ],
    });
    return {
      caso: TestBed.inject(SincronizarGithubUseCase),
      actualizarUltimoShaSincronizado,
      registrarSincronizacionCorrecta,
      marcarCambiosLocalesPendientes,
      exportar,
      importar,
    };
  }

  it('sube los datos cuando el remoto no existe', async () => {
    const { caso, actualizarUltimoShaSincronizado, marcarCambiosLocalesPendientes } = configurar({
      ajustes: ajustes(),
      leerRemoto: vi.fn().mockResolvedValue({ existe: false }),
    });

    const resultado = await caso.sincronizar();

    expect(resultado).toEqual({ tipo: 'completada', accion: 'subir' });
    expect(actualizarUltimoShaSincronizado).toHaveBeenCalledWith('sha-nuevo');
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledWith(false);
  });

  it('descarga y aplica los datos remotos cuando solo hay cambios remotos', async () => {
    const { caso, importar, actualizarUltimoShaSincronizado, registrarSincronizacionCorrecta } = configurar({
      ajustes: ajustes({ ultimoShaSincronizado: 'sha-1', cambiosLocalesPendientes: false }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, sha: 'sha-2' }),
    });

    const resultado = await caso.sincronizar();

    expect(resultado).toEqual({ tipo: 'completada', accion: 'descargar' });
    expect(importar).toHaveBeenCalledWith(DATOS_VACIOS, { tokenPAT: 'token', repositorio: 'owner/data' });
    expect(actualizarUltimoShaSincronizado).toHaveBeenCalledWith('sha-2');
    expect(registrarSincronizacionCorrecta).toHaveBeenCalledWith(expect.any(Date));
  });

  it('no hace nada cuando no hay cambios en ningún lado', async () => {
    const { caso, importar, exportar, registrarSincronizacionCorrecta } = configurar({
      ajustes: ajustes({ ultimoShaSincronizado: 'sha-1', cambiosLocalesPendientes: false }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, sha: 'sha-1' }),
    });

    const resultado = await caso.sincronizar();

    expect(resultado).toEqual({ tipo: 'completada', accion: 'nada' });
    expect(importar).not.toHaveBeenCalled();
    expect(exportar).not.toHaveBeenCalled();
    expect(registrarSincronizacionCorrecta).toHaveBeenCalledWith(expect.any(Date));
  });

  it('devuelve un conflicto cuando hay cambios en ambos lados, sin modificar datos locales todavía', async () => {
    const { caso, importar, exportar, registrarSincronizacionCorrecta } = configurar({
      ajustes: ajustes({ ultimoShaSincronizado: 'sha-1', cambiosLocalesPendientes: true }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, sha: 'sha-2' }),
    });

    const resultado = await caso.sincronizar();

    expect(resultado).toEqual({
      tipo: 'conflicto',
      opcionPorDefecto: 'conservar_local',
      datosRemotos: DATOS_VACIOS,
      sha: 'sha-2',
    });
    expect(importar).not.toHaveBeenCalled();
    expect(exportar).not.toHaveBeenCalled();
    expect(registrarSincronizacionCorrecta).not.toHaveBeenCalled();
  });

  it('resolverConflicto("conservar_local") sube los datos locales', async () => {
    const escribirRemoto = vi.fn().mockResolvedValue({ shaNuevo: 'sha-resuelto' });
    const { caso, actualizarUltimoShaSincronizado, marcarCambiosLocalesPendientes, registrarSincronizacionCorrecta } = configurar({
      ajustes: ajustes(),
      escribirRemoto,
    });

    await caso.resolverConflicto('conservar_local', DATOS_VACIOS, 'sha-2');

    expect(escribirRemoto).toHaveBeenCalled();
    expect(actualizarUltimoShaSincronizado).toHaveBeenCalledWith('sha-resuelto');
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledWith(false);
    expect(registrarSincronizacionCorrecta).toHaveBeenCalledWith(expect.any(Date));
  });

  it('resolverConflicto("conservar_remoto") aplica los datos remotos localmente', async () => {
    const { caso, importar, actualizarUltimoShaSincronizado } = configurar({ ajustes: ajustes() });

    await caso.resolverConflicto('conservar_remoto', DATOS_VACIOS, 'sha-2');

    expect(importar).toHaveBeenCalledWith(DATOS_VACIOS, { tokenPAT: 'token', repositorio: 'owner/data' });
    expect(actualizarUltimoShaSincronizado).toHaveBeenCalledWith('sha-2');
  });

  it('ante un error de red no modifica ningún dato local (CL4, FR-032)', async () => {
    const {
      caso,
      actualizarUltimoShaSincronizado,
      marcarCambiosLocalesPendientes,
      importar,
      exportar,
      registrarSincronizacionCorrecta,
    } = configurar({
      ajustes: ajustes(),
      leerRemoto: vi.fn().mockRejectedValue(new ErrorRedSincronizacion('Sin conexión.')),
    });

    await expect(caso.sincronizar()).rejects.toThrow(ErrorRedSincronizacion);

    expect(actualizarUltimoShaSincronizado).not.toHaveBeenCalled();
    expect(marcarCambiosLocalesPendientes).not.toHaveBeenCalled();
    expect(importar).not.toHaveBeenCalled();
    expect(exportar).not.toHaveBeenCalled();
    expect(registrarSincronizacionCorrecta).not.toHaveBeenCalled();
  });

  it('registra la fecha UTC únicamente después de una subida completada', async () => {
    const { caso, registrarSincronizacionCorrecta } = configurar({
      ajustes: ajustes({ cambiosLocalesPendientes: true }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: false }),
    });

    await caso.sincronizar();

    const fecha = registrarSincronizacionCorrecta.mock.calls[0][0] as Date;
    expect(fecha).toBeInstanceOf(Date);
    expect(fecha.toISOString()).toMatch(/Z$/);
  });

  it('no reemplaza la fecha correcta si falla la escritura remota', async () => {
    const { caso, registrarSincronizacionCorrecta } = configurar({
      ajustes: ajustes({ ultimaSincronizacionCorrecta: new Date('2026-10-01T00:00:00.000Z'), cambiosLocalesPendientes: true }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: false }),
      escribirRemoto: vi.fn().mockRejectedValue(new ErrorRedSincronizacion('Sin conexión.')),
    });

    await expect(caso.sincronizar()).rejects.toThrow(ErrorRedSincronizacion);

    expect(registrarSincronizacionCorrecta).not.toHaveBeenCalled();
  });
});
