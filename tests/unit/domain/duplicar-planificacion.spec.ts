import { describe, it, expect } from 'vitest';
import { duplicarPlanificacion } from '../../../src/app/domain/planificacion/duplicar-planificacion';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';

describe('duplicarPlanificacion', () => {
  it('crea una copia independiente con los mismos días y ejercicios, sin fechaInicio (FR-019, CA14)', () => {
    const dias = crearDiasVacios();
    dias[0].ejercicioIds = ['ej-1', 'ej-2'];
    const original: Planificacion = { id: 'plan-1', nombre: 'Semana original', fechaInicio: '2026-10-12', dias };

    const copia = duplicarPlanificacion(original, 'Semana duplicada');

    expect(copia.nombre).toBe('Semana duplicada');
    expect(copia.fechaInicio).toBeUndefined();
    expect(copia.dias[0].ejercicioIds).toEqual(['ej-1', 'ej-2']);
  });

  it('la copia es independiente del original (no comparten referencias de array)', () => {
    const dias = crearDiasVacios();
    dias[0].ejercicioIds = ['ej-1'];
    const original: Planificacion = { id: 'plan-1', nombre: 'Original', dias };

    const copia = duplicarPlanificacion(original, 'Copia');
    copia.dias[0].ejercicioIds.push('ej-2');

    expect(original.dias[0].ejercicioIds).toEqual(['ej-1']);
  });

  it('duplica también una plantilla (sin fechaInicio)', () => {
    const original: Planificacion = { id: 'plan-1', nombre: 'Plantilla', dias: crearDiasVacios() };
    const copia = duplicarPlanificacion(original, 'Copia de plantilla');
    expect(copia.fechaInicio).toBeUndefined();
  });
});
