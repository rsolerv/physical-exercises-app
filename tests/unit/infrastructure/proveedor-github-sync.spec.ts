import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ProveedorGithubSync } from '../../../src/app/infrastructure/github-sync/proveedor-github-sync';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { GitHubSyncPort } from '../../../src/app/application/ports/github-sync.port';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';

describe('ProveedorGithubSync', () => {
  function configurar(ajustes: { tokenGitHub: string | null; repositorioGitHub: string | null } = {
    tokenGitHub: 'github-token',
    repositorioGitHub: 'owner/datos',
  }) {
    const obtener = vi.fn().mockResolvedValue(ajustes);
    const leerRemoto = vi.fn().mockResolvedValue({
      existe: true,
      datos: { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] },
      sha: 'sha-1',
    });
    const escribirRemoto = vi.fn().mockResolvedValue({ shaNuevo: 'sha-2' });
    const leerImagen = vi.fn().mockResolvedValue({
      id: 'img-1',
      nombreArchivo: 'foto.png',
      tipoMime: 'image/png',
      contenidoBase64: 'base64',
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: AjustesRepositoryPort, useValue: { obtener } },
        { provide: GitHubSyncPort, useValue: { leerRemoto, escribirRemoto, leerImagen } },
      ],
    });
    return {
      proveedor: TestBed.inject(ProveedorGithubSync),
      obtener,
      leerRemoto,
      escribirRemoto,
      leerImagen,
    };
  }

  it('lee las credenciales de ajustes y traduce SHA a versión', async () => {
    const { proveedor, obtener, leerRemoto } = configurar();

    await expect(proveedor.leerRemoto()).resolves.toMatchObject({ existe: true, version: 'sha-1' });

    expect(obtener).toHaveBeenCalledOnce();
    expect(leerRemoto).toHaveBeenCalledWith({ tokenPAT: 'github-token', repositorio: 'owner/datos' });
  });

  it('traduce la versión esperada y el SHA nuevo al escribir', async () => {
    const { proveedor, escribirRemoto } = configurar();
    const datos = { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] };

    await expect(proveedor.escribirRemoto(datos, [], 'sha-1')).resolves.toEqual({ versionNueva: 'sha-2' });

    expect(escribirRemoto).toHaveBeenCalledWith(
      { tokenPAT: 'github-token', repositorio: 'owner/datos' },
      datos,
      [],
      'sha-1'
    );
  });

  it('delega la lectura de imágenes', async () => {
    const { proveedor, leerImagen } = configurar();

    await proveedor.leerImagen('imagenes/img-1.json');

    expect(leerImagen).toHaveBeenCalledWith(
      { tokenPAT: 'github-token', repositorio: 'owner/datos' },
      'imagenes/img-1.json'
    );
  });

  it('rechaza la sincronización si faltan las credenciales de GitHub', async () => {
    const { proveedor, leerRemoto } = configurar({ tokenGitHub: null, repositorioGitHub: null });

    await expect(proveedor.leerRemoto()).rejects.toThrow(
      new ErrorValidacion('Configura el token y el repositorio de GitHub antes de sincronizar.')
    );
    expect(leerRemoto).not.toHaveBeenCalled();
  });
});
