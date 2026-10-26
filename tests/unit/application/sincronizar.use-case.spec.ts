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
    destinoUltimaSincronizacion: 'github',
    ...sobrescribir,
  };
}

describe('SincronizarUseCase', () => {
  function configurar(opciones: {
    ajustes: AjustesAplicacion;
    leerRemoto?: ReturnType<typeof vi.fn>;
    escribirRemoto?: ReturnType<typeof vi.fn>;
    leerImagen?: ReturnType<typeof vi.fn>;
  }) {
    const actualizarUltimaVersionSincronizada = vi.fn().mockResolvedValue(undefined);
    const registrarDestinoSincronizado = vi.fn().mockResolvedValue(undefined);
    const registrarSincronizacionCorrecta = vi.fn().mockResolvedValue(undefined);
    const marcarCambiosLocalesPendientes = vi.fn().mockResolvedValue(undefined);
    const exportar = vi.fn().mockResolvedValue({ datos: DATOS_VACIOS, imagenesParaSubir: [] });
    const importar = vi.fn().mockResolvedValue(undefined);
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
            obtener: vi.fn().mockResolvedValue(opciones.ajustes),
            actualizarUltimaVersionSincronizada,
            registrarDestinoSincronizado,
            registrarSincronizacionCorrecta,
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
      actualizarUltimaVersionSincronizada,
      registrarDestinoSincronizado,
      registrarSincronizacionCorrecta,
      marcarCambiosLocalesPendientes,
      exportar,
      importar,
    };
  }

  it('sube los datos cuando el remoto no existe y persiste versión, destino y fecha tras el éxito', async () => {
    const { caso, escribirRemoto, actualizarUltimaVersionSincronizada, registrarDestinoSincronizado, marcarCambiosLocalesPendientes, registrarSincronizacionCorrecta } =
      configurar({
        ajustes: ajustes({ cambiosLocalesPendientes: true }),
        leerRemoto: vi.fn().mockResolvedValue({ existe: false }),
        escribirRemoto: vi.fn().mockResolvedValue({ versionNueva: 'v-1' }),
      });

    const resultado = await caso.sincronizar();

    expect(resultado).toEqual({ tipo: 'completada', accion: 'subir' });
    expect(escribirRemoto).toHaveBeenCalledWith(DATOS_VACIOS, [], null);
    expect(actualizarUltimaVersionSincronizada).toHaveBeenCalledWith('v-1');
    expect(registrarDestinoSincronizado).toHaveBeenCalledWith('github');
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledWith(false);
    expect(registrarSincronizacionCorrecta).toHaveBeenCalledWith(expect.any(Date));
  });

  it('descarga cambios remotos y resuelve las imágenes por la ruta lógica', async () => {
    const { caso, importar, leerImagen, actualizarUltimaVersionSincronizada } = configurar({
      ajustes: ajustes({ ultimaVersionSincronizada: 'v-1' }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, version: 'v-2' }),
    });

    const resultado = await caso.sincronizar();

    expect(resultado).toEqual({ tipo: 'completada', accion: 'descargar' });
    expect(importar).toHaveBeenCalledWith(DATOS_VACIOS, expect.any(Function));
    await importar.mock.calls[0][1]('imagenes/img-1.json');
    expect(leerImagen).toHaveBeenCalledWith('imagenes/img-1.json');
    expect(actualizarUltimaVersionSincronizada).toHaveBeenCalledWith('v-2');
  });

  it('no hace nada cuando no hay cambios en ningún lado', async () => {
    const { caso, importar, exportar, registrarSincronizacionCorrecta } = configurar({
      ajustes: ajustes({ ultimaVersionSincronizada: 'v-1' }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, version: 'v-1' }),
    });

    const resultado = await caso.sincronizar();

    expect(resultado).toEqual({ tipo: 'completada', accion: 'nada' });
    expect(importar).not.toHaveBeenCalled();
    expect(exportar).not.toHaveBeenCalled();
    expect(registrarSincronizacionCorrecta).toHaveBeenCalledWith(expect.any(Date));
  });

  it('devuelve un conflicto cuando hay cambios locales y remotos, sin modificar ajustes', async () => {
    const { caso, importar, exportar, actualizarUltimaVersionSincronizada, registrarDestinoSincronizado, registrarSincronizacionCorrecta } =
      configurar({
        ajustes: ajustes({ ultimaVersionSincronizada: 'v-1', cambiosLocalesPendientes: true }),
        leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, version: 'v-2' }),
      });

    const resultado = await caso.sincronizar();

    expect(resultado).toEqual({
      tipo: 'conflicto',
      opcionPorDefecto: 'conservar_local',
      datosRemotos: DATOS_VACIOS,
      version: 'v-2',
    });
    expect(importar).not.toHaveBeenCalled();
    expect(exportar).not.toHaveBeenCalled();
    expect(actualizarUltimaVersionSincronizada).not.toHaveBeenCalled();
    expect(registrarDestinoSincronizado).not.toHaveBeenCalled();
    expect(registrarSincronizacionCorrecta).not.toHaveBeenCalled();
  });

  it('resuelve conservar_local subiendo y guardando la nueva versión', async () => {
    const { caso, escribirRemoto, actualizarUltimaVersionSincronizada, registrarDestinoSincronizado, marcarCambiosLocalesPendientes, registrarSincronizacionCorrecta } =
      configurar({ ajustes: ajustes() });

    await caso.resolverConflicto('conservar_local', DATOS_VACIOS, 'v-remota');

    expect(escribirRemoto).toHaveBeenCalledWith(DATOS_VACIOS, [], 'v-remota');
    expect(actualizarUltimaVersionSincronizada).toHaveBeenCalledWith('v-nueva');
    expect(registrarDestinoSincronizado).toHaveBeenCalledWith('github');
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledWith(false);
    expect(registrarSincronizacionCorrecta).toHaveBeenCalledWith(expect.any(Date));
  });

  it('resuelve conservar_remoto aplicando los datos y su versión localmente', async () => {
    const { caso, importar, actualizarUltimaVersionSincronizada } = configurar({ ajustes: ajustes() });

    await caso.resolverConflicto('conservar_remoto', DATOS_VACIOS, 'v-remota');

    expect(importar).toHaveBeenCalledWith(DATOS_VACIOS, expect.any(Function));
    expect(actualizarUltimaVersionSincronizada).toHaveBeenCalledWith('v-remota');
  });

  it('trata un destino nuevo como primera sincronización y no lo sobrescribe', async () => {
    const { caso, escribirRemoto, actualizarUltimaVersionSincronizada, registrarDestinoSincronizado, registrarSincronizacionCorrecta } =
      configurar({
        ajustes: ajustes({
          metodoSincronizacion: 'google',
          cuentaGoogle: 'persona@example.com',
          ultimaVersionSincronizada: 'v-anterior',
          destinoUltimaSincronizacion: 'google:otra@example.com',
        }),
        leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, version: 'v-remota' }),
      });

    const resultado = await caso.sincronizar();

    expect(resultado).toMatchObject({ tipo: 'conflicto', opcionPorDefecto: 'conservar_remoto' });
    expect(escribirRemoto).not.toHaveBeenCalled();
    expect(actualizarUltimaVersionSincronizada).not.toHaveBeenCalled();
    expect(registrarDestinoSincronizado).not.toHaveBeenCalled();
    expect(registrarSincronizacionCorrecta).not.toHaveBeenCalled();
  });

  it('propaga errores del proveedor sin modificar ningún dato local', async () => {
    const { caso, actualizarUltimaVersionSincronizada, registrarDestinoSincronizado, marcarCambiosLocalesPendientes, importar, exportar, registrarSincronizacionCorrecta } =
      configurar({
        ajustes: ajustes({ cambiosLocalesPendientes: true }),
        leerRemoto: vi.fn().mockRejectedValue(new ErrorRedSincronizacion('Sin conexión.')),
      });

    await expect(caso.sincronizar()).rejects.toThrow(ErrorRedSincronizacion);

    expect(actualizarUltimaVersionSincronizada).not.toHaveBeenCalled();
    expect(registrarDestinoSincronizado).not.toHaveBeenCalled();
    expect(marcarCambiosLocalesPendientes).not.toHaveBeenCalled();
    expect(importar).not.toHaveBeenCalled();
    expect(exportar).not.toHaveBeenCalled();
    expect(registrarSincronizacionCorrecta).not.toHaveBeenCalled();
  });

  it('propaga el error de método no configurado sin cambiar ajustes ni datos locales', async () => {
    const { caso, actualizarUltimaVersionSincronizada, registrarDestinoSincronizado, marcarCambiosLocalesPendientes, importar, exportar, registrarSincronizacionCorrecta } =
      configurar({
        ajustes: ajustes({ metodoSincronizacion: null, destinoUltimaSincronizacion: null }),
        leerRemoto: vi.fn().mockRejectedValue(new Error('No hay ningún método de sincronización activo.')),
      });

    await expect(caso.sincronizar()).rejects.toThrow('No hay ningún método de sincronización activo.');

    expect(actualizarUltimaVersionSincronizada).not.toHaveBeenCalled();
    expect(registrarDestinoSincronizado).not.toHaveBeenCalled();
    expect(marcarCambiosLocalesPendientes).not.toHaveBeenCalled();
    expect(importar).not.toHaveBeenCalled();
    expect(exportar).not.toHaveBeenCalled();
    expect(registrarSincronizacionCorrecta).not.toHaveBeenCalled();
  });

  it('solo registra la fecha correcta después de una escritura remota completada', async () => {
    const { caso, registrarSincronizacionCorrecta, actualizarUltimaVersionSincronizada, registrarDestinoSincronizado, marcarCambiosLocalesPendientes } =
      configurar({
      ajustes: ajustes({ cambiosLocalesPendientes: true }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: false }),
      escribirRemoto: vi.fn().mockRejectedValue(new ErrorRedSincronizacion('Sin conexión.')),
    });

    await expect(caso.sincronizar()).rejects.toThrow(ErrorRedSincronizacion);
    expect(actualizarUltimaVersionSincronizada).not.toHaveBeenCalled();
    expect(registrarDestinoSincronizado).not.toHaveBeenCalled();
    expect(marcarCambiosLocalesPendientes).not.toHaveBeenCalled();
    expect(registrarSincronizacionCorrecta).not.toHaveBeenCalled();
  });

  it('ignora una segunda sincronización mientras la primera sigue en curso', async () => {
    let completarLectura: (lectura: { existe: false }) => void = () => undefined;
    const leerRemoto = vi.fn(
      () =>
        new Promise<{ existe: false }>((resolve) => {
          completarLectura = resolve;
        }),
    );
    const { caso } = configurar({ ajustes: ajustes(), leerRemoto });
    const primera = caso.sincronizar();
    await vi.waitFor(() => expect(leerRemoto).toHaveBeenCalledOnce());

    await expect(caso.sincronizar()).resolves.toBeNull();
    completarLectura({ existe: false });
    await expect(primera).resolves.toEqual({ tipo: 'completada', accion: 'subir' });
    expect(leerRemoto).toHaveBeenCalledOnce();
  });

  it('conserva datos y ajustes locales si la escritura encuentra un conflicto remoto', async () => {
    const {
      caso,
      importar,
      actualizarUltimaVersionSincronizada,
      registrarDestinoSincronizado,
      marcarCambiosLocalesPendientes,
      registrarSincronizacionCorrecta,
    } = configurar({
      ajustes: ajustes({ ultimaVersionSincronizada: 'v1', cambiosLocalesPendientes: true }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, version: 'v1' }),
      escribirRemoto: vi.fn().mockRejectedValue(new ErrorConflictoRemoto('Los datos han cambiado.')),
    });

    await expect(caso.sincronizar()).rejects.toBeInstanceOf(ErrorConflictoRemoto);

    expect(importar).not.toHaveBeenCalled();
    expect(actualizarUltimaVersionSincronizada).not.toHaveBeenCalled();
    expect(registrarDestinoSincronizado).not.toHaveBeenCalled();
    expect(marcarCambiosLocalesPendientes).not.toHaveBeenCalled();
    expect(registrarSincronizacionCorrecta).not.toHaveBeenCalled();
  });

  it('sube los datos si el destino remoto ya no contiene la copia esperada', async () => {
    const { caso, escribirRemoto } = configurar({
      ajustes: ajustes({ ultimaVersionSincronizada: 'version-anterior' }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: false }),
    });

    await expect(caso.sincronizar()).resolves.toEqual({ tipo: 'completada', accion: 'subir' });

    expect(escribirRemoto).toHaveBeenCalledWith(DATOS_VACIOS, [], null);
  });

  it('propaga la autorización caducada sin cambiar la copia local ni sus ajustes', async () => {
    const {
      caso,
      importar,
      exportar,
      actualizarUltimaVersionSincronizada,
      registrarDestinoSincronizado,
      marcarCambiosLocalesPendientes,
      registrarSincronizacionCorrecta,
    } = configurar({
      ajustes: ajustes({ metodoSincronizacion: 'google', cuentaGoogle: 'persona@example.com' }),
      leerRemoto: vi.fn().mockRejectedValue(new ErrorAutorizacionGoogle()),
    });

    await expect(caso.sincronizar()).rejects.toBeInstanceOf(ErrorAutorizacionGoogle);

    expect(importar).not.toHaveBeenCalled();
    expect(exportar).not.toHaveBeenCalled();
    expect(actualizarUltimaVersionSincronizada).not.toHaveBeenCalled();
    expect(registrarDestinoSincronizado).not.toHaveBeenCalled();
    expect(marcarCambiosLocalesPendientes).not.toHaveBeenCalled();
    expect(registrarSincronizacionCorrecta).not.toHaveBeenCalled();
  });

  it('trata una cuenta Google distinta como primera sincronización sin escribir en el destino anterior', async () => {
    const { caso, escribirRemoto, importar } = configurar({
      ajustes: ajustes({
        metodoSincronizacion: 'google',
        cuentaGoogle: 'cuenta-nueva@example.com',
        ultimaVersionSincronizada: 'version-anterior',
        destinoUltimaSincronizacion: 'google:cuenta-anterior@example.com',
      }),
      leerRemoto: vi.fn().mockResolvedValue({ existe: true, datos: DATOS_VACIOS, version: 'v-remota' }),
    });

    await expect(caso.sincronizar()).resolves.toEqual({
      tipo: 'conflicto',
      opcionPorDefecto: 'conservar_remoto',
      datosRemotos: DATOS_VACIOS,
      version: 'v-remota',
    });

    expect(escribirRemoto).not.toHaveBeenCalled();
    expect(importar).not.toHaveBeenCalled();
  });
});
