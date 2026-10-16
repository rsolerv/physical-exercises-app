import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { PlanificacionConstructorComponent } from '../../../src/app/presentation/planificacion-semanal/constructor/planificacion-constructor.component';
import { GestionarPlanificacionUseCase } from '../../../src/app/application/casos-uso/gestionar-planificacion.use-case';
import { PlanificacionRepositoryPort } from '../../../src/app/application/ports/planificacion-repository.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

function ejercicio(id: string, nombre: string): Ejercicio {
  return { id, nombre, descripcion: 'desc', categoriaIds: ['cat-1'], enlaces: [], imagenes: [] };
}

describe('PlanificacionConstructorComponent', () => {
  function configurar(opciones: {
    idRuta?: string | null;
    planificacionExistente?: Planificacion | null;
    ejercicios?: Ejercicio[];
    crear?: ReturnType<typeof vi.fn>;
    actualizar?: ReturnType<typeof vi.fn>;
    duplicar?: ReturnType<typeof vi.fn>;
    asignarEjercicioADia?: ReturnType<typeof vi.fn>;
  }) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => opciones.idRuta ?? null } } } },
        {
          provide: PlanificacionRepositoryPort,
          useValue: { obtenerPorId: vi.fn().mockResolvedValue(opciones.planificacionExistente ?? null) },
        },
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue(opciones.ejercicios ?? []) } },
        {
          provide: GestionarPlanificacionUseCase,
          useValue: {
            crear: opciones.crear ?? vi.fn().mockResolvedValue({ id: 'plan-nuevo' }),
            actualizar: opciones.actualizar ?? vi.fn().mockResolvedValue({}),
            duplicar: opciones.duplicar ?? vi.fn().mockResolvedValue({ id: 'plan-copia' }),
            asignarEjercicioADia: opciones.asignarEjercicioADia ?? vi.fn().mockResolvedValue(undefined),
            quitarEjercicioDeDia: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    });
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(PlanificacionConstructorComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('el selector de fecha solo permite lunes', async () => {
    configurar({});
    const fixture = await crearComponente();
    const componente = fixture.componentInstance;

    componente.establecerFechaInicio('2026-10-13'); // martes
    fixture.detectChanges();

    expect(componente.errorFecha()).toContain('lunes');
  });

  it('acepta un lunes como fecha de inicio', async () => {
    configurar({});
    const fixture = await crearComponente();
    const componente = fixture.componentInstance;

    componente.establecerFechaInicio('2026-10-12'); // lunes
    fixture.detectChanges();

    expect(componente.errorFecha()).toBeNull();
  });

  it('impide añadir el mismo ejercicio dos veces al mismo día (FR-021)', async () => {
    configurar({ ejercicios: [ejercicio('ej-1', 'Sentadilla')] });
    const fixture = await crearComponente();
    const componente = fixture.componentInstance;

    componente.anadirEjercicioADia('lunes', 'ej-1');
    componente.anadirEjercicioADia('lunes', 'ej-1');
    fixture.detectChanges();

    expect(componente.ejerciciosPorDia().lunes).toEqual(['ej-1']);
    expect(componente.errorDia()).toContain('ya está asignado');
  });

  it('duplica la planificación cuando está en modo edición', async () => {
    const planificacionExistente: Planificacion = {
      id: 'plan-1',
      nombre: 'Semana original',
      fechaInicio: '2026-10-12',
      dias: crearDiasVacios(),
    };
    const duplicar = vi.fn().mockResolvedValue({ id: 'plan-copia' });
    configurar({ idRuta: 'plan-1', planificacionExistente, duplicar });
    const fixture = await crearComponente();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.duplicar();

    expect(duplicar).toHaveBeenCalledWith('plan-1', expect.stringContaining('Semana original'));
    expect(navigateSpy).toHaveBeenCalledWith(['/planificacion', 'plan-copia']);
  });

  it('precarga los datos de la planificación existente en modo edición', async () => {
    const dias = crearDiasVacios();
    dias[0].ejercicioIds = ['ej-1'];
    const planificacionExistente: Planificacion = { id: 'plan-1', nombre: 'Semana original', fechaInicio: '2026-10-12', dias };
    configurar({ idRuta: 'plan-1', planificacionExistente, ejercicios: [ejercicio('ej-1', 'Sentadilla')] });

    const fixture = await crearComponente();
    const componente = fixture.componentInstance;

    expect(componente.modelo().nombre).toBe('Semana original');
    expect(componente.ejerciciosPorDia().lunes).toEqual(['ej-1']);
  });

  it('crea una nueva planificación al guardar en modo alta', async () => {
    const crear = vi.fn().mockResolvedValue({ id: 'plan-nuevo' });
    configurar({ crear });
    const fixture = await crearComponente();
    const componente = fixture.componentInstance;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    componente.modelo.update((m) => ({ ...m, nombre: 'Semana nueva' }));
    fixture.detectChanges();
    await componente.guardar();

    expect(crear).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Semana nueva' }));
  });
});
