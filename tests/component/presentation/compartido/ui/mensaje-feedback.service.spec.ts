import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { MensajeFeedbackService } from '../../../../../src/app/presentation/compartido/ui/mensaje-feedback.service';

describe('MensajeFeedbackService', () => {
  let open: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    open = vi.fn();
    TestBed.configureTestingModule({
      providers: [MensajeFeedbackService, { provide: MatSnackBar, useValue: { open } }],
    });
  });

  it('mostrarExito invoca MatSnackBar.open con el texto recibido y 4000 ms de duración', () => {
    const servicio = TestBed.inject(MensajeFeedbackService);

    servicio.mostrarExito('Ejercicio guardado');

    expect(open).toHaveBeenCalledWith('Ejercicio guardado', undefined, expect.objectContaining({ duration: 4000 }));
  });

  it('mostrarError invoca MatSnackBar.open con el texto recibido y 4000 ms de duración', () => {
    const servicio = TestBed.inject(MensajeFeedbackService);

    servicio.mostrarError('No se pudo eliminar la categoría');

    expect(open).toHaveBeenCalledWith(
      'No se pudo eliminar la categoría',
      undefined,
      expect.objectContaining({ duration: 4000 })
    );
  });

  it('mostrarExitoConAccion presenta la acción y la ejecuta al seleccionarla', () => {
    const accion = vi.fn();
    open.mockReturnValue({ onAction: () => of(undefined) });
    const servicio = TestBed.inject(MensajeFeedbackService);

    servicio.mostrarExitoConAccion('Categoría eliminada.', 'Deshacer', accion);

    expect(open).toHaveBeenCalledWith(
      'Categoría eliminada.',
      'Deshacer',
      expect.objectContaining({ duration: 4000 })
    );
    expect(accion).toHaveBeenCalledOnce();
  });

  it('no requiere que el usuario mueva el foco (política de anuncio por defecto de MatSnackBar)', () => {
    const servicio = TestBed.inject(MensajeFeedbackService);

    servicio.mostrarExito('Categoría creada');

    const opciones = open.mock.calls[0][2];
    expect(opciones.politeness).not.toBe('assertive');
  });
});
