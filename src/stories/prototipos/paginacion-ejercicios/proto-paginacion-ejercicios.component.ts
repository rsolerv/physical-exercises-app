import { Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { CabeceraPaginaComponent } from '../../../app/presentation/compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { BusquedaEjerciciosFiltrosComponent } from '../../../app/presentation/compartido/ejercicios/busqueda-ejercicios-filtros.component';
import { EjercicioListItemComponent } from '../../../app/presentation/compartido/ejercicios/ejercicio-list-item.component';
import type { Ejercicio } from '../../../app/domain/ejercicio/ejercicio.entity';

/**
 * SOLO Storybook: no consulta el repositorio ni sustituye la presentación real.
 * La fixture imita páginas SQL y bloques independientes para revisar el contrato visual.
 */
export interface EscenarioPaginacion {
  modo: 'buscar' | 'selector';
  total: 0 | 49 | 50 | 51 | 125;
  pagina?: number;
  tamano?: 25 | 50 | 100;
  bloques?: number;
  estado?: 'carga-inicial' | 'carga-adicional' | 'error-inicial' | 'error-adicional' | 'exito';
  dia?: 'lunes' | 'martes';
  /** Selecciones anteriores en páginas no visibles, para probar el contador global. */
  asignados?: number[];
}

const NOMBRES = [
  'Sentadilla asistida', 'Movilidad de hombros', 'Puente de glúteos', 'Paseo a ritmo suave',
  'Elevación de talones', 'Estiramiento de gemelos', 'Plancha lateral', 'Rotación de cadera',
  'Respiración diafragmática', 'Flexión de rodilla sentado',
];
const CATEGORIAS = ['Fuerza', 'Movilidad', 'Cardio', 'Estiramientos'];

export class PaginadorEspanolStory extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Ejercicios por página';
  override nextPageLabel = 'Página siguiente';
  override previousPageLabel = 'Página anterior';
  override firstPageLabel = 'Primera página';
  override lastPageLabel = 'Última página';
  override getRangeLabel = (page: number, pageSize: number, length: number): string =>
    length === 0 ? '0 de 0' : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, length)} de ${length}`;
}

@Component({
  selector: 'app-proto-paginacion-ejercicios',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatListModule, MatPaginator, CabeceraPaginaComponent,
    BusquedaEjerciciosFiltrosComponent, EjercicioListItemComponent,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: PaginadorEspanolStory }],
  template: `
    <section class="busqueda-ejercicios" [class.selector]="escenario().modo === 'selector'">
      @if (escenario().modo === 'selector') {
        <app-cabecera-pagina titulo="Añadir ejercicios a planificación" descripcion="Filtra por categoría o por texto libre." />
      }
      <app-busqueda-ejercicios-filtros [categorias]="categoriasDemo"
        [fijados]="escenario().modo === 'buscar'"
        [texto]="texto()" (textoChange)="cambiarTexto($event)"
        [categoriaIdsSeleccionadas]="categoriaIds()"
        (categoriaIdsSeleccionadasChange)="cambiarCategorias($event)" />
      @if (escenario().modo === 'selector') {
        <p class="contador" aria-live="polite">{{ asignados().size }} ejercicios en este día</p>
      }

      @if (cargandoInicial()) {
        <div class="estado" role="status">Cargando ejercicios…</div>
      } @else if (errorInicial()) {
        <div class="estado" role="alert">No se han podido cargar los ejercicios.
          <button mat-stroked-button (click)="reintentar()">Reintentar</button>
        </div>
      } @else if (totalFiltrado() === 0) {
        <div class="estado">
          <mat-icon aria-hidden="true">search_off</mat-icon>
          <p>{{ texto() || categoriaIds().length ? 'No hay coincidencias con estos filtros.' : 'No hay ejercicios registrados todavía.' }}</p>
        </div>
      } @else {
        <div class="busqueda-ejercicios__disposicion">
          @if (escenario().modo === 'selector') {
            <mat-selection-list class="busqueda-ejercicios__resultados" aria-label="Resultados de ejercicios">
              @for (indice of indices(); track indice) {
                <mat-list-option class="agregar-ejercicio__opcion" [value]="indice" [selected]="asignados().has(indice)"
                  [attr.data-proto-index]="indice"
                  (selectedChange)="seleccionar(indice, $event)">
                  <span matListItemTitle>{{ nombre(indice) }}</span>
                  <span matListItemLine class="agregar-ejercicio__descripcion">{{ descripcion(indice) }}</span>
                  <span matListItemLine class="agregar-ejercicio__categorias">{{ CATEGORIAS[indice % CATEGORIAS.length] }}</span>
                </mat-list-option>
              }
            </mat-selection-list>
          } @else {
            <mat-nav-list class="busqueda-ejercicios__resultados" aria-label="Resultados de ejercicios">
              @for (indice of indices(); track indice) {
                <app-ejercicio-list-item [ejercicio]="ejercicioDemo(indice)"
                  [nombresCategorias]="[CATEGORIAS[indice % CATEGORIAS.length]]" />
              }
            </mat-nav-list>
          }
        </div>
        @if (escenario().modo === 'buscar') {
          <mat-paginator [length]="totalFiltrado()" [pageIndex]="pagina()" [pageSize]="tamano()"
            [pageSizeOptions]="[25, 50, 100]" [hidePageSize]="movil()"
            [disabled]="cargandoAdicional()" (page)="cambiarPagina($event)"
            aria-label="Páginas de resultados de ejercicios" />
          @if (cargandoAdicional()) { <p role="status">Cargando página…</p> }
          @if (errorAdicional()) {
            <p class="error" role="alert">No se ha podido cargar la página.
              <button mat-stroked-button (click)="reintentar()">Reintentar</button>
            </p>
          }
        } @else {
          <footer class="pie">
            <p>Mostrando {{ indices().length }} de {{ totalFiltrado() }}</p>
            @if (indices().length < totalFiltrado()) {
              <button mat-stroked-button class="cargar" [disabled]="cargandoAdicional()"
                (click)="cargarMas()">
                {{ cargandoAdicional() ? 'Cargando…' : 'Cargar ' + Math.min(50, totalFiltrado() - indices().length) + ' más' }}
              </button>
            }
            @if (errorAdicional()) {
              <p class="error" role="alert">No se han podido cargar más ejercicios.
                <button mat-button (click)="reintentar()">Reintentar</button>
              </p>
            }
          </footer>
        }
      }
      <p class="anuncio" aria-live="polite">{{ anuncio() }}</p>
    </section>
  `,
  styles: [`
    .busqueda-ejercicios { overflow-x: clip; }
    .busqueda-ejercicios__disposicion { min-width: 0; }
    .busqueda-ejercicios__resultados { min-width: 0; padding-top: 255px; }
    .selector .busqueda-ejercicios__resultados { padding-top: 0; width: 100%; }
    .selector .busqueda-ejercicios__disposicion { width: 100%; }
    .agregar-ejercicio__opcion { box-sizing: border-box; max-width: 100%; min-height: 0; overflow: visible; width: 100%; }
    :host ::ng-deep .agregar-ejercicio__opcion.mdc-list-item--with-three-lines {
      height: auto !important; min-height: 0 !important; border-bottom: 1px solid #2969966b; padding: 12px;
    }
    :host ::ng-deep .agregar-ejercicio__opcion .mdc-list-item__content {
      box-sizing: border-box; display: block; height: auto !important; max-width: 100%; min-width: 0;
      overflow: visible; padding-block: 8px; width: 100%;
    }
    :host ::ng-deep .agregar-ejercicio__opcion .mdc-list-item__primary-text,
    :host ::ng-deep .agregar-ejercicio__opcion .mat-mdc-list-item-line {
      display: block; max-width: 100%; min-width: 0; overflow: visible;
      white-space: normal !important; text-overflow: clip; overflow-wrap: anywhere;
    }
    .agregar-ejercicio__descripcion { color: var(--mat-sys-on-surface-variant); line-height: 1.5; }
    .agregar-ejercicio__categorias { color: var(--mat-sys-primary); font-size: 12px; }
    @media (max-width: 599px) { .busqueda-ejercicios__resultados { padding-top: 210px; } }
    .contador { margin: 8px 0; font: var(--mat-sys-label-large); color: var(--mat-sys-on-surface-variant); }
    .estado { padding: 32px 16px; border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-low); }
    .pie { display: grid; justify-items: center; gap: 16px; padding-block: 16px; text-align: center; }
    .pie p { margin: 0; }
    .error { color: var(--mat-sys-error); }
    .anuncio { position: absolute; width: 1px; height: 1px; overflow: hidden;
      clip-path: inset(50%); white-space: nowrap; }
    @media (max-width: 599px) { .cargar { width: 100%; min-height: 48px; } }
  `],
})
export class ProtoPaginacionEjerciciosComponent {
  // El router de Storybook puede pintar un ciclo antes de entregar el escenario.
  readonly escenario = input<EscenarioPaginacion>({ modo: 'buscar', total: 125 });
  private readonly lector = inject(LiveAnnouncer);
  protected readonly CATEGORIAS = CATEGORIAS;
  protected readonly Math = Math;
  protected readonly categoriasDemo = CATEGORIAS.map((nombre) => ({ id: nombre, nombre, descripcion: '' }));
  protected readonly movil = signal(typeof window !== 'undefined' && window.innerWidth < 600);
  protected readonly texto = signal('');
  protected readonly categoriaIds = signal<string[]>([]);
  protected readonly pagina = signal(0);
  protected readonly tamano = signal(50);
  protected readonly mostrados = signal(50);
  protected readonly asignados = signal<Set<number>>(new Set());
  protected readonly cargandoInicial = signal(false);
  protected readonly cargandoAdicional = signal(false);
  protected readonly errorInicial = signal(false);
  protected readonly errorAdicional = signal(false);
  protected readonly anuncio = signal('');
  protected readonly totalFiltrado = computed(() => {
    const total = this.escenario().total;
    if (!this.texto() && !this.categoriaIds().length) return total;
    return Array.from({ length: total }, (_, i) => i)
      .filter((i) => (!this.texto() || this.nombre(i).toLocaleLowerCase('es').includes(this.texto().toLocaleLowerCase('es'))) &&
        (!this.categoriaIds().length || this.categoriaIds().includes(CATEGORIAS[i % CATEGORIAS.length]))).length;
  });
  protected readonly indices = computed(() => {
    const total = this.escenario().total;
    const filtrados = Array.from({ length: total }, (_, i) => i)
      .filter((i) => (!this.texto() || this.nombre(i).toLocaleLowerCase('es').includes(this.texto().toLocaleLowerCase('es'))) &&
        (!this.categoriaIds().length || this.categoriaIds().includes(CATEGORIAS[i % CATEGORIAS.length])));
    return this.escenario().modo === 'selector'
      ? filtrados.slice(0, this.mostrados()) : filtrados.slice(this.pagina() * this.tamano(), (this.pagina() + 1) * this.tamano());
  });

  constructor() {
    // input() aún no está disponible en el constructor; la historia llama configurar() al iniciar.
  }

  configurar(): void {
    const e = this.escenario();
    this.pagina.set(e.pagina ?? 0);
    this.tamano.set(e.tamano ?? 50);
    this.mostrados.set(Math.min(e.total, (e.bloques ?? 1) * 50));
    this.asignados.set(new Set(e.asignados ?? []));
    this.cargandoInicial.set(e.estado === 'carga-inicial');
    this.cargandoAdicional.set(e.estado === 'carga-adicional');
    this.errorInicial.set(e.estado === 'error-inicial');
    this.errorAdicional.set(e.estado === 'error-adicional');
  }

  get diaTexto(): string { return this.escenario().dia === 'martes' ? 'martes' : 'lunes'; }
  protected nombre(i: number): string { return `${NOMBRES[i % NOMBRES.length]} ${Math.floor(i / NOMBRES.length) + 1}`; }
  protected ejercicioDemo(i: number): Ejercicio {
    return { id: `ejercicio-${i}`, nombre: this.nombre(i), descripcion: this.descripcion(i),
      categoriaIds: [CATEGORIAS[i % CATEGORIAS.length]], enlaces: [], imagenes: [], subidoRepositorioComun: false };
  }
  protected descripcion(i: number): string {
    return i % 7 === 0
      ? 'Realiza el movimiento lentamente, sin dolor y con apoyo estable. Mantén una respiración regular durante todo el recorrido; descansa entre intentos y adapta la amplitud a tu comodidad.'
      : 'Realiza el ejercicio de forma controlada y descansa cuando lo necesites.';
  }
  @HostListener('window:resize')
  actualizarAncho(): void { this.movil.set(window.innerWidth < 600); }
  protected cambiarTexto(valor: string): void {
    this.texto.set(valor);
    this.reiniciarCandidatos();
  }
  protected cambiarCategorias(categorias: string[]): void {
    this.categoriaIds.set(categorias);
    this.reiniciarCandidatos();
  }
  private reiniciarCandidatos(): void {
    this.pagina.set(0);
    this.mostrados.set(50);
    this.errorAdicional.set(false);
  }
  protected cambiarPagina(evento: PageEvent): void {
    const anterior = this.pagina();
    const tamanoAnterior = this.tamano();
    const siguiente = evento.pageSize !== tamanoAnterior ? 0 : evento.pageIndex;
    this.cargandoAdicional.set(true);
    setTimeout(() => {
      this.tamano.set(evento.pageSize);
      this.pagina.set(siguiente);
      this.cargandoAdicional.set(false);
      this.anunciar(`${this.rango()} de ${this.totalFiltrado()} ejercicios`);
    }, 350);
    // MatPaginator cambia su índice internamente al pulsar; la historia solo confirma el rango al recibir resultados.
    void anterior;
  }
  protected cargarMas(): void {
    if (this.cargandoAdicional() || this.mostrados() >= this.totalFiltrado()) return;
    this.cargandoAdicional.set(true);
    const primeroNuevo = this.mostrados();
    setTimeout(() => {
      const agregados = Math.min(50, this.totalFiltrado() - primeroNuevo);
      this.mostrados.set(primeroNuevo + agregados);
      this.cargandoAdicional.set(false);
      this.anunciar(`${agregados} ejercicios añadidos. Mostrando ${this.mostrados()} de ${this.totalFiltrado()}`);
      setTimeout(() => {
        const nuevo = document.querySelector<HTMLElement>(`[data-proto-index="${this.indices()[primeroNuevo]}"]`);
        nuevo?.focus();
      });
    }, 350);
  }
  protected seleccionar(indice: number, marcado: boolean): void {
    const siguiente = new Set(this.asignados());
    if (marcado) siguiente.add(indice); else siguiente.delete(indice);
    this.asignados.set(siguiente);
    this.anunciar(`${this.nombre(indice)} ${marcado ? 'añadido al' : 'quitado del'} ${this.diaTexto}`);
  }
  protected reintentar(): void {
    if (this.errorInicial()) {
      this.errorInicial.set(false);
      this.anunciar('Ejercicios cargados');
    } else {
      this.errorAdicional.set(false);
      if (this.escenario().modo === 'selector') this.cargarMas();
      else this.cambiarPagina({ pageIndex: Math.min(this.pagina() + 1, Math.ceil(this.totalFiltrado() / this.tamano()) - 1),
        pageSize: this.tamano(), length: this.totalFiltrado() });
    }
  }
  private rango(): string {
    return `${this.pagina() * this.tamano() + 1}–${Math.min((this.pagina() + 1) * this.tamano(), this.totalFiltrado())}`;
  }
  private anunciar(texto: string): void {
    this.anuncio.set(texto);
    void this.lector.announce(texto, 'polite');
  }
}
