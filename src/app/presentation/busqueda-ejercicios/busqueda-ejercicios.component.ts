import { Component, computed, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { BuscarEjerciciosUseCase } from '../../application/casos-uso/buscar-ejercicios.use-case';
import { EjercicioRepositoryPort } from '../../application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import type { Ejercicio } from '../../domain/ejercicio/ejercicio.entity';
import { CabeceraPaginaComponent } from '../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../compartido/ui/estado-vacio/estado-vacio.component';
import { EstadoCargaComponent } from '../compartido/ui/estado-carga/estado-carga.component';
import { BusquedaEjerciciosFiltrosComponent } from '../compartido/ejercicios/busqueda-ejercicios-filtros.component';
import { EjercicioListItemComponent } from '../compartido/ejercicios/ejercicio-list-item.component';

/**
 * Búsqueda de ejercicios por texto libre y/o categoría (Historia de Usuario
 * 2, FR-012, FR-013). Distingue entre "no hay ningún ejercicio en la
 * biblioteca" (FR-029, CL1) y "no hay resultados para este filtro" (FR-031).
 */
@Component({
  selector: 'app-busqueda-ejercicios',
  standalone: true,
  imports: [
    MatListModule,
    CabeceraPaginaComponent,
    EstadoVacioComponent,
    EstadoCargaComponent,
    BusquedaEjerciciosFiltrosComponent,
    EjercicioListItemComponent,
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
  readonly errorCarga = computed(() => {
    const error = this.recursoTotalEjercicios.error() ?? this.recursoResultados.error();
    if (!error) return null;
    return error instanceof Error ? error.message : 'No se han podido cargar los ejercicios.';
  });

  protected readonly recursoTotalEjercicios = resource({
    loader: () => this.ejercicioRepository.listarTodos(),
  });

  protected readonly recursoResultados = resource({
    params: () => ({ texto: this.texto(), categoriaIds: this.categoriaIdsSeleccionadas() }),
    loader: ({ params }) => this.buscarEjercicios.buscar(params.texto, params.categoriaIds),
  });

  nombresCategorias(ejercicio: Ejercicio): string[] {
    const nombresPorId = new Map(this.categorias().map((categoria) => [categoria.id, categoria.nombre]));
    return ejercicio.categoriaIds.map((id) => nombresPorId.get(id) ?? 'Sin categoría');
  }
}
