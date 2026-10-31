import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DatosConfirmarEliminarEjercicioComun {
  nombre: string;
}

@Component({
  selector: 'app-confirmar-eliminar-ejercicio-comun-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Borrar ejercicio del repositorio común</h2>
    <mat-dialog-content>
      <p>Se eliminará «{{ datos.nombre }}» del catálogo común, incluidas sus imágenes y categorías.</p>
      <p>Esta acción no se puede deshacer.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button type="button" color="warn" [mat-dialog-close]="true">Borrar ejercicio</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmarEliminarEjercicioComunDialogComponent {
  protected readonly datos = inject<DatosConfirmarEliminarEjercicioComun>(MAT_DIALOG_DATA);
}
