import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { PlanificacionConstructorComponent } from '../../../src/app/presentation/planificacion-semanal/constructor/planificacion-constructor.component';
import { GestionarPlanificacionUseCase } from '../../../src/app/application/casos-uso/gestionar-planificacion.use-case';
import { BuscarEjerciciosUseCase } from '../../../src/app/application/casos-uso/buscar-ejercicios.use-case';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
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
    listarEjercicios?: () => Promise<Ejercicio[]>;
    crear?: ReturnType<typeof vi.fn>;
    actualizar?: ReturnType<typeof vi.fn>;
    duplicar?: ReturnType<typeof vi.fn>;
    asignarEjercicioADia?: ReturnType<typeof vi.fn>;
    quitarEjercicioDeDia?: ReturnType<typeof vi.fn>;
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
        {
          provide: EjercicioRepositoryPort,
          useValue: { listarTodos: opciones.listarEjercicios ?? vi.fn().mockResolvedValue(opciones.ejercicios ?? []) },
        },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
        {
          provide: BuscarEjerciciosUseCase,
          useValue: { buscar: vi.fn().mockResolvedValue(opciones.ejercicios ?? []) },
        },
        {
          provide: GestionarPlanificacionUseCase,
          useValue: {
            crear: opciones.crear ?? vi.fn().mockResolvedValue({ id: 'plan-nuevo' }),
            actualizar: opciones.actualizar ?? vi.fn().mockResolvedValue({}),
            duplicar: opciones.duplicar ?? vi.fn().mockResolvedValue({ id: 'plan-copia' }),
            asignarEjercicioADia: opciones.asignarEjercicioADia ?? vi.fn().mockResolvedValue(undefined),
            quitarEjercicioDeDia: opciones.quitarEjercicioDeDia ?? vi.fn().mockResolvedValue(undefined),
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

    componente.establecerFechaInicio(new Date(2026, 9, 13)); // martes
    fixture.detectChanges();

    expect(componente.errorFecha()).toContain('lunes');
  });

  it('acepta un lunes como fecha de inicio', async () => {
    configurar({});
    const fixture = await crearComponente();
    const componente = fixture.componentInstance;

    componente.establecerFechaInicio(new Date(2026, 9, 12)); // lunes
    fixture.detectChanges();

    expect(componente.errorFecha()).toBeNull();
    expect(componente.fechaInicio()).toBe('2026-10-12');
  });

  it('abre el selector, añade el ejercicio al día elegido y vuelve al formulario sin guardar', async () => {
    const crear = vi.fn().mockResolvedValue({ id: 'plan-nuevo' });
    configurar({ ejercicios: [ejercicio('ej-1', 'Sentadilla')], crear });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    raiz.querySelector<HTMLButtonElement>('section[aria-label="Martes"] button')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('mat-selection-list')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('mat-list-option')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.ejerciciosPorDia().martes).toEqual(['ej-1']);
    expect(crear).not.toHaveBeenCalled();

    const botonVolver = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find((boton) => boton.textContent?.includes('Volver'));
    botonVolver?.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeTruthy();
    expect(fixture.componentInstance.ejerciciosPorDia().martes).toEqual(['ej-1']);
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

  it('no muestra el identificador del ejercicio mientras se cargan sus nombres', async () => {
    const idEjercicio = 'ejercicio-con-identificador-largo';
    const dias = crearDiasVacios();
    dias[0].ejercicioIds = [idEjercicio];
    const planificacionExistente: Planificacion = {
      id: 'plan-1',
      nombre: 'Semana original',
      fechaInicio: '2026-10-12',
      dias,
    };
    let resolverEjercicios!: (ejercicios: Ejercicio[]) => void;
    const ejerciciosPendientes = new Promise<Ejercicio[]>((resolve) => {
      resolverEjercicios = resolve;
    });
    configurar({
      idRuta: 'plan-1',
      planificacionExistente,
      listarEjercicios: () => ejerciciosPendientes,
    });

    const fixture = TestBed.createComponent(PlanificacionConstructorComponent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const textoDuranteLaCarga = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(textoDuranteLaCarga).toContain('Cargando ejercicios...');
    expect(textoDuranteLaCarga).not.toContain(idEjercicio);

    resolverEjercicios([ejercicio(idEjercicio, 'Sentadilla')]);
    await fixture.whenStable();
    fixture.detectChanges();

    const textoTrasLaCarga = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(textoTrasLaCarga).toContain('Sentadilla');
    expect(textoTrasLaCarga).not.toContain(idEjercicio);
  });

  it('muestra un texto alternativo si la planificación referencia un ejercicio no disponible', async () => {
    const idEjercicio = 'ejercicio-no-disponible-123456';
    const dias = crearDiasVacios();
    dias[0].ejercicioIds = [idEjercicio];
    const planificacionExistente: Planificacion = {
      id: 'plan-1',
      nombre: 'Semana original',
      fechaInicio: '2026-10-12',
      dias,
    };
    configurar({ idRuta: 'plan-1', planificacionExistente });

    const fixture = await crearComponente();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Ejercicio no disponible');
    expect(texto).not.toContain(idEjercicio);
  });

  it('revierte la selección y muestra un error si falla la asignación persistida desde el selector', async () => {
    const asignarEjercicioADia = vi.fn().mockRejectedValue(new Error('No se pudo asignar.'));
    const planificacionExistente: Planificacion = { id: 'plan-1', nombre: 'Semana', dias: crearDiasVacios() };
    configurar({
      idRuta: 'plan-1',
      planificacionExistente,
      ejercicios: [ejercicio('ej-1', 'Sentadilla')],
      asignarEjercicioADia,
    });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    raiz.querySelector<HTMLButtonElement>('section[aria-label="Lunes"] button')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('mat-list-option')?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(asignarEjercicioADia).toHaveBeenCalledWith('plan-1', 'lunes', 'ej-1');
    expect(fixture.componentInstance.ejerciciosPorDia().lunes).toEqual([]);
    expect(fixture.componentInstance.errorDia()).toContain('No se pudo asignar');
  });

  it('identifica la plantilla o la planificación activa desde el formulario', async () => {
    configurar({});
    const fixture = await crearComponente();
    const componente = fixture.componentInstance;

    expect(componente.etiquetaTipoPlan()).toBe('Plantilla');
    const lunes = new Date();
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    componente.establecerFechaInicio(lunes);
    fixture.detectChanges();

    expect(componente.etiquetaTipoPlan()).toBe('Activa');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Activa');
  });

  it('informa si no se pueden cargar los nombres de los ejercicios', async () => {
    const dias = crearDiasVacios();
    dias[0].ejercicioIds = ['ej-1'];
    const planificacionExistente: Planificacion = {
      id: 'plan-1',
      nombre: 'Semana original',
      fechaInicio: '2026-10-12',
      dias,
    };
    configurar({
      idRuta: 'plan-1',
      planificacionExistente,
      listarEjercicios: () => Promise.reject(new Error('Error de almacenamiento')),
    });

    const fixture = await crearComponente();
    const error = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');

    expect(error?.textContent).toContain('No se han podido cargar los ejercicios');
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
