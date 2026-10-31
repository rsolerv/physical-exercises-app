import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AdministrarRepositorioComunUseCase } from '../../../src/app/application/casos-uso/administrar-repositorio-comun.use-case';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { RepositorioComunPort } from '../../../src/app/application/ports/repositorio-comun.port';
import { ErrorOperacionNoPermitida } from '../../../src/app/domain/errores/errores-dominio';

describe('AdministrarRepositorioComunUseCase', () => {
  let useCase: AdministrarRepositorioComunUseCase;
  let obtener: ReturnType<typeof vi.fn>;
  let obtenerLoginGitHub: ReturnType<typeof vi.fn>;
  let eliminarEjercicio: ReturnType<typeof vi.fn>;
  let obtenerPorId: ReturnType<typeof vi.fn>;
  let quitarMarcaSubidoRepositorioComun: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    obtener = vi.fn().mockResolvedValue({ tokenGitHub: 'pat-admin', repositorioGitHub: 'owner/private-data' });
    obtenerLoginGitHub = vi.fn().mockResolvedValue('rsolerv');
    eliminarEjercicio = vi.fn().mockResolvedValue(undefined);
    obtenerPorId = vi.fn().mockResolvedValue({ id: 'ej-1', subidoRepositorioComun: true });
    quitarMarcaSubidoRepositorioComun = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AjustesRepositoryPort, useValue: { obtener } },
        { provide: EjercicioRepositoryPort, useValue: { obtenerPorId, quitarMarcaSubidoRepositorioComun } },
        { provide: RepositorioComunPort, useValue: { obtenerLoginGitHub, eliminarEjercicio } },
      ],
    });
    useCase = TestBed.inject(AdministrarRepositorioComunUseCase);
  });

  it('solo acredita la cuenta cuando GitHub confirma el login rsolerv', async () => {
    expect(await useCase.esAdministrador()).toBe(true);
    expect(obtenerLoginGitHub).toHaveBeenCalledWith('pat-admin');

    obtenerLoginGitHub.mockResolvedValueOnce('another-user');
    expect(await useCase.esAdministrador()).toBe(false);
  });

  it('no acredita una sesión sin PAT', async () => {
    obtener.mockResolvedValueOnce({ tokenGitHub: null, repositorioGitHub: null });
    expect(await useCase.esAdministrador()).toBe(false);
    expect(obtenerLoginGitHub).not.toHaveBeenCalled();
  });

  it('rechaza una acción administrativa cuando no hay PAT guardada', async () => {
    obtener.mockResolvedValueOnce({ tokenGitHub: null, repositorioGitHub: null });
    await expect(useCase.eliminarEjercicio('remoto-1')).rejects.toThrow(ErrorOperacionNoPermitida);
    expect(obtenerLoginGitHub).not.toHaveBeenCalled();
    expect(eliminarEjercicio).not.toHaveBeenCalled();
  });

  it('usa una cadena vacía si no hay repositorio privado configurado', async () => {
    obtener.mockResolvedValueOnce({ tokenGitHub: 'pat-admin', repositorioGitHub: null });
    await useCase.eliminarEjercicio('remoto-1');
    expect(eliminarEjercicio).toHaveBeenCalledWith({ tokenPAT: 'pat-admin', repositorio: '' }, 'remoto-1');
  });

  it('vuelve a comprobar la identidad antes de borrar del catálogo remoto', async () => {
    await useCase.eliminarEjercicio('remoto-1');
    expect(eliminarEjercicio).toHaveBeenCalledWith(
      { tokenPAT: 'pat-admin', repositorio: 'owner/private-data' },
      'remoto-1'
    );

    obtenerLoginGitHub.mockResolvedValueOnce('another-user');
    await expect(useCase.eliminarEjercicio('remoto-1')).rejects.toThrow(ErrorOperacionNoPermitida);
    expect(eliminarEjercicio).toHaveBeenCalledTimes(1);
  });

  it('solo quita la marca local tras verificar la identidad administradora', async () => {
    await useCase.quitarMarcaSubido('ej-1');
    expect(obtenerPorId).toHaveBeenCalledWith('ej-1');
    expect(quitarMarcaSubidoRepositorioComun).toHaveBeenCalledWith('ej-1');

    obtenerLoginGitHub.mockResolvedValueOnce('another-user');
    await expect(useCase.quitarMarcaSubido('ej-1')).rejects.toThrow(ErrorOperacionNoPermitida);
    expect(quitarMarcaSubidoRepositorioComun).toHaveBeenCalledTimes(1);
  });

  it('no quita la marca si el ejercicio local ya no existe', async () => {
    obtenerPorId.mockResolvedValueOnce(null);
    await expect(useCase.quitarMarcaSubido('borrado-local')).rejects.toThrow('No existe el ejercicio');
    expect(quitarMarcaSubidoRepositorioComun).not.toHaveBeenCalled();
  });
});
