import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { GestionarPlanificacionUseCase } from '../../../src/app/application/casos-uso/gestionar-planificacion.use-case';
import { PlanificacionRepositoryPort } from '../../../src/app/application/ports/planificacion-repository.port';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';

function planificacion(sobrescribir: Partial<Planificacion> = {}): Planificacion {
  return { id: 'plan-1', nombre: 'Semana', dias: crearDiasVacios(), ...sobrescribir };
}

describe('GestionarPlanificacionUseCase', () => {
  function configurar(repo: Partial<PlanificacionRepositoryPort>) {
    const marcarCambiosLocalesPendientes = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: PlanificacionRepositoryPort, useValue: repo },
        { provide: AjustesRepositoryPort, useValue: { marcarCambiosLocalesPendientes } },
      ],
    });
    return { caso: TestBed.inject(GestionarPlanificacionUseCase), marcarCambiosLocalesPendientes };
  }

  it('crea una planificación concreta y marca cambios pendientes', async () => {
    const crear = vi.fn().mockResolvedValue(planificacion({ fechaInicio: '2026-10-12' }));
    const { caso, marcarCambiosLocalesPendientes } = configurar({ crear });

    const resultado = await caso.crear({ nombre: 'Semana', fechaInicio: '2026-10-12', dias: crearDiasVacios() });

    expect(resultado.fechaInicio).toBe('2026-10-12');
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });

  it('crea una plantilla (sin fechaInicio) y marca cambios pendientes', async () => {
    const crear = vi.fn().mockResolvedValue(planificacion());
    const { caso, marcarCambiosLocalesPendientes } = configurar({ crear });

    await caso.crear({ nombre: 'Plantilla', dias: crearDiasVacios() });

    expect(crear).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Plantilla' }));
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });

  it('asigna un ejercicio a un día y marca cambios pendientes', async () => {
    const asignarEjercicioADia = vi.fn().mockResolvedValue(undefined);
    const { caso, marcarCambiosLocalesPendientes } = configurar({ asignarEjercicioADia });

    await caso.asignarEjercicioADia('plan-1', 'lunes', 'ej-1');

    expect(asignarEjercicioADia).toHaveBeenCalledWith('plan-1', 'lunes', 'ej-1');
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });

  it('quita un ejercicio de un día y marca cambios pendientes', async () => {
    const quitarEjercicioDeDia = vi.fn().mockResolvedValue(undefined);
    const { caso, marcarCambiosLocalesPendientes } = configurar({ quitarEjercicioDeDia });

    await caso.quitarEjercicioDeDia('plan-1', 'lunes', 'ej-1');

    expect(quitarEjercicioDeDia).toHaveBeenCalledWith('plan-1', 'lunes', 'ej-1');
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });

  it('duplica una planificación y marca cambios pendientes', async () => {
    const duplicar = vi.fn().mockResolvedValue(planificacion({ id: 'plan-2', nombre: 'Copia' }));
    const { caso, marcarCambiosLocalesPendientes } = configurar({ duplicar });

    const copia = await caso.duplicar('plan-1', 'Copia');

    expect(duplicar).toHaveBeenCalledWith('plan-1', 'Copia');
    expect(copia.nombre).toBe('Copia');
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });

  it('crea una planificación concreta a partir de una plantilla, asignándole un lunes (FR-018, FR-019)', async () => {
    const duplicar = vi.fn().mockResolvedValue(planificacion({ id: 'plan-2', nombre: 'Desde plantilla' }));
    const actualizar = vi.fn().mockResolvedValue(planificacion({ id: 'plan-2', nombre: 'Desde plantilla', fechaInicio: '2026-10-12' }));
    const { caso, marcarCambiosLocalesPendientes } = configurar({ duplicar, actualizar });

    const resultado = await caso.crearDesdeTemplate('plantilla-1', 'Desde plantilla', '2026-10-12');

    expect(duplicar).toHaveBeenCalledWith('plantilla-1', 'Desde plantilla');
    expect(actualizar).toHaveBeenCalledWith('plan-2', { fechaInicio: '2026-10-12' });
    expect(resultado.fechaInicio).toBe('2026-10-12');
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });
});
