import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../src/app/app.routes';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { PlanificacionRepositoryPort } from '../../../src/app/application/ports/planificacion-repository.port';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
import { GestionarProgresoDiarioUseCase } from '../../../src/app/application/casos-uso/gestionar-progreso-diario.use-case';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { GestionarEjercicioUseCase } from '../../../src/app/application/casos-uso/gestionar-ejercicio.use-case';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import { EjercicioFichaComponent } from '../../../src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';

describe('Integración de la pantalla de inicio y de las rutas de planificación (US3)', () => {
  function configurar() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideNoopAnimations(),
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue([]) } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
        { provide: AjustesRepositoryPort, useValue: { marcarCambiosLocalesPendientes: vi.fn().mockResolvedValue(undefined) } },
        {
          provide: PlanificacionRepositoryPort,
          useValue: {
            listarTodas: vi.fn().mockResolvedValue([]),
            obtenerActiva: vi.fn().mockResolvedValue(null),
            obtenerPorId: vi.fn().mockResolvedValue(null),
          },
        },
        { provide: ProgresoDiarioRepositoryPort, useValue: { obtenerPorFecha: vi.fn().mockResolvedValue([]) } },
        { provide: GestionarProgresoDiarioUseCase, useValue: { marcar: vi.fn(), restaurarCambio: vi.fn() } },
      ],
    });
  }

  it('la ruta raíz "/" muestra la vista "hoy" sin navegación adicional (FR-008)', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('.dia-actual')).toBeTruthy();
    expect(harness.routeNativeElement?.querySelector('app-cabecera-pagina h1')?.textContent).toContain('Hoy');
    expect(harness.routeNativeElement?.textContent).toContain('Ver planificación semanal');
  });

  it('navegar al calendario de planificación funciona desde el menú', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/planificacion');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('.calendario-semanal')).toBeTruthy();
    expect(harness.routeNativeElement?.querySelector('app-cabecera-pagina h1')?.textContent).toContain('Planificación semanal');
    expect(harness.routeNativeElement?.textContent).toContain('Nueva planificación');
  });

  it('navegar al constructor de planificación funciona desde el calendario', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/planificacion/nueva');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('.planificacion-constructor')).toBeTruthy();
    expect(harness.routeNativeElement?.querySelector('app-cabecera-pagina h1')).toBeTruthy();
    expect(harness.routeNativeElement?.textContent).toContain('Volver');
  });

  it('abre la ficha correspondiente a cada ejercicio de días distintos desde la planificación semanal', async () => {
    const dias = crearDiasVacios();
    dias[0].ejercicioIds = ['ej-1'];
    dias[2].ejercicioIds = ['ej-2'];
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', dias };
    const ejercicios: Ejercicio[] = [
      { id: 'ej-1', nombre: 'Sentadilla', descripcion: 'Flexionar las rodillas.', categoriaIds: ['cat-1'], enlaces: [], imagenes: [] },
      { id: 'ej-2', nombre: 'Plancha', descripcion: 'Mantener el tronco alineado.', categoriaIds: ['cat-1'], enlaces: [], imagenes: [] },
    ];
    const ejercicioPorId = new Map(ejercicios.map((ejercicio) => [ejercicio.id, ejercicio]));
    const obtenerPorId = vi.fn((id: string) => Promise.resolve(ejercicioPorId.get(id) ?? null));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideNoopAnimations(),
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue(ejercicios), obtenerPorId } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
        { provide: AjustesRepositoryPort, useValue: { marcarCambiosLocalesPendientes: vi.fn().mockResolvedValue(undefined) } },
        { provide: GestionarEjercicioUseCase, useValue: { eliminar: vi.fn().mockResolvedValue(undefined) } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito: vi.fn(), mostrarError: vi.fn() } },
        {
          provide: PlanificacionRepositoryPort,
          useValue: { listarTodas: vi.fn().mockResolvedValue([planificacion]), obtenerActiva: vi.fn().mockResolvedValue(planificacion) },
        },
        { provide: ProgresoDiarioRepositoryPort, useValue: { obtenerPorFecha: vi.fn().mockResolvedValue([]) } },
        { provide: GestionarProgresoDiarioUseCase, useValue: { marcar: vi.fn(), restaurarCambio: vi.fn() } },
      ],
    });

    const harness = await RouterTestingHarness.create('/planificacion');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    for (const ejercicio of ejercicios) {
      const enlace = harness.routeNativeElement?.querySelector<HTMLAnchorElement>(`a[href="/ejercicios/${ejercicio.id}"]`);
      expect(enlace).not.toBeNull();
      expect(enlace?.textContent).toContain(ejercicio.nombre);
      expect(enlace?.textContent).not.toContain(ejercicio.id);
      expect(enlace?.getAttribute('aria-label')).toBe(`Abrir la ficha de ${ejercicio.nombre}`);

      enlace?.click();
      await harness.fixture.whenStable();
      harness.fixture.detectChanges();

      expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(EjercicioFichaComponent);
      expect(harness.routeNativeElement?.textContent).toContain(ejercicio.nombre);
      expect(harness.routeNativeElement?.textContent).toContain(ejercicio.descripcion);
      expect(obtenerPorId).toHaveBeenLastCalledWith(ejercicio.id);

      await harness.navigateByUrl('/planificacion');
      await harness.fixture.whenStable();
      harness.fixture.detectChanges();
    }
  });
});
