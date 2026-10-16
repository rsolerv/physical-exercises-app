import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../src/app/app.routes';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

const ejercicioConVideo: Ejercicio = {
  id: 'ej-1',
  nombre: 'Sentadilla',
  descripcion: 'Flexionar rodillas',
  categoriaIds: ['cat-1'],
  enlaces: [{ tipo: 'youtube', url: 'https://youtu.be/abc123' }],
  imagenes: [],
};

describe('Integración de rutas de búsqueda y componentes embebidos (US2)', () => {
  function configurar() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideNoopAnimations(),
        {
          provide: EjercicioRepositoryPort,
          useValue: {
            listarTodos: vi.fn().mockResolvedValue([ejercicioConVideo]),
            obtenerPorId: vi.fn().mockResolvedValue(ejercicioConVideo),
          },
        },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
        { provide: AjustesRepositoryPort, useValue: { marcarCambiosLocalesPendientes: vi.fn().mockResolvedValue(undefined) } },
      ],
    });
  }

  it('navegar a la ruta de búsqueda muestra el buscador', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/buscar');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('.busqueda-ejercicios')).toBeTruthy();
  });

  it('abrir un ejercicio con vídeo de YouTube muestra el reproductor embebido dentro de la ficha', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/ejercicios/ej-1');
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(harness.routeNativeElement?.querySelector('app-youtube-embed')).toBeTruthy();
  });
});
