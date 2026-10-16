import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ConsultarPlanificacionUseCase } from '../../../src/app/application/casos-uso/consultar-planificacion.use-case';
import { PlanificacionRepositoryPort } from '../../../src/app/application/ports/planificacion-repository.port';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';

function planificacionConEjercicios(): Planificacion {
  const dias = crearDiasVacios();
  dias[0].ejercicioIds = ['ej-1', 'ej-2']; // lunes
  dias[2].ejercicioIds = ['ej-2', 'ej-3']; // miércoles
  return { id: 'plan-1', nombre: 'Semana', fechaInicio: '2026-10-12', dias };
}

describe('ConsultarPlanificacionUseCase', () => {
  function configurar(repo: Partial<PlanificacionRepositoryPort>) {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: PlanificacionRepositoryPort, useValue: repo }],
    });
    return TestBed.inject(ConsultarPlanificacionUseCase);
  }

  it('obtiene la planificación de hoy', async () => {
    const obtenerActiva = vi.fn().mockResolvedValue(planificacionConEjercicios());
    const caso = configurar({ obtenerActiva });

    const resultado = await caso.obtenerDeHoy(new Date('2026-10-14'));

    expect(obtenerActiva).toHaveBeenCalledWith(new Date('2026-10-14'));
    expect(resultado?.nombre).toBe('Semana');
  });

  it('devuelve null cuando no hay planificación activa hoy (CL2)', async () => {
    const obtenerActiva = vi.fn().mockResolvedValue(null);
    const caso = configurar({ obtenerActiva });

    const resultado = await caso.obtenerDeHoy(new Date('2026-10-14'));

    expect(resultado).toBeNull();
  });

  it('obtiene la planificación activa para una fecha de un día concreto distinto de hoy', async () => {
    const obtenerActiva = vi.fn().mockResolvedValue(planificacionConEjercicios());
    const caso = configurar({ obtenerActiva });

    await caso.obtenerDeFecha(new Date('2026-10-16'));

    expect(obtenerActiva).toHaveBeenCalledWith(new Date('2026-10-16'));
  });

  it('obtiene los ejercicios de un día concreto de la planificación', () => {
    const caso = configurar({});
    const ejercicios = caso.obtenerEjerciciosDelDia(planificacionConEjercicios(), 'lunes');
    expect(ejercicios).toEqual(['ej-1', 'ej-2']);
  });

  it('obtiene todos los ejercicios de la planificación, sin duplicados y con independencia del día (FR-023)', async () => {
    const obtenerPorId = vi.fn().mockResolvedValue(planificacionConEjercicios());
    const caso = configurar({ obtenerPorId });

    const ejercicios = await caso.obtenerTodosLosEjercicios('plan-1');

    expect(ejercicios.sort()).toEqual(['ej-1', 'ej-2', 'ej-3']);
  });

  it('obtenerTodosLosEjercicios devuelve una lista vacía si la planificación no existe', async () => {
    const obtenerPorId = vi.fn().mockResolvedValue(null);
    const caso = configurar({ obtenerPorId });

    const ejercicios = await caso.obtenerTodosLosEjercicios('no-existe');

    expect(ejercicios).toEqual([]);
  });
});
