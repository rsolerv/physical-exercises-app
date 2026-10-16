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

describe('DiaActualComponent', () => {
  function configurar(planificacion: Planificacion | null, ejercicios: Ejercicio[] = []) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ConsultarPlanificacionUseCase, useValue: { obtenerDeHoy: vi.fn().mockResolvedValue(planificacion) } },
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue(ejercicios) } },
        { provide: ProgresoDiarioRepositoryPort, useValue: { obtenerPorFecha: vi.fn().mockResolvedValue([]) } },
        { provide: GestionarProgresoDiarioUseCase, useValue: { marcar: vi.fn().mockResolvedValue(undefined) } },
      ],
    });
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(DiaActualComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra la planificación del día de hoy (FR-008)', async () => {
    const hoy = diaSemanaDeFecha(new Date());
    const dias = crearDiasVacios();
    const diaHoy = dias.find((d) => d.diaSemana === hoy);
    if (diaHoy) diaHoy.ejercicioIds = ['ej-1'];
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', fechaInicio: '2020-01-06', dias };
    configurar(planificacion, [ejercicio('ej-1', 'Sentadilla')]);

    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sentadilla');
  });

  it('muestra "no hay ejercicios programados para hoy" cuando no hay planificación activa (FR-030)', async () => {
    configurar(null);
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('no hay ejercicios programados para hoy');
  });

  it('muestra el mismo mensaje cuando hay planificación activa pero hoy no tiene ejercicios', async () => {
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', fechaInicio: '2020-01-06', dias: crearDiasVacios() };
    configurar(planificacion, []);
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('no hay ejercicios programados para hoy');
  });
});
