import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DiaActualComponent } from '../../../src/app/presentation/planificacion-semanal/dia-actual/dia-actual.component';
import { ConsultarPlanificacionUseCase } from '../../../src/app/application/casos-uso/consultar-planificacion.use-case';
import { GestionarProgresoDiarioUseCase } from '../../../src/app/application/casos-uso/gestionar-progreso-diario.use-case';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
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
      return Promise.resolve();
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
        { provide: GestionarProgresoDiarioUseCase, useValue: { marcar } },
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
});
