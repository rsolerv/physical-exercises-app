import { describe, it, expect, beforeEach, vi } from 'vitest';
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

function simularMatchMedia(coincide: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: coincide,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
}

describe('ShellComponent (navegación)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideNoopAnimations(),
        // Puertos requeridos por las rutas de historias de usuario ya implementadas (p. ej. US1).
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue([]) } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
      ],
    });
  });

  it('arranca sin errores de enrutamiento y muestra la vista "Hoy" en la ruta raíz', async () => {
    const harness = await RouterTestingHarness.create('/');
    const fixture = TestBed.createComponent(ShellComponent);
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

  it('cada entrada de menú navega a una ruta real registrada (marcador de posición hasta que su historia la sustituya)', async () => {
    const harness = await RouterTestingHarness.create();
    for (const entrada of MENU_PRINCIPAL) {
      await harness.navigateByUrl(entrada.ruta);
      expect(harness.routeNativeElement).toBeTruthy();
    }
  });

  it('el menú lateral está cerrado por defecto en viewport móvil (FR-010)', () => {
    simularMatchMedia(false);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.menuAbierto()).toBe(false);
  });

  it('el menú lateral está abierto por defecto en viewport de escritorio (FR-010)', () => {
    simularMatchMedia(true);
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.menuAbierto()).toBe(true);
  });

  it('la entrada de menú de la ruta activa lleva un indicador adicional más allá de font-weight (aria-current)', async () => {
    simularMatchMedia(true);
    const harness = await RouterTestingHarness.create();
    const fixtureShell = TestBed.createComponent(ShellComponent);
    fixtureShell.detectChanges();

    await harness.navigateByUrl('/ejercicios');
    fixtureShell.detectChanges();
    await fixtureShell.whenStable();

    const enlaceActivo = (fixtureShell.nativeElement as HTMLElement).querySelector('.shell__enlace-activo');
    expect(enlaceActivo?.getAttribute('aria-current')).toBe('page');
  });
});
