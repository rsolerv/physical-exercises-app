import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RouterTestingHarness } from '@angular/router/testing';
import { ShellComponent } from '../../../src/app/presentation/compartido/shell/shell.component';
import { routes } from '../../../src/app/app.routes';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { GestionarEjercicioUseCase } from '../../../src/app/application/casos-uso/gestionar-ejercicio.use-case';
import { GestionarCategoriaUseCase } from '../../../src/app/application/casos-uso/gestionar-categoria.use-case';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';

describe('Integración de rutas de biblioteca (US1)', () => {
  function configurar() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideNoopAnimations(),
        {
          provide: EjercicioRepositoryPort,
          useValue: {
            listarTodos: vi.fn().mockResolvedValue([]),
            obtenerPorId: vi.fn().mockResolvedValue({
              id: 'ej-1',
              nombre: 'Sentadilla',
              descripcion: 'Flexionar rodillas.',
              categoriaIds: ['cat-1'],
              enlaces: [],
              imagenes: [],
            }),
          },
        },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
        { provide: GestionarEjercicioUseCase, useValue: { crear: vi.fn(), actualizar: vi.fn(), eliminar: vi.fn() } },
        { provide: GestionarCategoriaUseCase, useValue: { crear: vi.fn(), actualizar: vi.fn(), eliminar: vi.fn() } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito: vi.fn(), mostrarError: vi.fn() } },
      ],
    });
  }

  it('la ruta antigua de biblioteca redirige a Buscar sin mostrar Mis ejercicios', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/ejercicios');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('.busqueda-ejercicios')).toBeTruthy();
    expect(harness.routeNativeElement?.querySelector('.biblioteca-listado')).toBeFalsy();
    expect(harness.routeNativeElement?.textContent).not.toContain('Mis ejercicios');
  });

  it('la gestión de categorías muestra título y acción de alta', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/ejercicios/categorias');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('app-cabecera-pagina h1')?.textContent).toContain('Categorías');
    expect(harness.routeNativeElement?.textContent).toContain('Añadir categoría');
  });

  it('el formulario de alta muestra su título y acción principal', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/ejercicios/nuevo');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('app-cabecera-pagina h1')?.textContent).toContain('Nuevo ejercicio');
    expect(harness.routeNativeElement?.textContent).toContain('Guardar ejercicio');
  });

  it('el formulario de edición muestra su título y acción principal', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/ejercicios/ej-1/editar');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('app-cabecera-pagina h1')?.textContent).toContain('Editar ejercicio');
    expect(harness.routeNativeElement?.textContent).toContain('Guardar ejercicio');
  });

  it('el menú del shell resalta Buscar al entrar desde la ruta antigua de biblioteca', async () => {
    configurar();
    const harness = await RouterTestingHarness.create();
    const fixtureShell = TestBed.createComponent(ShellComponent);
    fixtureShell.detectChanges();

    await harness.navigateByUrl('/ejercicios');
    fixtureShell.detectChanges();
    await fixtureShell.whenStable();

    const enlaceActivo = (fixtureShell.nativeElement as HTMLElement).querySelector('.shell__enlace-activo');
    expect(`${enlaceActivo?.textContent} ${enlaceActivo?.getAttribute('aria-label')}`).toContain('Buscar');
  });
});
