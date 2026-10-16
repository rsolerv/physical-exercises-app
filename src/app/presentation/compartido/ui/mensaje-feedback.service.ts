import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const DURACION_MS = 4000;

/**
 * Confirmación visual de operaciones (crear/editar/eliminar, FR-008).
 * Envuelve `MatSnackBar`, que ya anuncia el mensaje a tecnologías de
 * asistencia sin requerir que el usuario mueva el foco (FR-015).
 */
@Injectable({ providedIn: 'root' })
export class MensajeFeedbackService {
  private readonly snackBar = inject(MatSnackBar);

  mostrarExito(texto: string): void {
    this.snackBar.open(texto, undefined, {
      duration: DURACION_MS,
      panelClass: 'mensaje-feedback--exito',
    });
  }

  mostrarError(texto: string): void {
    this.snackBar.open(texto, undefined, {
      duration: DURACION_MS,
      panelClass: 'mensaje-feedback--error',
    });
  }
}
