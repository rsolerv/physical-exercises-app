import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
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
        provideRouter([]),
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

  it('lista todas las planificaciones y plantillas disponibles', async () => {
    const plan1: Planificacion = { id: 'plan-1', nombre: 'Semana estándar', fechaInicio: '2026-10-12', dias: crearDiasVacios() };
    const plantilla: Planificacion = { id: 'plan-2', nombre: 'Mi plantilla', dias: crearDiasVacios() };
    configurar([plan1, plantilla]);

    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Semana estándar');
    expect(texto).toContain('Mi plantilla');
  });
});
