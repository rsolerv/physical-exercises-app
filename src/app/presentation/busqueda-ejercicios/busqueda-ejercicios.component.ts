import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { BuscarEjerciciosUseCase } from '../../application/casos-uso/buscar-ejercicios.use-case';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import type { EjercicioResumen } from '../../domain/ejercicio/ejercicio.entity';
import { EstadoVacioComponent } from '../compartido/ui/estado-vacio/estado-vacio.component';
import { EstadoCargaComponent } from '../compartido/ui/estado-carga/estado-carga.component';
import { BusquedaEjerciciosFiltrosComponent } from '../compartido/ejercicios/busqueda-ejercicios-filtros.component';
import { EjercicioListItemComponent } from '../compartido/ejercicios/ejercicio-list-item.component';
import { BusquedaEjerciciosEstadoService } from './busqueda-ejercicios-estado.service';

function paginadorEnEspanol(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Resultados por página:';
  intl.nextPageLabel = 'Página siguiente';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel = 'Primera página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (pagina, tamano, total) => {
    if (total === 0) return '0 de 0';
    const inicio = pagina * tamano;
    return `${inicio + 1}–${Math.min(inicio + tamano, total)} de ${total}`;
  };
  return intl;
}

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
    MatPaginator,
    MatButtonModule,
    EstadoVacioComponent,
    EstadoCargaComponent,
    BusquedaEjerciciosFiltrosComponent,
    EjercicioListItemComponent,
  ],
  providers: [{ provide: MatPaginatorIntl, useFactory: paginadorEnEspanol }],
  templateUrl: './busqueda-ejercicios.component.html',
  styleUrl: './busqueda-ejercicios.component.scss',
})
export class BusquedaEjerciciosComponent {
  private readonly buscarEjercicios = inject(BuscarEjerciciosUseCase);
  private readonly estado = inject(BusquedaEjerciciosEstadoService);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);

  readonly texto = this.estado.texto;
  readonly categoriaIdsSeleccionadas = this.estado.categoriaIds;
  readonly pagina = this.estado.pagina;
  readonly tamanoPagina = this.estado.tamanoPagina;
  readonly totalVisible = signal(0);
  readonly anuncioResultados = computed(() => {
    if (!this.recursoResultados.hasValue()) return '';
    const total = this.recursoResultados.value().total;
    if (total === 0) return 'No hay coincidencias.';
    const inicio = this.pagina() * this.tamanoPagina();
    return `Mostrando ${inicio + 1}–${Math.min(inicio + this.tamanoPagina(), total)} de ${total} ejercicios.`;
  });

  readonly categorias = toSignal(from(this.categoriaRepository.listarTodas()), { initialValue: [] as Categoria[] });
  readonly errorCarga = computed(() => {
    const error = this.recursoTotalEjercicios.error() ?? this.recursoResultados.error();
    if (!error) return null;
    return error instanceof Error ? error.message : 'No se han podido cargar los ejercicios.';
  });

  protected readonly recursoTotalEjercicios = resource({ loader: () => this.buscarEjercicios.contarTotal() });

  protected readonly recursoResultados = resource({
    params: () => ({
      texto: this.texto(), categoriaIds: this.categoriaIdsSeleccionadas(),
      pagina: this.pagina(), tamanoPagina: this.tamanoPagina(),
    }),
    loader: ({ params }) => this.buscarEjercicios.buscarPaginado(
      params.texto, params.categoriaIds, params.pagina, params.tamanoPagina
    ),
  });

  constructor() {
    effect(() => {
      const resultado = this.recursoResultados.hasValue() ? this.recursoResultados.value() : null;
      if (resultado) {
        this.totalVisible.set(resultado.total);
      }
      if (resultado && resultado.total > 0) {
        const ultimaPagina = Math.ceil(resultado.total / this.tamanoPagina()) - 1;
        if (this.pagina() > ultimaPagina) this.pagina.set(ultimaPagina);
      }
    });
  }

  actualizarTexto(texto: string): void {
    this.totalVisible.set(0);
    this.pagina.set(0);
    this.texto.set(texto);
  }

  actualizarCategorias(ids: string[]): void {
    this.totalVisible.set(0);
    this.pagina.set(0);
    this.categoriaIdsSeleccionadas.set(ids);
  }

  cambiarPagina(evento: PageEvent): void {
    if (evento.pageSize !== this.tamanoPagina()) {
      this.pagina.set(0);
      this.tamanoPagina.set(evento.pageSize);
    } else {
      this.pagina.set(evento.pageIndex);
    }
  }

  reintentar(): void {
    this.recursoTotalEjercicios.reload();
    this.recursoResultados.reload();
  }

  nombresCategorias(ejercicio: EjercicioResumen): string[] {
    const nombresPorId = new Map(this.categorias().map((categoria) => [categoria.id, categoria.nombre]));
    return ejercicio.categoriaIds
      .map((id) => nombresPorId.get(id))
      .filter((nombre): nombre is string => nombre !== undefined);
  }
}
