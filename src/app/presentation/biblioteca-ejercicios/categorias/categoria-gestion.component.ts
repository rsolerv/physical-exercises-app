import { Component, inject, resource, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CategoriaRepositoryPort } from '../../../application/ports/categoria-repository.port';
import { GestionarCategoriaUseCase } from '../../../application/casos-uso/gestionar-categoria.use-case';
import { ErrorNombreDuplicado, ErrorOperacionNoPermitida } from '../../../domain/errores/errores-dominio';

/**
 * Gestión de categorías (Historia de Usuario 1): listado alfabético, alta y
 * eliminación con aviso de retirada automática a "Sin categoría" (FR-009,
 * FR-010, FR-011).
 */
@Component({
  selector: 'app-categoria-gestion',
  standalone: true,
  imports: [MatListModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './categoria-gestion.component.html',
})
export class CategoriaGestionComponent {
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly gestionarCategoria = inject(GestionarCategoriaUseCase);

  private readonly recursoCategorias = resource({
    loader: () => this.categoriaRepository.listarTodas(),
  });

  readonly categorias = () => [...(this.recursoCategorias.value() ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre));
  readonly nombreNuevaCategoria = signal('');
  readonly errorCreacion = signal<string | null>(null);
  readonly errorEliminacion = signal<string | null>(null);

  async crearCategoria(nombre: string): Promise<void> {
    this.errorCreacion.set(null);
    try {
      await this.gestionarCategoria.crear(nombre);
      this.nombreNuevaCategoria.set('');
      this.recursoCategorias.reload();
    } catch (error) {
      if (error instanceof ErrorNombreDuplicado) {
        this.errorCreacion.set(error.message);
      } else {
        this.errorCreacion.set('No se ha podido crear la categoría.');
      }
    }
  }

  async eliminarCategoria(id: string): Promise<void> {
    this.errorEliminacion.set(null);
    const categoria = this.categorias().find((c) => c.id === id);
    if (categoria?.esGenerica) {
      this.errorEliminacion.set('La categoría "Sin categoría" no se puede eliminar.');
      return;
    }
    try {
      await this.gestionarCategoria.eliminar(id);
      this.recursoCategorias.reload();
    } catch (error) {
      if (error instanceof ErrorOperacionNoPermitida) {
        this.errorEliminacion.set(error.message);
      } else {
        this.errorEliminacion.set('No se ha podido eliminar la categoría.');
      }
    }
  }
}
