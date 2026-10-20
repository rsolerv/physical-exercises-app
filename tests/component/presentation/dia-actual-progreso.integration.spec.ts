import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DiaActualComponent } from '../../../src/app/presentation/planificacion-semanal/dia-actual/dia-actual.component';
import { ConsultarPlanificacionUseCase } from '../../../src/app/application/casos-uso/consultar-planificacion.use-case';
import { GestionarProgresoDiarioUseCase } from '../../../src/app/application/casos-uso/gestionar-progreso-diario.use-case';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
import { GestionarEjercicioUseCase } from '../../../src/app/application/casos-uso/gestionar-ejercicio.use-case';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import { EjercicioFichaComponent } from '../../../src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component';
import { routes } from '../../../src/app/app.routes';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';
import { diaSemanaDeFecha } from '../../../src/app/domain/planificacion/fecha-semana';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

function ejercicio(id: string, nombre: string): Ejercicio {
  return { id, nombre, descripcion: 'desc', categoriaIds: ['cat-1'], enlaces: [], imagenes: [] };
}

describe('Integración del progreso diario dentro de la vista "hoy" (US4)', () => {
  it('marcar un ejercicio como realizado desde la vista "hoy" actualiza el indicador de progreso sin navegar', async () => {
    const hoy = diaSemanaDeFecha(new Date());
    const dias = crearDiasVacios();
    const diaHoy = dias.find((d) => d.diaSemana === hoy);
    if (diaHoy) diaHoy.ejercicioIds = ['ej-1', 'ej-2'];
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', fechaInicio: '2020-01-06', dias };

    let realizado = false;
    const marcar = vi.fn().mockImplementation(() => {
      realizado = true;
      return Promise.resolve({ fecha: new Date(), ejercicioId: 'ej-1', realizadoAnterior: false });
    });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ConsultarPlanificacionUseCase, useValue: { obtenerDeHoy: vi.fn().mockResolvedValue(planificacion) } },
        {
          provide: EjercicioRepositoryPort,
          useValue: { listarTodos: vi.fn().mockResolvedValue([ejercicio('ej-1', 'Sentadilla'), ejercicio('ej-2', 'Plancha')]) },
        },
        {
          provide: ProgresoDiarioRepositoryPort,
          useValue: { obtenerPorFecha: vi.fn().mockImplementation(() => Promise.resolve(realizado ? [{ fecha: 'x', ejercicioId: 'ej-1', realizado: true }] : [])) },
        },
        {
          provide: GestionarProgresoDiarioUseCase,
          useValue: { marcar, restaurarCambio: vi.fn().mockResolvedValue(undefined) },
        },
        { provide: MensajeFeedbackService, useValue: { mostrarExitoConAccion: vi.fn(), mostrarError: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(DiaActualComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('0%');

    const casilla = (fixture.nativeElement as HTMLElement).querySelector('mat-checkbox input') as HTMLInputElement;
    casilla.click();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(marcar).toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('50%');
  });

  it('abre la ficha del ejercicio seleccionado sin activar el control de progreso', async () => {
    const hoy = diaSemanaDeFecha(new Date());
    const dias = crearDiasVacios();
    const diaHoy = dias.find((d) => d.diaSemana === hoy);
    if (diaHoy) diaHoy.ejercicioIds = ['ej-1'];
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', fechaInicio: '2020-01-06', dias };
    const sentadilla = { ...ejercicio('ej-1', 'Sentadilla'), descripcion: 'Flexionar las rodillas.' };
    const marcar = vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideNoopAnimations(),
        { provide: ConsultarPlanificacionUseCase, useValue: { obtenerDeHoy: vi.fn().mockResolvedValue(planificacion) } },
        {
          provide: EjercicioRepositoryPort,
          useValue: {
            listarTodos: vi.fn().mockResolvedValue([sentadilla]),
            obtenerPorId: vi.fn().mockResolvedValue(sentadilla),
          },
        },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([{ id: 'cat-1', nombre: 'Piernas', esGenerica: false }]) } },
        { provide: ProgresoDiarioRepositoryPort, useValue: { obtenerPorFecha: vi.fn().mockResolvedValue([]) } },
        {
          provide: GestionarProgresoDiarioUseCase,
          useValue: {
            marcar: vi.fn().mockResolvedValue({ fecha: new Date(), ejercicioId: 'ej-1', realizadoAnterior: false }),
            restaurarCambio: vi.fn().mockResolvedValue(undefined),
          },
        },
        { provide: GestionarEjercicioUseCase, useValue: { eliminar: vi.fn().mockResolvedValue(undefined) } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito: vi.fn(), mostrarError: vi.fn() } },
      ],
    });

    const harness = await RouterTestingHarness.create('/inicio');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    const enlaceFicha = harness.routeNativeElement?.querySelector('a[href="/ejercicios/ej-1"]') as HTMLAnchorElement | null;
    expect(enlaceFicha).not.toBeNull();
    expect(enlaceFicha?.textContent).toContain('Consultar');
    expect(enlaceFicha?.closest('mat-checkbox')).toBeNull();

    enlaceFicha?.click();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(EjercicioFichaComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Sentadilla');
    expect(harness.routeNativeElement?.textContent).toContain('Flexionar las rodillas.');
    expect(marcar).not.toHaveBeenCalled();
  });
});
