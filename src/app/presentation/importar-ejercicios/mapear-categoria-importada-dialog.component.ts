import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import type { CategoriaComun } from '../../application/ports/repositorio-comun.port';
import type { Categoria } from '../../domain/categoria/categoria.entity';

export interface DatosMapearCategoriaImportadaDialog {
  pendientes: CategoriaComun[];
  categoriasLocales: Categoria[];
}

@Component({
  selector: 'app-mapear-categoria-importada-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './mapear-categoria-importada-dialog.component.html',
  styleUrl: './mapear-categoria-importada-dialog.component.scss',
})
export class MapearCategoriaImportadaDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<MapearCategoriaImportadaDialogComponent, Map<string, string> | null>>(MatDialogRef);
  protected readonly datos = inject<DatosMapearCategoriaImportadaDialog>(MAT_DIALOG_DATA);
  private readonly seleccion = signal<Record<string, string>>({});

  readonly todasResueltas = computed(() =>
    this.datos.pendientes.every((categoria) => Boolean(this.seleccion()[categoria.id]))
  );

  valorElegido(categoriaComunId: string): string | null {
    return this.seleccion()[categoriaComunId] ?? null;
  }

  elegir(categoriaComunId: string, categoriaLocalId: string): void {
    this.seleccion.update((actual) => ({ ...actual, [categoriaComunId]: categoriaLocalId }));
  }

  continuar(): void {
    if (!this.todasResueltas()) return;
    this.dialogRef.close(new Map(Object.entries(this.seleccion())));
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
