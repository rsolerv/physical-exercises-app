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

describe('Integración de rutas de biblioteca (US1)', () => {
  function configurar() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideNoopAnimations(),
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue([]) } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
      ],
    });
  }

  it('navegar a la ruta de biblioteca muestra el listado de ejercicios', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/ejercicios');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('.biblioteca-listado')).toBeTruthy();
  });

  it('el menú del shell resalta la entrada activa al navegar a la biblioteca', async () => {
    configurar();
    const harness = await RouterTestingHarness.create();
    const fixtureShell = TestBed.createComponent(ShellComponent);
    fixtureShell.detectChanges();

    await harness.navigateByUrl('/ejercicios');
    fixtureShell.detectChanges();
    await fixtureShell.whenStable();

    const enlaceActivo = (fixtureShell.nativeElement as HTMLElement).querySelector('.shell__enlace-activo');
    expect(enlaceActivo?.textContent).toContain('Mis ejercicios');
  });
});
