import { Component, computed, inject, output, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { BuscarEjerciciosUseCase } from '../../../../application/casos-uso/buscar-ejercicios.use-case';
import { CategoriaRepositoryPort } from '../../../../application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../../../../application/ports/ejercicio-repository.port';
import { Categoria } from '../../../../domain/categoria/categoria.entity';
import { Ejercicio } from '../../../../domain/ejercicio/ejercicio.entity';
import { MatListModule } from '@angular/material/list';
import { BusquedaEjerciciosFiltrosComponent } from '../../../compartido/ejercicios/busqueda-ejercicios-filtros.component';
import { EjercicioListItemComponent } from '../../../compartido/ejercicios/ejercicio-list-item.component';
import { CabeceraPaginaComponent } from '../../../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoCargaComponent } from '../../../compartido/ui/estado-carga/estado-carga.component';
import { EstadoVacioComponent } from '../../../compartido/ui/estado-vacio/estado-vacio.component';
import { MatChip } from '@angular/material/chips';

@Component({
  imports: [
    MatListModule,
    CabeceraPaginaComponent,
    EstadoVacioComponent,
    EstadoCargaComponent,
    BusquedaEjerciciosFiltrosComponent,
],
  selector: 'app-agregar-ejercicio',
  styleUrl: './agregar-ejercicio.component.scss',
  templateUrl: './agregar-ejercicio.component.html',
})
export class AgregarEjercicioComponent {

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

readonly seleccionados = output<string[]>();

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
