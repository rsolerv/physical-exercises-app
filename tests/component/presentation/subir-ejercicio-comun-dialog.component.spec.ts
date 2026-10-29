import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubirEjercicioComunDialogComponent } from '../../../src/app/presentation/biblioteca-ejercicios/subir-ejercicio-comun-dialog.component';
import type { DatosSubirEjercicioComunDialog } from '../../../src/app/presentation/biblioteca-ejercicios/subir-ejercicio-comun-dialog.component';
import { SubirEjercicioComunUseCase } from '../../../src/app/application/casos-uso/subir-ejercicio-comun.use-case';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

function ejercicio(): Ejercicio {
  return {
    id: 'ej-1',
    nombre: 'Sentadilla',
    descripcion: 'Flexionar las rodillas.',
    categoriaIds: ['cat-1'],
    enlaces: [{ tipo: 'youtube', url: 'https://www.youtube.com/watch?v=abc123' }],
    imagenes: [],
    subidoRepositorioComun: false,
  };
}

describe('SubirEjercicioComunDialogComponent', () => {
  function configurar(opciones: {
    listarCategoriasComunes?: ReturnType<typeof vi.fn>;
    comprobarDuplicado?: ReturnType<typeof vi.fn>;
    subir?: ReturnType<typeof vi.fn>;
  }) {
    const cierres: unknown[] = [];
    const listarCategoriasComunes =
      opciones.listarCategoriasComunes ?? vi.fn().mockResolvedValue([{ id: 'cat-comun-1', nombre: 'Rodilla' }]);
    const comprobarDuplicado = opciones.comprobarDuplicado ?? vi.fn().mockResolvedValue(false);
    const subir = opciones.subir ?? vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close: (resultado: unknown) => cierres.push(resultado) } },
        { provide: MAT_DIALOG_DATA, useValue: { ejercicio: ejercicio() } satisfies DatosSubirEjercicioComunDialog },
        { provide: SubirEjercicioComunUseCase, useValue: { listarCategoriasComunes, comprobarDuplicado, subir } },
      ],
    });
    return { cierres, listarCategoriasComunes, comprobarDuplicado, subir };
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(SubirEjercicioComunDialogComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra la lista de categorías comunes con selección múltiple (FR-016)', async () => {
    configurar({});
    const fixture = await crearComponente();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Rodilla');
  });

  it('exige al menos una categoría común para continuar', async () => {
    configurar({});
    const fixture = await crearComponente();
    expect(fixture.componentInstance.puedeContinuar()).toBe(false);

    fixture.componentInstance.alternarCategoria('cat-comun-1');
    expect(fixture.componentInstance.puedeContinuar()).toBe(true);
  });

  it('muestra un estado vacío bloqueante si no hay ninguna categoría común publicada', async () => {
    configurar({ listarCategoriasComunes: vi.fn().mockResolvedValue([]) });
    const fixture = await crearComponente();

    expect(fixture.componentInstance.puedeContinuar()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent?.toLowerCase()).toContain('categoría');
  });

  it('bloquea con un mensaje si ya existe un ejercicio con ese nombre (FR-017)', async () => {
    const { comprobarDuplicado } = configurar({ comprobarDuplicado: vi.fn().mockResolvedValue(true) });
    const fixture = await crearComponente();
    fixture.componentInstance.alternarCategoria('cat-comun-1');

    await fixture.componentInstance.continuar();
    fixture.detectChanges();

    expect(comprobarDuplicado).toHaveBeenCalledWith('Sentadilla');
    expect(fixture.componentInstance.paso()).toBe('duplicado');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ya existe un ejercicio con este nombre');
  });

  it('muestra la confirmación explícita cuando no hay duplicado (FR-018)', async () => {
    configurar({});
    const fixture = await crearComponente();
    fixture.componentInstance.alternarCategoria('cat-comun-1');

    await fixture.componentInstance.continuar();
    fixture.detectChanges();

    expect(fixture.componentInstance.paso()).toBe('confirmar');
    expect((fixture.nativeElement as HTMLElement).textContent?.toLowerCase()).toContain('no se puede deshacer');
  });

  it('al confirmar, sube el ejercicio y cierra el diálogo con éxito', async () => {
    const { subir, cierres } = configurar({});
    const fixture = await crearComponente();
    fixture.componentInstance.alternarCategoria('cat-comun-1');
    await fixture.componentInstance.continuar();

    await fixture.componentInstance.confirmar();

    expect(subir).toHaveBeenCalledWith(ejercicio(), ['cat-comun-1']);
    expect(cierres).toEqual([true]);
  });

  it('si falla el envío, muestra el error, no cierra el diálogo y permite reintentar (FR-023)', async () => {
    const subir = vi.fn().mockRejectedValue(new Error('Sin conexión.'));
    const { cierres } = configurar({ subir });
    const fixture = await crearComponente();
    fixture.componentInstance.alternarCategoria('cat-comun-1');
    await fixture.componentInstance.continuar();

    await fixture.componentInstance.confirmar();
    fixture.detectChanges();

    expect(cierres).toEqual([]);
    expect(fixture.componentInstance.paso()).toBe('confirmar');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin conexión.');
  });

  it('Cancelar cierra el diálogo sin enviar nada', async () => {
    const { subir, cierres } = configurar({});
    const fixture = await crearComponente();

    fixture.componentInstance.cancelar();

    expect(subir).not.toHaveBeenCalled();
    expect(cierres).toEqual([false]);
  });
});
