import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import type { CategoriaComun } from '../../../app/application/ports/repositorio-comun.port';
import type { Categoria } from '../../../app/domain/categoria/categoria.entity';

export interface DatosMapearCategoriaImportadaDialog {
  /** Una fila por cada categoría común seleccionada que no coincide por nombre con ninguna propia (FR-009). */
  categoriasPendientes: CategoriaComun[];
  /** Categorías propias del usuario que puede elegir en cada fila. */
  categoriasPropias: Categoria[];
}

/**
 * Prototipo de Storybook del diálogo "Asignar categoría" (contracts/interfaz-usuario.md).
 * Solo para revisión visual: no está conectado a ningún caso de uso real.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- prefijo proto- reservado a prototipos aislados de Storybook.
  selector: 'proto-mapear-categoria-importada-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './proto-mapear-categoria-importada-dialog.component.html',
  styleUrl: './proto-mapear-categoria-importada-dialog.component.scss',
})
export class ProtoMapearCategoriaImportadaDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<ProtoMapearCategoriaImportadaDialogComponent, Map<string, string> | undefined>>(MatDialogRef);
  protected readonly datos = inject<DatosMapearCategoriaImportadaDialog>(MAT_DIALOG_DATA);

  private readonly seleccion = signal<Record<string, string>>({});

  readonly puedeContinuar = computed(() =>
    this.datos.categoriasPendientes.every((categoria) => !!this.seleccion()[categoria.id])
  );

  valorElegido(categoriaComunId: string): string | null {
    return this.seleccion()[categoriaComunId] ?? null;
  }

  elegir(categoriaComunId: string, categoriaLocalId: string): void {
    this.seleccion.update((actual) => ({ ...actual, [categoriaComunId]: categoriaLocalId }));
  }

  continuar(): void {
    if (!this.puedeContinuar()) return;
    this.dialogRef.close(new Map(Object.entries(this.seleccion())));
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }
}
