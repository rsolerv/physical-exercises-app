import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { from } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BuscarEjerciciosComunesUseCase } from '../../../app/application/casos-uso/buscar-ejercicios-comunes.use-case';
import { ImportarEjerciciosComunesUseCase } from '../../../app/application/casos-uso/importar-ejercicios-comunes.use-case';
import { CategoriaRepositoryPort } from '../../../app/application/ports/categoria-repository.port';
import type {
  CategoriaComun,
  EjercicioComunArchivo,
  ImagenEjercicioComun,
} from '../../../app/application/ports/repositorio-comun.port';
import type { ImagenArchivoJSON } from '../../../app/application/ports/github-sync.port';
import type { Categoria } from '../../../app/domain/categoria/categoria.entity';
import { CabeceraPaginaComponent } from '../../../app/presentation/compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoCargaComponent } from '../../../app/presentation/compartido/ui/estado-carga/estado-carga.component';
import { EstadoVacioComponent } from '../../../app/presentation/compartido/ui/estado-vacio/estado-vacio.component';
import { MensajeFeedbackService } from '../../../app/presentation/compartido/ui/mensaje-feedback.service';
import { ProtoBloqueoCategoriasPropiasDialogComponent } from './proto-bloqueo-categorias-propias-dialog.component';
import {
  ProtoMapearCategoriaImportadaDialogComponent,
  type DatosMapearCategoriaImportadaDialog,
} from './proto-mapear-categoria-importada-dialog.component';

type EstadoFichaComun = 'cargando' | 'lista' | 'no-encontrado' | 'error';

interface VistaPreviaDemo {
  ejercicio: EjercicioComunArchivo;
  imagenesArchivo: Map<string, ImagenArchivoJSON>;
  imagenesOmitidas: number;
}

