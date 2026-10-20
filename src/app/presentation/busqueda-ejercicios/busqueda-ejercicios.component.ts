import { Component, HostListener, computed, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BuscarEjerciciosUseCase } from '../../application/casos-uso/buscar-ejercicios.use-case';
import { EjercicioRepositoryPort } from '../../application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import type { Ejercicio, ImagenEjercicio } from '../../domain/ejercicio/ejercicio.entity';
import { CabeceraPaginaComponent } from '../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../compartido/ui/estado-vacio/estado-vacio.component';
import { EstadoCargaComponent } from '../compartido/ui/estado-carga/estado-carga.component';

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
    MatButtonModule,
    CabeceraPaginaComponent,
    EstadoVacioComponent,
    EstadoCargaComponent,
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
  readonly esEscritorio = signal(esPantallaEscritorio());
  readonly ejercicioSeleccionadoId = signal<string | null>(null);

  readonly categorias = toSignal(from(this.categoriaRepository.listarTodas()), { initialValue: [] as Categoria[] });
  readonly errorCarga = computed(() => {
    const error = this.recursoTotalEjercicios.error() ?? this.recursoResultados.error();
    if (!error) return null;
    return error instanceof Error ? error.message : 'No se han podido cargar los ejercicios.';
  });
  readonly ejercicioSeleccionado = computed(
    () => this.recursoResultados.value()?.find((ejercicio) => ejercicio.id === this.ejercicioSeleccionadoId()) ?? null
  );

  protected readonly recursoTotalEjercicios = resource({
    loader: () => this.ejercicioRepository.listarTodos(),
  });

  protected readonly recursoResultados = resource({
    params: () => ({ texto: this.texto(), categoriaIds: this.categoriaIdsSeleccionadas() }),
    loader: ({ params }) => this.buscarEjercicios.buscar(params.texto, params.categoriaIds),
  });

  constructor() {
    this.actualizarAncho();
  }

  @HostListener('window:resize')
  actualizarAncho(): void {
    this.esEscritorio.set(esPantallaEscritorio());
  }

  limpiarCategorias(): void {
    this.categoriaIdsSeleccionadas.set([]);
  }

  alternarCategoria(categoriaId: string): void {
    this.categoriaIdsSeleccionadas.update((actuales) =>
      actuales.includes(categoriaId) ? actuales.filter((id) => id !== categoriaId) : [...actuales, categoriaId]
    );
  }

  seleccionarEjercicio(evento: MouseEvent, ejercicioId: string): void {
    this.ejercicioSeleccionadoId.set(ejercicioId);
    if (this.esEscritorio()) evento.preventDefault();
  }

  nombresCategorias(ejercicio: Ejercicio): string[] {
    const nombresPorId = new Map(this.categorias().map((categoria) => [categoria.id, categoria.nombre]));
    return ejercicio.categoriaIds.map((id) => nombresPorId.get(id) ?? 'Sin categoría');
  }

  imagenSrc(imagen: ImagenEjercicio): string {
    if (imagen.tipo === 'url') return imagen.valorUrl ?? '';
    return `data:${imagen.tipoMime ?? 'application/octet-stream'};base64,${imagen.contenidoBase64 ?? ''}`;
  }
}

function esPantallaEscritorio(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1280px)').matches === true;
}
