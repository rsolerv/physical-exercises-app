import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

/**
 * Prototipo de Storybook del mensaje bloqueante que sustituye al diálogo
 * "Asignar categoría" cuando el usuario no tiene ninguna categoría propia
 * (contracts/interfaz-usuario.md, FR-010). Solo para revisión visual.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- prefijo proto- reservado a prototipos aislados de Storybook.
  selector: 'proto-bloqueo-categorias-propias-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, RouterLink],
  templateUrl: './proto-bloqueo-categorias-propias-dialog.component.html',
})
export class ProtoBloqueoCategoriasPropiasDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ProtoBloqueoCategoriasPropiasDialogComponent>);

  cerrar(): void {
    this.dialogRef.close();
  }
}
