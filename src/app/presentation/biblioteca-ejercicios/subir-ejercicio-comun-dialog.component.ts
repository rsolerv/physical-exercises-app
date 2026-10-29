import { Component, computed, inject, resource, signal } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SubirEjercicioComunUseCase } from '../../application/casos-uso/subir-ejercicio-comun.use-case';
import type { Ejercicio } from '../../domain/ejercicio/ejercicio.entity';

export interface DatosSubirEjercicioComunDialog {
  ejercicio: Ejercicio;
}

type PasoDialogoSubida = 'categorias' | 'confirmar' | 'duplicado' | 'enviando';

/**
 * Diálogo "Subir al repositorio común" (Historia de Usuario 2, FR-016 a
 * FR-019, FR-022): elegir una o varias categorías comunes, comprobar
 * duplicado por nombre y confirmar explícitamente antes de enviar.
 */
@Component({
  selector: 'app-subir-ejercicio-comun-dialog',
  standalone: true,
  imports: [MatDialogModule, MatListModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './subir-ejercicio-comun-dialog.component.html',
  styleUrl: './subir-ejercicio-comun-dialog.component.scss',
})
export class SubirEjercicioComunDialogComponent {
  private readonly subirEjercicioComun = inject(SubirEjercicioComunUseCase);
  private readonly dialogRef = inject<MatDialogRef<SubirEjercicioComunDialogComponent, boolean>>(MatDialogRef);
  protected readonly datos = inject<DatosSubirEjercicioComunDialog>(MAT_DIALOG_DATA);

  protected readonly recursoCategoriasComunes = resource({
    loader: () => this.subirEjercicioComun.listarCategoriasComunes(),
  });

  readonly paso = signal<PasoDialogoSubida>('categorias');
  readonly categoriaIdsSeleccionadas = signal<string[]>([]);
  readonly error = signal<string | null>(null);

  readonly puedeContinuar = computed(() => this.categoriaIdsSeleccionadas().length > 0);

  alternarCategoria(categoriaId: string): void {
    this.categoriaIdsSeleccionadas.update((actuales) =>
      actuales.includes(categoriaId) ? actuales.filter((id) => id !== categoriaId) : [...actuales, categoriaId]
    );
  }

  async continuar(): Promise<void> {
    if (!this.puedeContinuar()) return;
    this.error.set(null);
    try {
      const duplicado = await this.subirEjercicioComun.comprobarDuplicado(this.datos.ejercicio.nombre);
      this.paso.set(duplicado ? 'duplicado' : 'confirmar');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se ha podido comprobar el nombre en el repositorio común.');
    }
  }

  async confirmar(): Promise<void> {
    this.paso.set('enviando');
    this.error.set(null);
    try {
      await this.subirEjercicioComun.subir(this.datos.ejercicio, this.categoriaIdsSeleccionadas());
      this.dialogRef.close(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se ha podido enviar el ejercicio al repositorio común.');
      this.paso.set('confirmar');
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
