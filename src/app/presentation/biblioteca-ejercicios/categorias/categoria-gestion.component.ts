import { Component, inject, resource, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoriaRepositoryPort } from '../../../application/ports/categoria-repository.port';
import { GestionarCategoriaUseCase } from '../../../application/casos-uso/gestionar-categoria.use-case';
import { ErrorNombreDuplicado, ErrorOperacionNoPermitida } from '../../../domain/errores/errores-dominio';
import { CabeceraPaginaComponent } from '../../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { MensajeFeedbackService } from '../../compartido/ui/mensaje-feedback.service';

/**
 * Gestión de categorías (Historia de Usuario 1): listado alfabético, alta y
 * eliminación con aviso de retirada automática a "Sin categoría" (FR-009,
 * FR-010, FR-011).
 */
@Component({
  selector: 'app-categoria-gestion',
  standalone: true,
  imports: [
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CabeceraPaginaComponent,
  ],
  templateUrl: './categoria-gestion.component.html',
  styleUrl: './categoria-gestion.component.scss',
})
export class CategoriaGestionComponent {
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly gestionarCategoria = inject(GestionarCategoriaUseCase);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);

  private readonly recursoCategorias = resource({
    loader: () => this.categoriaRepository.listarTodas(),
  });

  readonly categorias = () => [...(this.recursoCategorias.value() ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre));
  readonly nombreNuevaCategoria = signal('');
  readonly errorCreacion = signal<string | null>(null);
  readonly errorEliminacion = signal<string | null>(null);
  readonly errorEdicion = signal<string | null>(null);
  readonly confirmacionCreacion = signal<string | null>(null);
  readonly confirmacionEliminacion = signal<string | null>(null);
  readonly confirmacionCategoria = signal<{ id: string; mensaje: string } | null>(null);
  readonly categoriaEnEdicion = signal<string | null>(null);
  readonly nombreCategoriaEditada = signal('');

  async crearCategoria(nombre: string): Promise<void> {
    this.errorCreacion.set(null);
    this.confirmacionCreacion.set(null);
    try {
      await this.gestionarCategoria.crear(nombre);
      this.nombreNuevaCategoria.set('');
      this.recursoCategorias.reload();
      this.confirmacionCreacion.set('Categoría creada.');
      this.mensajeFeedback.mostrarExito('Categoría creada.');
    } catch (error) {
      const mensaje = error instanceof ErrorNombreDuplicado ? error.message : 'No se ha podido crear la categoría.';
      this.errorCreacion.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
    }
  }

  async eliminarCategoria(id: string): Promise<void> {
    this.errorEliminacion.set(null);
    this.confirmacionEliminacion.set(null);
    const categoria = this.categorias().find((c) => c.id === id);
    if (categoria?.esGenerica) {
      this.errorEliminacion.set('La categoría "Sin categoría" no se puede eliminar.');
      return;
    }
    try {
      await this.gestionarCategoria.eliminar(id);
      this.recursoCategorias.reload();
      this.confirmacionEliminacion.set('Categoría eliminada.');
      this.mensajeFeedback.mostrarExito('Categoría eliminada.');
    } catch (error) {
      const mensaje = error instanceof ErrorOperacionNoPermitida ? error.message : 'No se ha podido eliminar la categoría.';
      this.errorEliminacion.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
    }
  }

  iniciarEdicionCategoria(id: string): void {
    const categoria = this.categorias().find((item) => item.id === id);
    if (!categoria || categoria.esGenerica) return;
    this.errorEdicion.set(null);
    this.confirmacionCategoria.set(null);
    this.categoriaEnEdicion.set(id);
    this.nombreCategoriaEditada.set(categoria.nombre);
  }

  cancelarEdicionCategoria(): void {
    this.categoriaEnEdicion.set(null);
    this.errorEdicion.set(null);
  }

  async guardarEdicionCategoria(id: string): Promise<void> {
    this.errorEdicion.set(null);
    this.confirmacionCategoria.set(null);
    try {
      const actualizada = await this.gestionarCategoria.actualizar(id, { nombre: this.nombreCategoriaEditada() });
      this.categoriaEnEdicion.set(null);
      this.recursoCategorias.reload();
      this.confirmacionCategoria.set({ id, mensaje: `Categoría «${actualizada.nombre}» actualizada.` });
      this.mensajeFeedback.mostrarExito('Categoría actualizada.');
    } catch (error) {
      const mensaje = error instanceof ErrorNombreDuplicado ? error.message : 'No se ha podido actualizar la categoría.';
      this.errorEdicion.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
    }
  }
}
