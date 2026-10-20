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

function simularAnchoViewport(ancho: number): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 599.99px)' ? ancho <= 599 : ancho > 599,
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

  it('muestra exactamente las seis opciones de navegación y acción requeridas', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    expect(MENU_PRINCIPAL.map((entrada) => entrada.etiqueta)).toEqual([
      'Hoy',
      'Buscar',
      'Planificación',
      'Sincronización',
      'Nuevo ejercicio',
      'Gestionar categorías',
    ]);
    const textoMenu = (fixture.nativeElement as HTMLElement).querySelector('mat-sidenav')?.textContent ?? '';
    expect(textoMenu).not.toContain('Mis ejercicios');
    expect(textoMenu).toContain('Nuevo ejercicio');
    expect(textoMenu).toContain('Gestionar categorías');
  });

  it('cada entrada de menú navega a una ruta funcional registrada', async () => {
    const harness = await RouterTestingHarness.create();
    for (const entrada of MENU_PRINCIPAL) {
      await harness.navigateByUrl(entrada.ruta);
      expect(harness.routeNativeElement).toBeTruthy();
    }
  });

  it('el menú lateral está cerrado por defecto en viewport móvil (FR-010)', () => {
    simularAnchoViewport(599);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.menuAbierto()).toBe(false);
  });

  it('el menú lateral está abierto por defecto en viewport de escritorio (FR-010)', () => {
    simularAnchoViewport(600);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.menuAbierto()).toBe(true);
  });

  it('la entrada de menú de la ruta activa lleva un indicador adicional más allá de font-weight (aria-current)', async () => {
    simularAnchoViewport(600);
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
    simularAnchoViewport(599);
    const fixtureMovil = TestBed.createComponent(ShellComponent);
    fixtureMovil.detectChanges();
    expect(fixtureMovil.componentInstance.menuLateral()?.mode).toBe('over');

    simularAnchoViewport(600);
    const fixtureEscritorio = TestBed.createComponent(ShellComponent);
    fixtureEscritorio.detectChanges();
    expect(fixtureEscritorio.componentInstance.menuLateral()?.mode).toBe('side');
  });

  it('adapta el modo al cambiar el ancho de ventana entre móvil y escritorio (FR-026)', () => {
    let ancho = 599;
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query === '(max-width: 599.99px)' ? ancho <= 599 : ancho > 599,
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

    ancho = 600;
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();

    expect(fixture.componentInstance.menuLateral()?.mode).toBe('side');
    expect(fixture.componentInstance.menuAbierto()).toBe(true);
  });

  it('cierra el menú superpuesto después de elegir una sección (FR-047)', async () => {
    simularAnchoViewport(599);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const sidenav = fixture.componentInstance.menuLateral();
    await sidenav?.open();
    fixture.nativeElement.querySelector('a[mat-list-item]')?.dispatchEvent(new Event('click'));
    await fixture.whenStable();

    expect(sidenav?.opened).toBe(false);
  });
});
