import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { SincronizarUseCase } from '../../../src/app/application/casos-uso/sincronizar.use-case';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import { SincronizarAlIniciarService } from '../../../src/app/presentation/sincronizacion/sincronizar-al-iniciar.service';

describe('SincronizarAlIniciarService', () => {
  let obtenerAjustes: ReturnType<typeof vi.fn>;
  let sincronizar: ReturnType<typeof vi.fn>;
  let navegar: ReturnType<typeof vi.fn>;
  let mostrarExito: ReturnType<typeof vi.fn>;
  let mostrarError: ReturnType<typeof vi.fn>;

  function configurar(metodoSincronizacion: 'github' | 'google' | null) {
    obtenerAjustes = vi.fn().mockResolvedValue({ metodoSincronizacion });
    sincronizar = vi.fn();
    navegar = vi.fn().mockResolvedValue(true);
    mostrarExito = vi.fn();
    mostrarError = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: AjustesRepositoryPort, useValue: { obtener: obtenerAjustes } },
        { provide: SincronizarUseCase, useValue: { sincronizar } },
        { provide: Router, useValue: { navigateByUrl: navegar } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarError } },
      ],
    });
  }

  beforeEach(() => TestBed.resetTestingModule());

  it('sin método activo no inicia ninguna sincronización', async () => {
    configurar(null);

    await TestBed.inject(SincronizarAlIniciarService).ejecutar();

    expect(sincronizar).not.toHaveBeenCalled();
    expect(mostrarExito).not.toHaveBeenCalled();
    expect(mostrarError).not.toHaveBeenCalled();
  });

  it.each(['github', 'google'] as const)('sincroniza al iniciar con el método %s activo', async (metodo) => {
    configurar(metodo);
    sincronizar.mockResolvedValue({ tipo: 'completada', accion: 'nada' });

    await TestBed.inject(SincronizarAlIniciarService).ejecutar();

    expect(sincronizar).toHaveBeenCalledOnce();
    expect(mostrarExito).toHaveBeenCalledWith('Sincronización automática completada.');
    expect(mostrarError).not.toHaveBeenCalled();
  });

  it('no muestra ni resuelve conflictos durante la sincronización de inicio', async () => {
    configurar('google');
    sincronizar.mockResolvedValue({
      tipo: 'conflicto',
      opcionPorDefecto: 'conservar_remoto',
      datosRemotos: {
        version: 1,
        ejercicios: [],
        categorias: [],
        planificaciones: [],
        progresoDiario: [],
      },
      version: 'v-1',
    });

    await TestBed.inject(SincronizarAlIniciarService).ejecutar();

    expect(navegar).not.toHaveBeenCalled();
    expect(mostrarExito).not.toHaveBeenCalled();
    expect(mostrarError).not.toHaveBeenCalled();
  });

  it('informa los errores de sincronización sin impedir el arranque', async () => {
    configurar('github');
    sincronizar.mockRejectedValue(new Error('No hay conexión.'));

    await TestBed.inject(SincronizarAlIniciarService).ejecutar();

    expect(mostrarError).toHaveBeenCalledWith('No hay conexión.');
  });

  it('evita ejecutar dos veces la sincronización de inicio', async () => {
    configurar('github');
    sincronizar.mockResolvedValue({ tipo: 'completada', accion: 'nada' });
    const servicio = TestBed.inject(SincronizarAlIniciarService);

    await servicio.ejecutar();
    await servicio.ejecutar();

    expect(sincronizar).toHaveBeenCalledOnce();
  });
});
