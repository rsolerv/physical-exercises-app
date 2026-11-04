import { Component, ElementRef, computed, effect, inject, input, output, resource, signal, untracked, viewChild, viewChildren } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule, MatListOption } from '@angular/material/list';
import { BuscarEjerciciosUseCase } from '../../../../application/casos-uso/buscar-ejercicios.use-case';
import { CategoriaRepositoryPort } from '../../../../application/ports/categoria-repository.port';
import type { Categoria } from '../../../../domain/categoria/categoria.entity';
import type { EjercicioResumen } from '../../../../domain/ejercicio/ejercicio.entity';
import { BusquedaEjerciciosFiltrosComponent } from '../../../compartido/ejercicios/busqueda-ejercicios-filtros.component';
import { CabeceraPaginaComponent } from '../../../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoCargaComponent } from '../../../compartido/ui/estado-carga/estado-carga.component';
import { EstadoVacioComponent } from '../../../compartido/ui/estado-vacio/estado-vacio.component';

const TAMANO_BLOQUE = 50;

@Component({
  imports: [
    MatButtonModule,
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
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly opciones = viewChildren(MatListOption);
  private readonly contador = viewChild<ElementRef<HTMLElement>>('contador');
  private generacion = 0;
  private consulta = { texto: '', categoriaIds: [] as string[] };

  readonly texto = signal('');
  readonly categoriaIdsSeleccionadas = signal<string[]>([]);
  readonly ejercicioIdsSeleccionados = input<string[]>([]);
  readonly errorSeleccion = input<string | null>(null);
  readonly seleccionados = output<{ ejercicioId: string; seleccionado: boolean }>();
  readonly categorias = toSignal(from(this.categoriaRepository.listarTodas()), { initialValue: [] as Categoria[] });
  readonly resultados = signal<EjercicioResumen[]>([]);
  readonly totalResultados = signal(0);
  readonly cargandoInicial = signal(true);
  readonly cargandoMas = signal(false);
  readonly errorInicial = signal<string | null>(null);
  readonly errorMas = signal<string | null>(null);
  readonly anuncio = signal('');
  readonly siguientePagina = signal(0);
  readonly cantidadSeleccionada = computed(() => this.ejercicioIdsSeleccionados().length);
  readonly hayMas = computed(() => this.resultados().length < this.totalResultados());

  protected readonly recursoTotalEjercicios = resource({
    loader: () => this.buscarEjercicios.contarTotal(),
  });
  readonly errorCarga = computed(() => {
    const error = this.recursoTotalEjercicios.error();
    return error ? this.mensajeError(error) : this.errorInicial();
  });

  constructor() {
    effect(() => {
      const texto = this.texto().trim();
      const categoriaIds = this.categoriaIdsSeleccionadas();
      untracked(() => this.reiniciar(texto, [...categoriaIds]));
    });

    effect(() => {
      const ids = new Set(this.ejercicioIdsSeleccionados());
      this.errorSeleccion();
      for (const opcion of this.opciones()) {
        const seleccionado = ids.has(opcion.value);
        if (opcion.selected !== seleccionado) opcion.selected = seleccionado;
      }
    });
  }

  private reiniciar(texto: string, categoriaIds: string[]): void {
    this.generacion++;
    this.consulta = { texto, categoriaIds };
    this.resultados.set([]);
    this.totalResultados.set(0);
    this.siguientePagina.set(0);
    this.errorInicial.set(null);
    this.errorMas.set(null);
    this.anuncio.set('');
    this.cargandoMas.set(false);
    this.cargandoInicial.set(true);
    void this.cargarPagina(0, this.generacion);
  }

  async cargarMas(): Promise<void> {
    if (this.cargandoMas() || this.cargandoInicial() || (!this.hayMas() && !this.errorMas())) return;
    this.cargandoMas.set(true);
    this.errorMas.set(null);
    await this.cargarPagina(this.siguientePagina(), this.generacion);
  }

  reintentar(): void {
    if (this.recursoTotalEjercicios.error()) this.recursoTotalEjercicios.reload();
    if (this.errorInicial()) {
      this.errorInicial.set(null);
      this.cargandoInicial.set(true);
      void this.cargarPagina(0, this.generacion);
    }
  }

  private async cargarPagina(pagina: number, generacion: number): Promise<void> {
    const { texto, categoriaIds } = this.consulta;
    try {
      const bloque = await this.buscarEjercicios.buscarPaginado(texto, categoriaIds, pagina, TAMANO_BLOQUE);
      if (generacion !== this.generacion) return;
      const anteriores = pagina === 0 ? [] : this.resultados();
      const ids = new Set(anteriores.map((ejercicio) => ejercicio.id));
      const incorporados = bloque.resultados.filter((ejercicio) => !ids.has(ejercicio.id));
      this.resultados.set([...anteriores, ...incorporados]);
      this.totalResultados.set(bloque.total);
      this.siguientePagina.set(pagina + 1);
      this.anuncio.set(`Se ${incorporados.length === 1 ? 'ha incorporado' : 'han incorporado'} ${incorporados.length} ${incorporados.length === 1 ? 'ejercicio' : 'ejercicios'}. Mostrando ${this.resultados().length} de ${bloque.total}.`);
      if (pagina > 0) {
        const indiceNuevo = anteriores.length;
        setTimeout(() => {
          if (generacion !== this.generacion) return;
          if (this.resultados().length >= bloque.total) {
            this.contador()?.nativeElement.focus();
          } else {
            this.elemento.nativeElement.querySelectorAll<HTMLElement>('mat-list-option')[indiceNuevo]?.focus();
          }
        }, 0);
      }
    } catch (error) {
      if (generacion !== this.generacion) return;
      if (pagina === 0) this.errorInicial.set(this.mensajeError(error));
      else this.errorMas.set(this.mensajeError(error));
    } finally {
      if (generacion === this.generacion) {
        this.cargandoInicial.set(false);
        this.cargandoMas.set(false);
      }
    }
  }

  protected readonly botonCarga = viewChild<ElementRef<HTMLButtonElement>>('botonCarga');

  cambiarSeleccion(ejercicioId: string, seleccionado: boolean): void {
    if (this.ejercicioIdsSeleccionados().includes(ejercicioId) !== seleccionado) {
      this.seleccionados.emit({ ejercicioId, seleccionado });
    }
  }

  nombresCategorias(ejercicio: EjercicioResumen): string[] {
    const nombresPorId = new Map(this.categorias().map((categoria) => [categoria.id, categoria.nombre]));
    return ejercicio.categoriaIds
      .map((id) => nombresPorId.get(id))
      .filter((nombre): nombre is string => nombre !== undefined);
  }

  private mensajeError(error: unknown): string {
    return error instanceof Error ? error.message : 'No se han podido cargar los ejercicios.';
  }
}
