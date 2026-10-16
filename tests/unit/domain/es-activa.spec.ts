import { describe, it, expect } from 'vitest';
import { esActiva } from '../../../src/app/domain/planificacion/es-activa';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';

function planificacion(sobrescribir: Partial<Planificacion> = {}): Planificacion {
  return { id: 'plan-1', nombre: 'Semana estándar', dias: crearDiasVacios(), ...sobrescribir };
}

describe('esActiva', () => {
  it('una plantilla (sin fechaInicio) nunca es activa (FR-022)', () => {
    expect(esActiva(planificacion({ fechaInicio: undefined }), new Date('2026-10-15T12:00:00Z'))).toBe(false);
  });

  it('es activa cuando la fecha de referencia es el propio lunes de fechaInicio', () => {
    const plan = planificacion({ fechaInicio: '2026-10-12' }); // lunes
    expect(esActiva(plan, new Date('2026-10-12T08:00:00'))).toBe(true);
  });

  it('es activa cuando la fecha de referencia es el domingo siguiente', () => {
    const plan = planificacion({ fechaInicio: '2026-10-12' });
    expect(esActiva(plan, new Date('2026-10-18T08:00:00'))).toBe(true);
  });

  it('es activa para un día intermedio de la semana (p. ej. jueves)', () => {
    const plan = planificacion({ fechaInicio: '2026-10-12' });
    expect(esActiva(plan, new Date('2026-10-15T08:00:00'))).toBe(true);
  });

  it('no es activa el lunes anterior', () => {
    const plan = planificacion({ fechaInicio: '2026-10-12' });
    expect(esActiva(plan, new Date('2026-10-05T08:00:00'))).toBe(false);
  });

  it('no es activa el lunes siguiente', () => {
    const plan = planificacion({ fechaInicio: '2026-10-12' });
    expect(esActiva(plan, new Date('2026-10-19T08:00:00'))).toBe(false);
  });
});
