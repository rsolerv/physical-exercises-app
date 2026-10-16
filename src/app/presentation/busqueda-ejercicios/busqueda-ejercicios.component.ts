import { Component, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BuscarEjerciciosUseCase } from '../../application/casos-uso/buscar-ejercicios.use-case';
import { EjercicioRepositoryPort } from '../../application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import { CabeceraPaginaComponent } from '../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../compartido/ui/estado-vacio/estado-vacio.component';

/**
 * Búsqueda de ejercicios por texto libre y/o categoría (Historia de Usuario
 * 2, FR-012, FR-013). Distingue entre "no hay ningún ejercicio en la
 * biblioteca" (FR-029, CL1) y "no hay resultados para este filtro" (FR-031).
 */
@Component({
  selector: 'app-busqueda-ejercicios',
  standalone: true,
  imports: [
    RouterLink,
    MatListModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CabeceraPaginaComponent,
    EstadoVacioComponent,
  ],
  templateUrl: './busqueda-ejercicios.component.html',
  styleUrl: './busqueda-ejercicios.component.scss',
})
export class BusquedaEjerciciosComponent {
  private readonly buscarEjercicios = inject(BuscarEjerciciosUseCase);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);

  readonly texto = signal('');
  readonly categoriaIdsSeleccionadas = signal<string[]>([]);

  readonly categorias = toSignal(from(this.categoriaRepository.listarTodas()), { initialValue: [] as Categoria[] });

  protected readonly recursoTotalEjercicios = resource({
    loader: () => this.ejercicioRepository.listarTodos(),
  });

  protected readonly recursoResultados = resource({
    params: () => ({ texto: this.texto(), categoriaIds: this.categoriaIdsSeleccionadas() }),
    loader: ({ params }) => this.buscarEjercicios.buscar(params.texto, params.categoriaIds),
  });

  alternarCategoria(categoriaId: string): void {
    this.categoriaIdsSeleccionadas.update((actuales) =>
      actuales.includes(categoriaId) ? actuales.filter((id) => id !== categoriaId) : [...actuales, categoriaId]
    );
  }
}
