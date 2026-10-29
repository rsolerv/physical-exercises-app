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
import { GestionarEjercicioUseCase } from '../../../src/app/application/casos-uso/gestionar-ejercicio.use-case';
import { ConsultarPlanificacionUseCase } from '../../../src/app/application/casos-uso/consultar-planificacion.use-case';
import { GestionarProgresoDiarioUseCase } from '../../../src/app/application/casos-uso/gestionar-progreso-diario.use-case';
import { SubirEjercicioComunUseCase } from '../../../src/app/application/casos-uso/subir-ejercicio-comun.use-case';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

const ejercicioConVideo: Ejercicio = {
  id: 'ej-1',
  nombre: 'Sentadilla',
  descripcion: 'Flexionar rodillas',
  categoriaIds: ['cat-1'],
  enlaces: [{ tipo: 'youtube', url: 'https://youtu.be/abc123' }],
  imagenes: [],
  subidoRepositorioComun: false,
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
        { provide: ConsultarPlanificacionUseCase, useValue: { obtenerDeHoy: vi.fn().mockResolvedValue(null) } },
        { provide: ProgresoDiarioRepositoryPort, useValue: { obtenerPorFecha: vi.fn().mockResolvedValue([]) } },
        { provide: GestionarProgresoDiarioUseCase, useValue: { marcar: vi.fn(), restaurarCambio: vi.fn() } },
        { provide: AjustesRepositoryPort, useValue: { marcarCambiosLocalesPendientes: vi.fn().mockResolvedValue(undefined) } },
        { provide: GestionarEjercicioUseCase, useValue: { eliminar: vi.fn() } },
        { provide: SubirEjercicioComunUseCase, useValue: { puedeOfrecerSubida: vi.fn().mockResolvedValue(false) } },
        {
          provide: MensajeFeedbackService,
          useValue: { mostrarExito: vi.fn(), mostrarExitoConAccion: vi.fn(), mostrarError: vi.fn() },
        },
      ],
    });
  }

  it('navegar a la ruta de búsqueda muestra el buscador', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/buscar');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('.busqueda-ejercicios')).toBeTruthy();
    expect(harness.routeNativeElement?.querySelector('app-cabecera-pagina h1')?.textContent).toContain('Buscar ejercicios');
  });

  it('abrir un ejercicio con vídeo de YouTube muestra el reproductor embebido dentro de la ficha', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/ejercicios/ej-1');
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(harness.routeNativeElement?.querySelector('app-youtube-embed')).toBeTruthy();
    expect(harness.routeNativeElement?.querySelector('app-cabecera-pagina h1')?.textContent).toContain('Sentadilla');
    expect(harness.routeNativeElement?.textContent).toContain('Editar');
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('[aria-label="Reproducir vídeo de YouTube"]')?.click();
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('iframe')?.getAttribute('src')).toContain('autoplay=1');
  });

  it('abrir un resultado de Buscar permite acceder a editar y eliminar desde su ficha', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/buscar');
    await harness.fixture.whenStable();
    harness.detectChanges();

    const resultado = harness.routeNativeElement?.querySelector<HTMLAnchorElement>('.busqueda-ejercicios__tarjeta');
    const rutaResultado = resultado?.getAttribute('href');
    expect(rutaResultado).toContain('/ejercicios/ej-1');
    if (!rutaResultado) throw new Error('El resultado debe enlazar con la ficha del ejercicio.');
    await harness.navigateByUrl(rutaResultado);
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('app-ejercicio-ficha');
    expect(harness.routeNativeElement?.textContent).toContain('Editar');
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('[aria-label="Más acciones del ejercicio"]')?.click();
    await harness.fixture.whenStable();
    expect(document.body.textContent).toContain('Eliminar');
  });
});
