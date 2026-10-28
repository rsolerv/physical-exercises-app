import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { GestionarConexionSincronizacionUseCase } from '../../../src/app/application/casos-uso/gestionar-conexion-sincronizacion.use-case';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { GoogleAutorizacionPort } from '../../../src/app/application/ports/google-autorizacion.port';
import type { AjustesAplicacion } from '../../../src/app/application/ports/ajustes-repository.port';
import {
  ErrorConexionCancelada,
  ErrorRedSincronizacion,
  ErrorVentanaBloqueada,
} from '../../../src/app/domain/errores/errores-dominio';

function ajustes(overrides: Partial<AjustesAplicacion> = {}): AjustesAplicacion {
  return {
    tokenGitHub: null,
    repositorioGitHub: null,
    ultimaVersionSincronizada: null,
    ultimaSincronizacionCorrecta: null,
    cambiosLocalesPendientes: false,
    catalogoPredefinidoCargado: true,
    metodoSincronizacion: null,
    cuentaGoogle: null,
    ...overrides,
  };
}

describe('GestionarConexionSincronizacionUseCase', () => {
  function configurar(
    ajustesAplicacion = ajustes(),
    conectar = vi.fn().mockResolvedValue({ correo: 'persona@example.com', nombre: 'Persona' }),
    desconectar = vi.fn().mockResolvedValue(undefined),
  ) {
    const conectarGoogle = vi.fn().mockResolvedValue(undefined);
    const desconectarGoogle = vi.fn().mockResolvedValue(undefined);
    const activarMetodo = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AjustesRepositoryPort,
          useValue: {
            obtener: vi.fn().mockResolvedValue(ajustesAplicacion),
            conectarGoogle,
            desconectarGoogle,
            activarMetodo,
          },
        },
        {
          provide: GoogleAutorizacionPort,
          useValue: { conectar, obtenerTokenAcceso: vi.fn(), desconectar },
        },
      ],
    });
    return {
      caso: TestBed.inject(GestionarConexionSincronizacionUseCase),
      conectar,
      conectarGoogle,
      desconectar,
      desconectarGoogle,
      activarMetodo,
    };
  }

  it('autoriza con Google y guarda el correo mostrado', async () => {
    const { caso, conectar, conectarGoogle } = configurar();

    await caso.conectarGoogle();

    expect(conectar).toHaveBeenCalledOnce();
    expect(conectarGoogle).toHaveBeenCalledWith('persona@example.com');
  });

  it('conecta Google con GitHub configurado y conserva sus credenciales', async () => {
    const { caso, conectar, conectarGoogle } = configurar(
      ajustes({ metodoSincronizacion: 'github', tokenGitHub: 'token', repositorioGitHub: 'owner/datos' }),
    );

    await caso.conectarGoogle();

    expect(conectar).toHaveBeenCalledOnce();
    expect(conectarGoogle).toHaveBeenCalledWith('persona@example.com');
  });

  it('activa el método seleccionado sin autorizar ni contactar con proveedores', async () => {
    const { caso, activarMetodo, conectar, desconectar } = configurar();

    await caso.activarMetodo('github');

    expect(activarMetodo).toHaveBeenCalledWith('github');
    expect(conectar).not.toHaveBeenCalled();
    expect(desconectar).not.toHaveBeenCalled();
  });

  it.each([
    new ErrorConexionCancelada(),
    new ErrorVentanaBloqueada(),
  ])('propaga cancelación o bloqueo sin guardar la cuenta', async (error) => {
    const { caso, conectarGoogle } = configurar(ajustes(), vi.fn().mockRejectedValue(error));

    await expect(caso.conectarGoogle()).rejects.toBe(error);

    expect(conectarGoogle).not.toHaveBeenCalled();
  });

  it('desconecta Google y elimina su cuenta local sin borrar las copias de datos', async () => {
    const { caso, desconectar, desconectarGoogle } = configurar(
      ajustes({ metodoSincronizacion: 'google', cuentaGoogle: 'persona@example.com' }),
    );

    await caso.desconectar();

    expect(desconectar).toHaveBeenCalledOnce();
    expect(desconectarGoogle).toHaveBeenCalledOnce();
  });

  it('desconecta localmente aunque falle la revocación por un error de red', async () => {
    const desconectar = vi.fn().mockRejectedValue(new ErrorRedSincronizacion('No hay conexión.'));
    const { caso, desconectarGoogle } = configurar(
      ajustes({ metodoSincronizacion: 'google', cuentaGoogle: 'persona@example.com' }),
      vi.fn(),
      desconectar,
    );

    await expect(caso.desconectar()).resolves.toBeUndefined();

    expect(desconectarGoogle).toHaveBeenCalledOnce();
  });

  it('desconecta Google sin cambiar las credenciales guardadas de GitHub', async () => {
    const { caso, desconectarGoogle } = configurar(
      ajustes({
        metodoSincronizacion: 'google',
        cuentaGoogle: 'persona@example.com',
        tokenGitHub: 'ghp_token',
        repositorioGitHub: 'owner/datos',
      }),
    );

    await caso.desconectar();

    expect(desconectarGoogle).toHaveBeenCalledOnce();
  });
});
