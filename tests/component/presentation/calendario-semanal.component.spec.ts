import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CalendarioSemanalComponent } from '../../../src/app/presentation/planificacion-semanal/calendario/calendario-semanal.component';
import { PlanificacionRepositoryPort } from '../../../src/app/application/ports/planificacion-repository.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

function ejercicio(id: string, nombre: string): Ejercicio {
  return { id, nombre, descripcion: 'desc', categoriaIds: ['cat-1'], enlaces: [], imagenes: [] };
}

describe('CalendarioSemanalComponent', () => {
  function configurar(planificaciones: Planificacion[], ejercicios: Ejercicio[] = []) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'ejercicios/:id', children: [] }]),
        provideNoopAnimations(),
        { provide: PlanificacionRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue(planificaciones) } },
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue(ejercicios) } },
      ],
    });
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(CalendarioSemanalComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('marca visualmente los días con ejercicios', async () => {
    const dias = crearDiasVacios();
    dias[0].ejercicioIds = ['ej-1']; // lunes
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', fechaInicio: '2026-10-12', dias };
    configurar([planificacion], [ejercicio('ej-1', 'Sentadilla')]);

    const fixture = await crearComponente();
    fixture.componentInstance.seleccionar(planificacion);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const diasConEjercicios = nativeElement.querySelectorAll('.calendario-semanal__dia--con-ejercicios');
    const diasVacios = nativeElement.querySelectorAll('.calendario-semanal__dia--vacio');
    expect(diasConEjercicios.length).toBe(1);
    expect(diasVacios.length).toBe(6);
    expect(nativeElement.textContent).toContain('Sentadilla');
  });

  it('muestra un mensaje cuando no hay ninguna planificación creada', async () => {
    configurar([]);
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No hay ninguna planificación creada todavía');
  });

  it('permite elegir todas las planificaciones y plantillas disponibles desde la cabecera', async () => {
    const plan1: Planificacion = { id: 'plan-1', nombre: 'Semana estándar', fechaInicio: '2026-10-12', dias: crearDiasVacios() };
    const plantilla: Planificacion = { id: 'plan-2', nombre: 'Mi plantilla', dias: crearDiasVacios() };
    configurar([plan1, plantilla]);

    const fixture = await crearComponente();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.calendario-semanal__selector-plan mat-select')?.click();
    await fixture.whenStable();

    const texto = document.body.textContent ?? '';
    expect(texto).toContain('Semana estándar');
    expect(texto).toContain('Mi plantilla');
  });

  it('muestra una tira de siete días, distingue hoy y filtra el día seleccionado en móvil', async () => {
    const dias = crearDiasVacios();
    dias[4].ejercicioIds = ['ej-1'];
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', fechaInicio: '2026-10-19', dias };
    configurar([planificacion], [ejercicio('ej-1', 'Peso muerto')]);
    const fixture = await crearComponente();
    const componente = fixture.componentInstance;
    componente.seleccionarDia('viernes');
    fixture.detectChanges();

    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelectorAll('.calendario-semanal__dia-movil')).toHaveLength(7);
    expect(raiz.querySelector('.calendario-semanal__dia-movil[aria-current="date"]')).toBeTruthy();
    expect(raiz.querySelector('.calendario-semanal__dia-seleccionado')?.textContent).toContain('Peso muerto');
    expect(raiz.querySelector('.calendario-semanal__dia-seleccionado')?.textContent).not.toContain('ej-1');
  });

  it('identifica planes activos y plantillas y muestra la fecha en formato legible', async () => {
    const lunes = new Date();
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    const fechaActiva = lunes.toISOString().slice(0, 10);
    const activa: Planificacion = { id: 'plan-activo', nombre: 'Semana actual', fechaInicio: fechaActiva, dias: crearDiasVacios() };
    const plantilla: Planificacion = { id: 'plantilla', nombre: 'Rutina base', dias: crearDiasVacios() };
    configurar([activa, plantilla]);
    const fixture = await crearComponente();
    const componente = fixture.componentInstance;
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(componente.etiquetaTipoPlan(activa)).toBe('Activa');
    expect(componente.etiquetaTipoPlan(plantilla)).toBe('Plantilla');
    expect(componente.formatearSemana(activa)).not.toContain(fechaActiva);
    expect((fixture.nativeElement as HTMLElement).querySelector('.calendario-semanal__titulo-semana')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.calendario-semanal__selector-plan')).toBeTruthy();
  });

  it('muestra los ejercicios como filas con fallback legible, no como IDs ni chips', async () => {
    const dias = crearDiasVacios();
    dias[0].ejercicioIds = ['ej-1', 'ej-inexistente'];
    const plan: Planificacion = { id: 'plan-1', nombre: 'Semana', dias };
    configurar([plan], [ejercicio('ej-1', 'Sentadilla')]);
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('.calendario-semanal__fila-ejercicio')?.textContent).toContain('Sentadilla');
    expect(raiz.textContent).toContain('Ejercicio no disponible');
    expect(raiz.textContent).not.toContain('ej-inexistente');
    expect(raiz.querySelector('.calendario-semanal__fila-ejercicio mat-chip')).toBeNull();
  });

  it('conserva la planificación semanal como pantalla de origen al abrir un ejercicio', async () => {
    const dias = crearDiasVacios();
    dias[0].ejercicioIds = ['ej-1'];
    configurar([{ id: 'plan-1', nombre: 'Semana', dias }], [ejercicio('ej-1', 'Sentadilla')]);
    const fixture = await crearComponente();
    const enlace = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '.calendario-semanal__fila-ejercicio'
    );

    enlace?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Location).getState()).toMatchObject({ returnUrl: '/planificacion' });
  });

  it('expone un estado de carga reconocible mientras llegan los datos del calendario', () => {
    let resolver: (planes: Planificacion[]) => void = () => undefined;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: PlanificacionRepositoryPort, useValue: { listarTodas: () => new Promise<Planificacion[]>((resolve) => (resolver = resolve)) } },
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue([]) } },
      ],
    });
    const fixture = TestBed.createComponent(CalendarioSemanalComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeTruthy();
    resolver([]);
  });
});
