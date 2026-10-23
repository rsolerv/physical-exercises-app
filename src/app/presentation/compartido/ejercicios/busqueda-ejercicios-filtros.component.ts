import { Component, input, model } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { Categoria } from '../../../domain/categoria/categoria.entity';
import { CabeceraPaginaComponent } from '../ui/cabecera-pagina/cabecera-pagina.component';

@Component({
  selector: 'app-busqueda-ejercicios-filtros',
  standalone: true,
  imports: [MatChipsModule, MatFormFieldModule, MatIconModule, MatInputModule, CabeceraPaginaComponent],
  templateUrl: './busqueda-ejercicios-filtros.component.html',
  styleUrl: './busqueda-ejercicios-filtros.component.scss',
})
export class BusquedaEjerciciosFiltrosComponent {
  readonly categorias = input<Categoria[]>([]);
  readonly fijados = input(false);
  readonly texto = model('');
  readonly categoriaIdsSeleccionadas = model<string[]>([]);

  limpiarCategorias(): void {
    this.categoriaIdsSeleccionadas.set([]);
  }

  alternarCategoria(categoriaId: string): void {
    this.categoriaIdsSeleccionadas.update((actuales) =>
      actuales.includes(categoriaId) ? actuales.filter((id) => id !== categoriaId) : [...actuales, categoriaId]
    );
  }
}
