import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DiaActualComponent } from '../../../src/app/presentation/planificacion-semanal/dia-actual/dia-actual.component';
import { ConsultarPlanificacionUseCase } from '../../../src/app/application/casos-uso/consultar-planificacion.use-case';
import { GestionarProgresoDiarioUseCase } from '../../../src/app/application/casos-uso/gestionar-progreso-diario.use-case';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import { crearDiasVacios, DIAS_SEMANA_ORDENADOS } from '../../../src/app/domain/planificacion/planificacion.entity';
import { diaSemanaDeFecha } from '../../../src/app/domain/planificacion/fecha-semana';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';

function ejercicio(id: string, nombre: string): Ejercicio {
  return { id, nombre, descripcion: 'desc', categoriaIds: ['cat-1'], enlaces: [], imagenes: [] };
}

describe('DiaActualComponent', () => {
  function configurar(planificacion: Planificacion | null, ejercicios: Ejercicio[] = [], categorias: Categoria[] = []) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ConsultarPlanificacionUseCase, useValue: { obtenerDeHoy: vi.fn().mockResolvedValue(planificacion) } },
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue(ejercicios) } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue(categorias) } },
        { provide: ProgresoDiarioRepositoryPort, useValue: { obtenerPorFecha: vi.fn().mockResolvedValue([]) } },
        {
          provide: GestionarProgresoDiarioUseCase,
          useValue: {
            marcar: vi.fn().mockResolvedValue({ fecha: new Date(), ejercicioId: 'ej-1', realizadoAnterior: false }),
            restaurarCambio: vi.fn().mockResolvedValue(undefined),
          },
        },
        { provide: MensajeFeedbackService, useValue: { mostrarExitoConAccion: vi.fn(), mostrarError: vi.fn() } },
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
    expect(texto).toContain('Plan: Semana');
    expect(texto).toContain(new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()));
  });

  it('muestra la descripción completa y las categorías de los ejercicios de hoy', async () => {
    const dias = crearDiasVacios();
    const diaHoy = dias.find((dia) => dia.diaSemana === diaSemanaDeFecha(new Date()));
    if (diaHoy) diaHoy.ejercicioIds = ['ej-1'];
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', fechaInicio: '2020-01-06', dias };
    const descripcion = 'Mantén la espalda recta y baja lentamente hasta completar el movimiento.';
    const ejercicioHoy = { ...ejercicio('ej-1', 'Sentadilla'), descripcion };
    configurar(planificacion, [ejercicioHoy], [{ id: 'cat-1', nombre: 'Piernas' }]);

    const fixture = await crearComponente();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain(descripcion);
    expect(texto).toContain('Piernas');
  });

  it('muestra "no hay ejercicios programados para hoy" cuando no hay planificación activa (FR-030)', async () => {
    configurar(null);
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('no hay ejercicios programados para hoy');
    expect(texto).toContain('Día de descanso');
    expect(texto).toContain('Sin planificación activa');
  });

  it('muestra el mismo mensaje cuando hay planificación activa pero hoy no tiene ejercicios', async () => {
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', fechaInicio: '2020-01-06', dias: crearDiasVacios() };
    configurar(planificacion, []);
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('no hay ejercicios programados para hoy');
  });

  it('muestra la próxima sesión de la semana cuando el día actual es descanso', async () => {
    const indiceHoy = DIAS_SEMANA_ORDENADOS.indexOf(diaSemanaDeFecha(new Date()));
    if (indiceHoy === DIAS_SEMANA_ORDENADOS.length - 1) return;
    const dias = crearDiasVacios();
    dias[indiceHoy + 1].ejercicioIds = ['ej-next'];
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', fechaInicio: '2020-01-06', dias };
    configurar(planificacion, [ejercicio('ej-next', 'Estiramiento')]);
    const fixture = await crearComponente();

    const proximaSesion = (fixture.nativeElement as HTMLElement).querySelector('.dia-actual__proxima-sesion');
    expect(proximaSesion?.textContent).toContain('Próxima sesión');
    expect(proximaSesion?.textContent).toContain('Estiramiento');
  });
});
