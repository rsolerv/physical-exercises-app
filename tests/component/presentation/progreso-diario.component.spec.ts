import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ProgresoDiarioComponent } from '../../../src/app/presentation/progreso-diario/progreso-diario.component';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
import { GestionarProgresoDiarioUseCase } from '../../../src/app/application/casos-uso/gestionar-progreso-diario.use-case';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';
import type { ProgresoDiario } from '../../../src/app/domain/progreso-diario/progreso-diario.entity';

function ejercicio(id: string, nombre: string): Ejercicio {
  return { id, nombre, descripcion: 'desc', categoriaIds: ['cat-1'], enlaces: [], imagenes: [] };
}

describe('ProgresoDiarioComponent', () => {
  let mostrarExitoConAccion: ReturnType<typeof vi.fn>;
  let mostrarError: ReturnType<typeof vi.fn>;
  let restaurarCambio: ReturnType<typeof vi.fn>;

  function configurar(registros: ProgresoDiario[], marcar?: ReturnType<typeof vi.fn>) {
    mostrarExitoConAccion = vi.fn();
    mostrarError = vi.fn();
    restaurarCambio = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: ProgresoDiarioRepositoryPort, useValue: { obtenerPorFecha: vi.fn().mockResolvedValue(registros) } },
        {
          provide: GestionarProgresoDiarioUseCase,
          useValue: {
            marcar: marcar ?? vi.fn().mockResolvedValue({ realizadoAnterior: false }),
            restaurarCambio,
          },
        },
        { provide: MensajeFeedbackService, useValue: { mostrarExitoConAccion, mostrarError } },
      ],
    });
  }

  async function crearComponente(ejercicios: Ejercicio[]) {
    const fixture = TestBed.createComponent(ProgresoDiarioComponent);
    fixture.componentRef.setInput('fecha', new Date('2026-10-15'));
    fixture.componentRef.setInput('ejercicios', ejercicios);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra una casilla por cada ejercicio planificado', async () => {
    configurar([]);
    const fixture = await crearComponente([ejercicio('ej-1', 'Sentadilla'), ejercicio('ej-2', 'Plancha')]);

    const casillas = (fixture.nativeElement as HTMLElement).querySelectorAll('mat-checkbox');
    expect(casillas.length).toBe(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sentadilla');
  });

  it('muestra el porcentaje de progreso del día (FR-025)', async () => {
    configurar([{ fecha: '2026-10-15', ejercicioId: 'ej-1', realizado: true }]);
    const fixture = await crearComponente([ejercicio('ej-1', 'Sentadilla'), ejercicio('ej-2', 'Plancha')]);

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('1 de 2 completados');
    expect(texto).toContain('Buen progreso');
    expect(texto).toContain('50%');
  });

  it('muestra el 100% cuando todos los ejercicios están marcados', async () => {
    configurar([
      { fecha: '2026-10-15', ejercicioId: 'ej-1', realizado: true },
      { fecha: '2026-10-15', ejercicioId: 'ej-2', realizado: true },
    ]);
    const fixture = await crearComponente([ejercicio('ej-1', 'Sentadilla'), ejercicio('ej-2', 'Plancha')]);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('100%');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Día completado');
  });

  it('al marcar una casilla, llama al caso de uso con el nuevo estado', async () => {
    const marcar = vi.fn().mockResolvedValue({ realizadoAnterior: false });
    configurar([], marcar);
    const fixture = await crearComponente([ejercicio('ej-1', 'Sentadilla')]);

    await fixture.componentInstance.alternar('ej-1');

    expect(marcar).toHaveBeenCalledWith(new Date('2026-10-15'), 'ej-1', true);
    expect(mostrarExitoConAccion).toHaveBeenCalledWith('Progreso actualizado.', 'Deshacer', expect.any(Function));
  });

  it('muestra el recuento y el estado inicial y ofrece deshacer la marca', async () => {
    const marcar = vi.fn().mockResolvedValue({ realizadoAnterior: false });
    configurar([], marcar);
    const fixture = await crearComponente([ejercicio('ej-1', 'Sentadilla'), ejercicio('ej-2', 'Plancha')]);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('0 de 2 completados');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aún no has marcado ejercicios');
    await fixture.componentInstance.alternar('ej-1');

    const deshacer = mostrarExitoConAccion.mock.calls[0][2] as () => void;
    deshacer();

    expect(restaurarCambio).toHaveBeenCalledWith(expect.objectContaining({ realizadoAnterior: false }));
  });

  it('mantiene los controles táctiles principales con al menos 56 px de alto', async () => {
    configurar([]);
    const fixture = await crearComponente([ejercicio('ej-1', 'Sentadilla')]);
    const control = (fixture.nativeElement as HTMLElement).querySelector('.progreso-diario__elemento');

    expect(control).toBeTruthy();
    expect(control && getComputedStyle(control).minHeight).toBe('56px');
  });

  it('expone un estado de carga accesible mientras lee el progreso', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: ProgresoDiarioRepositoryPort, useValue: { obtenerPorFecha: () => new Promise<ProgresoDiario[]>(() => undefined) } },
        { provide: GestionarProgresoDiarioUseCase, useValue: { marcar: vi.fn(), restaurarCambio: vi.fn() } },
        { provide: MensajeFeedbackService, useValue: { mostrarExitoConAccion: vi.fn(), mostrarError: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ProgresoDiarioComponent);
    fixture.componentRef.setInput('fecha', new Date('2026-10-15'));
    fixture.componentRef.setInput('ejercicios', [ejercicio('ej-1', 'Sentadilla')]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeTruthy();
  });
});
