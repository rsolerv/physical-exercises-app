import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { GestionarProgresoDiarioUseCase } from '../../../src/app/application/casos-uso/gestionar-progreso-diario.use-case';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
import { ConsultarPlanificacionUseCase } from '../../../src/app/application/casos-uso/consultar-planificacion.use-case';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';

describe('GestionarProgresoDiarioUseCase', () => {
  function configurar(opciones: {
    marcar?: ReturnType<typeof vi.fn>;
    obtenerPorFecha?: ReturnType<typeof vi.fn>;
    obtenerDeFecha?: ReturnType<typeof vi.fn>;
  }) {
    const marcarCambiosLocalesPendientes = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ProgresoDiarioRepositoryPort,
          useValue: {
            marcar: opciones.marcar ?? vi.fn().mockResolvedValue(undefined),
            obtenerPorFecha: opciones.obtenerPorFecha ?? vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ConsultarPlanificacionUseCase,
          useValue: {
            obtenerDeFecha: opciones.obtenerDeFecha ?? vi.fn().mockResolvedValue(null),
            obtenerEjerciciosDelDia: (planificacion: Planificacion, dia: string) =>
              planificacion.dias.find((d) => d.diaSemana === dia)?.ejercicioIds ?? [],
          },
        },
        { provide: AjustesRepositoryPort, useValue: { marcarCambiosLocalesPendientes } },
      ],
    });
    return { caso: TestBed.inject(GestionarProgresoDiarioUseCase), marcarCambiosLocalesPendientes };
  }

  it('marca un ejercicio como realizado y marca cambios pendientes (FR-024)', async () => {
    const marcar = vi.fn().mockResolvedValue(undefined);
    const { caso, marcarCambiosLocalesPendientes } = configurar({ marcar });

    await caso.marcar(new Date('2026-10-15'), 'ej-1', true);

    expect(marcar).toHaveBeenCalledWith(new Date('2026-10-15'), 'ej-1', true);
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledWith(true);
  });

  it('desmarca un ejercicio y marca cambios pendientes (FR-024)', async () => {
    const marcar = vi.fn().mockResolvedValue(undefined);
    const { caso, marcarCambiosLocalesPendientes } = configurar({ marcar });

    await caso.marcar(new Date('2026-10-15'), 'ej-1', false);

    expect(marcar).toHaveBeenCalledWith(new Date('2026-10-15'), 'ej-1', false);
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledWith(true);
  });

  it('obtiene el porcentaje del día a partir del dominio cuando hay planificación activa', async () => {
    const dias = crearDiasVacios();
    dias.find((d) => d.diaSemana === 'jueves')!.ejercicioIds = ['ej-1', 'ej-2'];
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', fechaInicio: '2026-10-12', dias };
    const obtenerDeFecha = vi.fn().mockResolvedValue(planificacion);
    const obtenerPorFecha = vi.fn().mockResolvedValue([{ fecha: '2026-10-15', ejercicioId: 'ej-1', realizado: true }]);
    const { caso } = configurar({ obtenerDeFecha, obtenerPorFecha });

    const resultado = await caso.obtenerProgresoDeFecha(new Date(2026, 9, 15)); // jueves 15/10/2026

    expect(resultado.totalPlanificados).toBe(2);
    expect(resultado.totalRealizados).toBe(1);
    expect(resultado.porcentaje).toBe(50);
  });

  it('devuelve porcentaje null cuando no hay planificación activa para la fecha (CL2)', async () => {
    const { caso } = configurar({});

    const resultado = await caso.obtenerProgresoDeFecha(new Date('2026-10-15'));

    expect(resultado.porcentaje).toBeNull();
  });
});
