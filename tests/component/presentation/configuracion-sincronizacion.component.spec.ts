import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfiguracionSincronizacionComponent } from '../../../src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { SincronizarGithubUseCase } from '../../../src/app/application/casos-uso/sincronizar-github.use-case';
import { ConflictoSincronizacionEstadoService } from '../../../src/app/presentation/sincronizacion/conflicto-sincronizacion-estado.service';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import type { AjustesAplicacion } from '../../../src/app/application/ports/ajustes-repository.port';

function ajustes(sobrescribir: Partial<AjustesAplicacion> = {}): AjustesAplicacion {
  return {
    tokenGitHub: null,
    repositorioGitHub: null,
    ultimoShaSincronizado: null,
    ultimaSincronizacionCorrecta: null,
    cambiosLocalesPendientes: false,
    catalogoPredefinidoCargado: true,
    ...sobrescribir,
  };
}

describe('ConfiguracionSincronizacionComponent', () => {
  let mostrarExito: ReturnType<typeof vi.fn>;
  let mostrarError: ReturnType<typeof vi.fn>;

  function configurar(opciones: {
    ajustes?: AjustesAplicacion;
    obtenerAjustes?: ReturnType<typeof vi.fn>;
    sincronizar?: ReturnType<typeof vi.fn>;
    olvidarCredencialesGitHub?: ReturnType<typeof vi.fn>;
    guardarCredencialesGitHub?: ReturnType<typeof vi.fn>;
  } = {}) {
    mostrarExito = vi.fn();
    mostrarError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: AjustesRepositoryPort,
          useValue: {
            obtener: opciones.obtenerAjustes ?? vi.fn().mockResolvedValue(opciones.ajustes ?? ajustes()),
            guardarCredencialesGitHub: opciones.guardarCredencialesGitHub ?? vi.fn().mockResolvedValue(undefined),
            olvidarCredencialesGitHub: opciones.olvidarCredencialesGitHub ?? vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SincronizarGithubUseCase,
          useValue: { sincronizar: opciones.sincronizar ?? vi.fn().mockResolvedValue({ tipo: 'completada', accion: 'nada' }) },
        },
        ConflictoSincronizacionEstadoService,
        { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarError } },
      ],
    });
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(ConfiguracionSincronizacionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('el campo del token está oculto (type="password") (FR-002, FR-037)', async () => {
    configurar();
    const fixture = await crearComponente();

    const input = (fixture.nativeElement as HTMLElement).querySelector('input[name="token"], #token, input.configuracion-sincronizacion__token');
    const tokenInput = (fixture.nativeElement as HTMLElement).querySelector('input[type="password"]');
    expect(tokenInput ?? input).toBeTruthy();
  });

  it('muestra una guía para crear un repositorio privado de datos y un token fine-grained', async () => {
    configurar();
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('privado');
    expect(texto.toLowerCase()).toContain('fine-grained');
  });

  it('mantiene abierta la configuración cuando no hay credenciales y comunica estado sin configurar', async () => {
    configurar();
    const fixture = await crearComponente();

    expect((fixture.nativeElement as HTMLElement).querySelector('details')?.open).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin configurar');
  });

  it('expone el estado de carga accesible mientras consulta los ajustes', () => {
    configurar({
      obtenerAjustes: vi.fn().mockImplementation(() => new Promise<AjustesAplicacion>(() => undefined)),
    });
    const fixture = TestBed.createComponent(ConfiguracionSincronizacionComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent).toContain('Cargando configuración');
  });

  it('pliega la configuración existente y muestra repositorio y fecha correcta persistida', async () => {
    configurar({
      ajustes: ajustes({
        tokenGitHub: 'secreto',
        repositorioGitHub: 'owner/datos',
        ultimaSincronizacionCorrecta: new Date('2026-10-20T12:34:00.000Z'),
      }),
    });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('details')?.open).toBe(false);
    expect(raiz.textContent).toContain('owner/datos');
    expect(raiz.textContent).toContain('Última sincronización correcta');
    expect(raiz.querySelector('input[type="password"]')).toBeTruthy();
    expect(raiz.textContent).not.toContain('secreto');
  });

  it('muestra los errores de repositorio y token junto a sus campos obligatorios', async () => {
    const guardarCredencialesGitHub = vi.fn();
    configurar({ guardarCredencialesGitHub });
    const fixture = await crearComponente();

    await fixture.componentInstance.guardarCredenciales();
    fixture.detectChanges();

    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelectorAll('.configuracion-sincronizacion__error-campo').length).toBe(2);
    expect(guardarCredencialesGitHub).not.toHaveBeenCalled();
  });

  it('el botón "Olvidar token" llama a olvidarCredencialesGitHub()', async () => {
    const olvidarCredencialesGitHub = vi.fn().mockResolvedValue(undefined);
    configurar({ ajustes: ajustes({ tokenGitHub: 'token-x', repositorioGitHub: 'owner/data' }), olvidarCredencialesGitHub });
    const fixture = await crearComponente();

    await fixture.componentInstance.olvidarToken();

    expect(olvidarCredencialesGitHub).toHaveBeenCalled();
    expect(mostrarExito).toHaveBeenCalled();
  });

  it('el botón de sincronizar llama al caso de uso y muestra un mensaje de éxito en español', async () => {
    const sincronizar = vi.fn().mockResolvedValue({ tipo: 'completada', accion: 'subir' });
    configurar({ ajustes: ajustes({ tokenGitHub: 'token-x', repositorioGitHub: 'owner/data' }), sincronizar });
    const fixture = await crearComponente();

    await fixture.componentInstance.sincronizarAhora();
    fixture.detectChanges();

    expect(sincronizar).toHaveBeenCalled();
    expect(mostrarExito).toHaveBeenCalledWith(expect.stringMatching(/sincroniza/i));
  });

  it('cuando el caso de uso devuelve un conflicto, navega a la pantalla de resolución', async () => {
    const sincronizar = vi.fn().mockResolvedValue({
      tipo: 'conflicto',
      opcionPorDefecto: 'conservar_remoto',
      datosRemotos: { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] },
      sha: 'sha-1',
    });
    configurar({ ajustes: ajustes({ tokenGitHub: 'token-x', repositorioGitHub: 'owner/data' }), sincronizar });
    const fixture = await crearComponente();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const estado = TestBed.inject(ConflictoSincronizacionEstadoService);

    await fixture.componentInstance.sincronizarAhora();
    fixture.detectChanges();

    expect(estado.conflictoActual()).toEqual({
      opcionPorDefecto: 'conservar_remoto',
      datosRemotos: { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] },
      sha: 'sha-1',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Conflicto pendiente de resolución');
    expect(navigateSpy).toHaveBeenCalledWith(['/sincronizacion/conflicto']);
  });

  it('muestra un mensaje de error en español si la sincronización falla', async () => {
    const sincronizar = vi.fn().mockRejectedValue(new Error('Sin conexión.'));
    configurar({ ajustes: ajustes({ tokenGitHub: 'token-x', repositorioGitHub: 'owner/data' }), sincronizar });
    const fixture = await crearComponente();

    await fixture.componentInstance.sincronizarAhora();
    fixture.detectChanges();

    expect(mostrarError).toHaveBeenCalledWith('Sin conexión.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Error de sincronización');
  });

  it('muestra un estado accesible de sincronización en curso y luego sincronizado', async () => {
    let completar: (valor: { tipo: 'completada'; accion: 'nada' }) => void = () => undefined;
    const sincronizar = vi.fn().mockImplementation(
      () =>
        new Promise<{ tipo: 'completada'; accion: 'nada' }>((resolve) => {
          completar = resolve;
        })
    );
    configurar({ ajustes: ajustes({ tokenGitHub: 'token-x', repositorioGitHub: 'owner/data' }), sincronizar });
    const fixture = await crearComponente();

    const peticion = fixture.componentInstance.sincronizarAhora();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent).toContain('Sincronizando');

    completar({ tipo: 'completada', accion: 'nada' });
    await peticion;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sincronizado');
  });
});
