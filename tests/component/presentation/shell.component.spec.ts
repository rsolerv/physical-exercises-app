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
    expect(fixture.nativeElement.querySelector('.pagina-en-construccion')).toBeTruthy();
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
});