/**
 * Ficha remota de solo lectura para el prototipo Storybook de US1.
 * Se mantiene en src/stories: no sustituye ni modifica la presentación real.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- prefijo proto- reservado a prototipos aislados de Storybook.
  selector: 'proto-ficha-ejercicio-comun',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule,
    CabeceraPaginaComponent,
    EstadoCargaComponent,
    EstadoVacioComponent,
  ],
  template: `
    <div class="ficha-comun">
      @if (estado() === 'cargando') {
        <app-estado-carga mensaje="Cargando ejercicio del repositorio común" [cantidad]="3" />
      } @else if (estado() === 'no-encontrado') {
        <app-estado-vacio icono="search_off" mensaje="No se ha encontrado este ejercicio en el repositorio común.">
          <button accion mat-stroked-button type="button" (click)="volverAResultados()">
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
            Volver a los resultados
          </button>
        </app-estado-vacio>
      } @else if (estado() === 'error') {
        <app-estado-vacio
          icono="cloud_off"
          mensaje="No se ha podido cargar el ejercicio remoto. Comprueba tu conexión e inténtalo de nuevo."
        >
          <button accion mat-stroked-button type="button" (click)="cargar()">
            <mat-icon aria-hidden="true">refresh</mat-icon>
            Reintentar
          </button>
          <button accion mat-button type="button" (click)="volverAResultados()">
            Volver a los resultados
          </button>
        </app-estado-vacio>
      } @else if (vista(); as detalle) {
        <div class="ficha-comun__barra-superior">
          <button mat-button type="button" (click)="volverAResultados()">
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
            Volver a los resultados
          </button>
          <button
            mat-flat-button
            type="button"
            class="ficha-comun__importar"
            [attr.aria-label]="'Importar ejercicio ' + detalle.ejercicio.nombre"
            (click)="importar()"
          >
            <mat-icon aria-hidden="true">download</mat-icon>
            Importar ejercicio
          </button>
        </div>

        <app-cabecera-pagina
          [titulo]="detalle.ejercicio.nombre"
          descripcion="Ejercicio publicado en el repositorio común."
        />

        @if (detalle.imagenesOmitidas > 0) {
          <p class="ficha-comun__aviso-imagenes" role="status">
            No se han podido mostrar {{ detalle.imagenesOmitidas }}
            {{ detalle.imagenesOmitidas === 1 ? 'imagen' : 'imágenes' }} del ejercicio.
          </p>
        }

        <section class="ficha-comun__contenido" aria-label="Información del ejercicio">
          <div class="ficha-comun__texto">
            <section class="ficha-comun__seccion" aria-labelledby="ficha-comun-descripcion">
              <h2 id="ficha-comun-descripcion">Descripción</h2>
              <p>{{ detalle.ejercicio.descripcion }}</p>
            </section>

            <section class="ficha-comun__seccion" aria-labelledby="ficha-comun-categorias">
              <h2 id="ficha-comun-categorias">Categorías</h2>
              <div class="ficha-comun__categorias">
                @for (nombre of nombresCategorias(); track nombre) {
                  <span class="ficha-comun__categoria">{{ nombre }}</span>
                }
              </div>
            </section>

            <section class="ficha-comun__seccion" aria-labelledby="ficha-comun-enlaces">
              <h2 id="ficha-comun-enlaces">Enlaces multimedia</h2>
              @if (detalle.ejercicio.enlaces.length > 0) {
                <ul class="ficha-comun__enlaces">
                  @for (enlace of detalle.ejercicio.enlaces; track enlace.url) {
                    <li>
                      <a [href]="enlace.url" target="_blank" rel="noopener noreferrer">
                        <mat-icon aria-hidden="true">
                          {{ enlace.tipo === 'youtube' ? 'play_circle' : 'open_in_new' }}
                        </mat-icon>
                        {{ enlace.tipo === 'youtube' ? 'Ver vídeo en YouTube' : 'Abrir enlace web' }}
                      </a>
                    </li>
                  }
                </ul>
              } @else {
                <p class="ficha-comun__sin-contenido">Este ejercicio no incluye enlaces multimedia.</p>
              }
            </section>
          </div>

          <section class="ficha-comun__seccion ficha-comun__imagenes" aria-labelledby="ficha-comun-imagenes">
            <h2 id="ficha-comun-imagenes">Imágenes</h2>
            @if (detalle.ejercicio.imagenes.length > 0) {
              <div class="ficha-comun__galeria">
                @for (imagen of detalle.ejercicio.imagenes; track imagen.id) {
                  @if (srcImagen(imagen); as src) {
                    <img [src]="src" [alt]="'Imagen de ' + detalle.ejercicio.nombre" loading="lazy" />
                  }
                }
              </div>
            } @else {
              <p class="ficha-comun__sin-contenido">Este ejercicio no incluye imágenes.</p>
            }
          </section>
        </section>
      }
    </div>
  `,
  styleUrl: './proto-ficha-ejercicio-comun.component.scss',
})
export class ProtoFichaEjercicioComunComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly buscarEjerciciosComunes = inject(BuscarEjerciciosComunesUseCase);
  private readonly importarEjerciciosComunes = inject(ImportarEjerciciosComunesUseCase);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly dialog = inject(MatDialog);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);

  readonly estado = signal<EstadoFichaComun>('cargando');
  readonly vista = signal<VistaPreviaDemo | null>(null);
  readonly categoriasComunes = toSignal(from(this.buscarEjerciciosComunes.listarCategorias()), {
    initialValue: [] as CategoriaComun[],
  });
  readonly categoriasPropias = toSignal(from(this.categoriaRepository.listarTodas()), {
    initialValue: [] as Categoria[],
  });
  readonly ejercicio = computed(() => this.vista()?.ejercicio ?? null);
  readonly nombresCategorias = computed(() => {
    const nombresPorId = new Map(this.categoriasComunes().map((categoria) => [categoria.id, categoria.nombre]));
    return this.ejercicio()?.categoriaIds.map((id) => nombresPorId.get(id)).filter((nombre) => !!nombre) ?? [];
  });

  constructor() {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.estado.set('cargando');
    this.vista.set(null);
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.estado.set('no-encontrado');
      return;
    }

    try {
      const resultado = await this.buscarEjerciciosComunes.obtenerVistaPrevia(id);
      if (!resultado) {
        this.estado.set('no-encontrado');
        return;
      }
      this.vista.set(resultado);
      this.estado.set('lista');
    } catch {
      this.estado.set('error');
    }
  }

  volverAResultados(): void {
    void this.router.navigateByUrl('/ejercicios/importar');
  }

  srcImagen(imagen: ImagenEjercicioComun): string | null {
    const vista = this.vista();
    if (!vista) return null;
    if (imagen.tipo === 'url') return imagen.valorUrl ?? null;

    const archivo = vista.imagenesArchivo.get(imagen.id);
    return archivo ? `data:${archivo.tipoMime};base64,${archivo.contenidoBase64}` : null;
  }

  async importar(): Promise<void> {
    const ejercicio = this.ejercicio();
    if (!ejercicio) return;

    if (this.categoriasPropias().length === 0) {
      this.dialog.open(ProtoBloqueoCategoriasPropiasDialogComponent, { width: '420px' });
      return;
    }

    const pendientes = await this.importarEjerciciosComunes.obtenerCategoriasPendientes([ejercicio]);
    if (pendientes.length > 0) {
      const referencia = this.dialog.open<
        ProtoMapearCategoriaImportadaDialogComponent,
        DatosMapearCategoriaImportadaDialog,
        Map<string, string> | undefined
      >(ProtoMapearCategoriaImportadaDialogComponent, {
        width: '480px',
        data: { categoriasPendientes: pendientes, categoriasPropias: this.categoriasPropias() },
      });
      referencia.afterClosed().subscribe((mapeo) => {
        if (mapeo) void this.completarImportacion(ejercicio, mapeo);
      });
      return;
    }

    await this.completarImportacion(ejercicio, new Map());
  }

  private async completarImportacion(ejercicio: EjercicioComunArchivo, mapeo: Map<string, string>): Promise<void> {
    try {
      const resultado = await this.importarEjerciciosComunes.importar([ejercicio], mapeo);
      const plural = resultado.creados === 1 ? '' : 's';
      let mensaje = `${resultado.creados} ejercicio${plural} importado${plural}.`;
      if (resultado.imagenesOmitidas > 0) {
        const pluralImagenes = resultado.imagenesOmitidas === 1 ? '' : 'es';
        const verbo = resultado.imagenesOmitidas === 1 ? 'ha' : 'han';
        mensaje += ` Se ${verbo} omitido ${resultado.imagenesOmitidas} imagen${pluralImagenes}.`;
      }
      this.mensajeFeedback.mostrarExito(mensaje);
      this.volverAResultados();
    } catch (error) {
      this.mensajeFeedback.mostrarError(
        error instanceof Error ? error.message : 'No se ha podido completar la importación.'
      );
    }
  }
}
