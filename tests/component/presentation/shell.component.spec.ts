import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RouterTestingHarness } from '@angular/router/testing';
import { ShellComponent } from '../../../src/app/presentation/compartido/shell/shell.component';
import { routes } from '../../../src/app/app.routes';
import { MENU_PRINCIPAL } from '../../../src/app/presentation/compartido/shell/menu-principal';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { PlanificacionRepositoryPort } from '../../../src/app/application/ports/planificacion-repository.port';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { GitHubSyncPort } from '../../../src/app/application/ports/github-sync.port';

function simularMatchMedia(esMovil: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 599px)' ? esMovil : !esMovil,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
}

describe('ShellComponent (navegación)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideNoopAnimations(),
        // Puertos requeridos por las rutas de historias de usuario ya implementadas (p. ej. US1).
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue([]) } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
        {
          provide: PlanificacionRepositoryPort,
          useValue: {
            listarTodas: vi.fn().mockResolvedValue([]),
            obtenerActiva: vi.fn().mockResolvedValue(null),
            obtenerPorId: vi.fn().mockResolvedValue(null),
          },
        },
        { provide: ProgresoDiarioRepositoryPort, useValue: { obtenerPorFecha: vi.fn().mockResolvedValue([]) } },
        {
          provide: AjustesRepositoryPort,
          useValue: {
            obtener: vi.fn().mockResolvedValue({
              tokenGitHub: null,
              repositorioGitHub: null,
              ultimoShaSincronizado: null,
              cambiosLocalesPendientes: false,
              catalogoPredefinidoCargado: true,
            }),
          },
        },
        { provide: GitHubSyncPort, useValue: {} },
      ],
    });
  });

  it('arranca sin errores de enrutamiento y muestra la vista "Hoy" en la ruta raíz', async () => {
    const harness = await RouterTestingHarness.create('/');
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(harness).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-estado-vacio')).toBeTruthy();
  });

  it('muestra una entrada de menú por cada historia de usuario, en español', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const textoMenu = (fixture.nativeElement as HTMLElement).textContent ?? '';
    for (const entrada of MENU_PRINCIPAL) {
      expect(textoMenu).toContain(entrada.etiqueta);
    }
  });

  it('cada entrada de menú navega a una ruta funcional registrada', async () => {
    const harness = await RouterTestingHarness.create();
    for (const entrada of MENU_PRINCIPAL) {
      await harness.navigateByUrl(entrada.ruta);
      expect(harness.routeNativeElement).toBeTruthy();
    }
  });

  it('el menú lateral está cerrado por defecto en viewport móvil (FR-010)', () => {
    simularMatchMedia(true);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.menuAbierto()).toBe(false);
  });

  it('el menú lateral está abierto por defecto en viewport de escritorio (FR-010)', () => {
    simularMatchMedia(false);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.menuAbierto()).toBe(true);
  });

  it('la entrada de menú de la ruta activa lleva un indicador adicional más allá de font-weight (aria-current)', async () => {
    simularMatchMedia(false);
    const harness = await RouterTestingHarness.create();
    const fixtureShell = TestBed.createComponent(ShellComponent);
    fixtureShell.detectChanges();

    await harness.navigateByUrl('/ejercicios');
    fixtureShell.detectChanges();
    await fixtureShell.whenStable();

    const enlaceActivo = (fixtureShell.nativeElement as HTMLElement).querySelector('.shell__enlace-activo');
    expect(enlaceActivo?.getAttribute('aria-current')).toBe('page');
  });

  it('usa una superposición en móvil hasta 599 px y un panel lateral desde 600 px (FR-047)', () => {
    simularMatchMedia(true);
    const fixtureMovil = TestBed.createComponent(ShellComponent);
    fixtureMovil.detectChanges();
    expect(fixtureMovil.componentInstance.menuLateral()?.mode).toBe('over');

    simularMatchMedia(false);
    const fixtureEscritorio = TestBed.createComponent(ShellComponent);
    fixtureEscritorio.detectChanges();
    expect(fixtureEscritorio.componentInstance.menuLateral()?.mode).toBe('side');
  });

  it('adapta el modo al cambiar el ancho de ventana entre móvil y escritorio (FR-026)', () => {
    let esMovil = true;
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query === '(max-width: 599px)' ? esMovil : !esMovil,
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.menuLateral()?.mode).toBe('over');

    esMovil = false;
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();

    expect(fixture.componentInstance.menuLateral()?.mode).toBe('side');
    expect(fixture.componentInstance.menuAbierto()).toBe(true);
  });

  it('cierra el menú superpuesto después de elegir una sección (FR-047)', async () => {
    simularMatchMedia(true);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const sidenav = fixture.componentInstance.menuLateral();
    await sidenav?.open();
    fixture.nativeElement.querySelector('a[mat-list-item]')?.dispatchEvent(new Event('click'));
    fixture.nativeElement.querySelector('a[mat-list-item]')?.dispatchEvent(new Event('click'));
    await fixture.whenStable();

    expect(sidenav?.opened).toBe(false);
  });
});
