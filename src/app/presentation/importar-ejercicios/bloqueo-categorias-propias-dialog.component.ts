import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-bloqueo-categorias-propias-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, RouterLink],
  template: `
    <h2 mat-dialog-title>Crea una categoría antes de importar</h2>
    <mat-dialog-content>
      <p>
        Para importar ejercicios del repositorio común necesitas tener al menos una categoría propia
        creada, de forma que puedas elegir a cuál de las tuyas se asigna cada ejercicio importado.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cerrar()">Cerrar</button>
      <a mat-flat-button routerLink="/ejercicios/categorias" (click)="cerrar()">Gestionar categorías</a>
    </mat-dialog-actions>
  `,
})
export class BloqueoCategoriasPropiasDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<BloqueoCategoriasPropiasDialogComponent>>(MatDialogRef);

  cerrar(): void {
    this.dialogRef.close();
  }
}
