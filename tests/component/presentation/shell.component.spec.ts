import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { RouterTestingHarness } from '@angular/router/testing';
import { ShellComponent } from '../../../src/app/presentation/compartido/shell/shell.component';
import { routes } from '../../../src/app/app.routes';
import { MENU_PRINCIPAL } from '../../../src/app/presentation/compartido/shell/menu-principal';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { PlanificacionRepositoryPort } from '../../../src/app/application/ports/planificacion-repository.port';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { GoogleAutorizacionPort } from '../../../src/app/application/ports/google-autorizacion.port';
import { GitHubSyncPort } from '../../../src/app/application/ports/github-sync.port';
import { ProveedorSincronizacionPort } from '../../../src/app/application/ports/proveedor-sincronizacion.port';
import { RepositorioComunPort } from '../../../src/app/application/ports/repositorio-comun.port';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import { SincronizarAlIniciarService } from '../../../src/app/presentation/sincronizacion/sincronizar-al-iniciar.service';

const anchoViewportOriginal = window.innerWidth;

function simularAnchoViewport(ancho: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: ancho });
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
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: anchoViewportOriginal });
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
        { provide: MatDialog, useValue: { open: vi.fn() } },
        {
          provide: RepositorioComunPort,
          useValue: {
            listarCategorias: vi.fn().mockResolvedValue([]),
            buscarEjercicios: vi.fn().mockResolvedValue([]),
            leerImagen: vi.fn(),
            existeEjercicioPorNombre: vi.fn(),
            subirEjercicio: vi.fn(),
          },
        },
        { provide: MensajeFeedbackService, useValue: { mostrarExito: vi.fn(), mostrarError: vi.fn() } },
        { provide: SincronizarAlIniciarService, useValue: { ejecutar: vi.fn().mockResolvedValue(undefined) } },
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
              ultimaVersionSincronizada: null,
              ultimaSincronizacionCorrecta: null,
              cambiosLocalesPendientes: false,
              catalogoPredefinidoCargado: true,
              metodoSincronizacion: null,
              cuentaGoogle: null,
            }),
          },
        },
        {
          provide: GoogleAutorizacionPort,
          useValue: {
            conectar: vi.fn().mockResolvedValue({ correo: 'raquel@example.com', nombre: 'Raquel' }),
            obtenerTokenAcceso: vi.fn().mockResolvedValue('test-token'),
            desconectar: vi.fn().mockResolvedValue(undefined),
          },
        },
        { provide: GitHubSyncPort, useValue: {} },
        {
          provide: ProveedorSincronizacionPort,
          useValue: { leerRemoto: vi.fn(), escribirRemoto: vi.fn(), leerImagen: vi.fn() },
        },
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

  it('muestra la navegación móvil principal y la acción destacada de alta', () => {
    simularAnchoViewport(375);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const raiz = fixture.nativeElement as HTMLElement;
    const enlaces = Array.from(raiz.querySelectorAll('.shell__barra-inferior a span')).map((enlace) =>
      enlace.textContent?.trim()
    );
    expect(enlaces).toEqual(['Hoy', 'Planificación', 'Buscar']);
    expect(raiz.querySelector('.shell__mas-toggle')?.textContent).toContain('Más');
    expect(raiz.querySelector('.shell__nuevo-ejercicio')?.getAttribute('aria-label')).toBe('Nuevo ejercicio');
    expect(raiz.textContent).not.toContain('Mis ejercicios');
  });

  it('abre Más como panel inferior y lo cierra al elegir una opción', async () => {
    simularAnchoViewport(375);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector('.shell__mas-toggle')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    const panel = document.querySelector('.shell__panel-mas');
    expect(panel?.textContent).toContain('Gestionar categorías');
    expect(panel?.textContent).toContain('Sincronización');
    expect(panel?.textContent).toContain('Versión');

    panel?.querySelector('a[href="/sincronizacion"]')?.dispatchEvent(new Event('click'));
    await fixture.whenStable();
    fixture.detectChanges();
    await vi.waitFor(() => expect(document.querySelector('.shell__panel-mas')).toBeNull());
  });

  it('muestra un riel lateral con etiquetas accesibles en tablet', () => {
    simularAnchoViewport(768);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const riel = (fixture.nativeElement as HTMLElement).querySelector('.shell__riel-lateral');
    expect(riel).not.toBeNull();
    expect(riel?.querySelector('a[aria-label="Buscar"]')).not.toBeNull();
    expect(riel?.querySelector('a[aria-label="Gestionar categorías"]')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.shell__barra-inferior')).toBeNull();
  });

  it('agrupa la navegación de escritorio y no ofrece Mis ejercicios', () => {
    simularAnchoViewport(1366);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('.shell__grupo-entrenar')?.textContent).toContain('Hoy');
    expect(raiz.querySelector('.shell__grupo-biblioteca')?.textContent).toContain('Buscar');
    expect(raiz.querySelector('.shell__grupo-sistema')?.textContent).toContain('Sincronización');
    expect(raiz.textContent).not.toContain('Mis ejercicios');
    expect(raiz.querySelector('.shell__nuevo-ejercicio')?.getAttribute('aria-label')).toBe('Nuevo ejercicio');
  });

  it('cada entrada de menú navega a una ruta funcional registrada', async () => {
    const harness = await RouterTestingHarness.create();
    for (const entrada of MENU_PRINCIPAL) {
      await harness.navigateByUrl(entrada.ruta);
      expect(harness.routeNativeElement).toBeTruthy();
    }
  });

  it('muestra la barra de navegación inferior en viewport móvil', () => {
    simularAnchoViewport(599);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.esMovil()).toBe(true);
    expect(fixture.nativeElement.querySelector('.shell__barra-inferior')).not.toBeNull();
  });

  it('usa el menú agrupado en viewport de escritorio', () => {
    simularAnchoViewport(1366);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.esMovil()).toBe(false);
    expect(fixture.nativeElement.querySelector('.shell__menu-escritorio')).not.toBeNull();
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

  it('usa navegación móvil, riel en tablet y menú fijo en escritorio', () => {
    simularAnchoViewport(599);
    const fixtureMovil = TestBed.createComponent(ShellComponent);
    fixtureMovil.detectChanges();
    expect(fixtureMovil.nativeElement.querySelector('.shell__barra-inferior')).not.toBeNull();

    simularAnchoViewport(768);
    const fixtureTablet = TestBed.createComponent(ShellComponent);
    fixtureTablet.detectChanges();
    expect(fixtureTablet.nativeElement.querySelector('.shell__riel-lateral')).not.toBeNull();

    simularAnchoViewport(1280);
    const fixtureEscritorio = TestBed.createComponent(ShellComponent);
    fixtureEscritorio.detectChanges();
    expect(fixtureEscritorio.nativeElement.querySelector('.shell__menu-escritorio')).not.toBeNull();
  });

  it('adapta el modo al cambiar el ancho de ventana (FR-026)', () => {
    simularAnchoViewport(599);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.esMovil()).toBe(true);

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 600 });
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();

    expect(fixture.componentInstance.esMovil()).toBe(false);
    expect(fixture.componentInstance.esRiel()).toBe(true);
  });

  it.each([320, 359])('permite que el título de la cabecera se ajuste a %i px (SC-011)', (ancho) => {
    simularAnchoViewport(ancho);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const titulo = fixture.nativeElement.querySelector('.shell__barra-superior > span') as HTMLSpanElement | null;
    expect(titulo).not.toBeNull();
    if (!titulo) throw new Error('No se ha renderizado el título de la cabecera.');

    document.body.appendChild(fixture.nativeElement);
    try {
      const estilos = window.getComputedStyle(titulo);
      expect(estilos.minWidth).toBe('0px');
      expect(estilos.overflow).toBe('hidden');
      expect(estilos.textOverflow).toBe('ellipsis');
      expect(estilos.whiteSpace).toBe('nowrap');
    } finally {
      fixture.nativeElement.remove();
    }
  });

  it('cierra el panel Más después de elegir una sección (FR-047)', async () => {
    simularAnchoViewport(599);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.shell__mas-toggle')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();
    document.querySelector('.shell__panel-mas a[href="/sincronizacion"]')?.dispatchEvent(new Event('click'));
    await fixture.whenStable();

    await vi.waitFor(() => expect(document.querySelector('.shell__panel-mas')).toBeNull());
  });
});
