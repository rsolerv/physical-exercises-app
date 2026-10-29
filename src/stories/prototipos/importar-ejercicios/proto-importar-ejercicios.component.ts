import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { BuscarEjerciciosComunesUseCase } from '../../../app/application/casos-uso/buscar-ejercicios-comunes.use-case';
import { ImportarEjerciciosComunesUseCase } from '../../../app/application/casos-uso/importar-ejercicios-comunes.use-case';
import { CategoriaRepositoryPort } from '../../../app/application/ports/categoria-repository.port';
import type { CategoriaComun, EjercicioComunArchivo } from '../../../app/application/ports/repositorio-comun.port';
import type { Categoria } from '../../../app/domain/categoria/categoria.entity';
import { EstadoCargaComponent } from '../../../app/presentation/compartido/ui/estado-carga/estado-carga.component';
import { EstadoVacioComponent } from '../../../app/presentation/compartido/ui/estado-vacio/estado-vacio.component';
import { CabeceraPaginaComponent } from '../../../app/presentation/compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { MensajeFeedbackService } from '../../../app/presentation/compartido/ui/mensaje-feedback.service';
import {
  ProtoMapearCategoriaImportadaDialogComponent,
  type DatosMapearCategoriaImportadaDialog,
} from './proto-mapear-categoria-importada-dialog.component';
import { ProtoBloqueoCategoriasPropiasDialogComponent } from './proto-bloqueo-categorias-propias-dialog.component';

type EstadoBusquedaImportar = 'inicial' | 'cargando' | 'resultados' | 'vacio' | 'error';

/**
 * Prototipo de Storybook de la pantalla "Importar ejercicios" (Historia de
 * Usuario 1, contracts/interfaz-usuario.md). Reutiliza los casos de uso y
 * puertos de Application ya definidos para la feature, con adaptadores de
 * demostración inyectados desde las historias. Solo para revisión visual:
 * no sustituye a la implementación real de `src/app/presentation/...`.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- prefijo proto- reservado a prototipos aislados de Storybook.
  selector: 'proto-importar-ejercicios',
  standalone: true,
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    CabeceraPaginaComponent,
    EstadoCargaComponent,
    EstadoVacioComponent,
  ],
  templateUrl: './proto-importar-ejercicios.component.html',
  styleUrl: './proto-importar-ejercicios.component.scss',
})
export class ProtoImportarEjerciciosComponent {
  private readonly buscarEjerciciosComunes = inject(BuscarEjerciciosComunesUseCase);
  private readonly importarEjerciciosComunes = inject(ImportarEjerciciosComunesUseCase);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly dialog = inject(MatDialog);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);

  readonly texto = signal('');
  readonly categoriaId = signal<string | null>(null);
  readonly estado = signal<EstadoBusquedaImportar>('inicial');
  readonly resultados = signal<EjercicioComunArchivo[]>([]);
  readonly seleccionadosIds = signal<Set<string>>(new Set());
  readonly mensajeError = signal<string | null>(null);

  readonly categoriasComunes = toSignal(from(this.buscarEjerciciosComunes.listarCategorias()), {
    initialValue: [] as CategoriaComun[],
  });
  readonly categoriasPropias = toSignal(from(this.categoriaRepository.listarTodas()), {
    initialValue: [] as Categoria[],
  });

  readonly seleccionados = computed(() => this.resultados().filter((ejercicio) => this.seleccionadosIds().has(ejercicio.id)));
  readonly numSeleccionados = computed(() => this.seleccionadosIds().size);

  nombresCategoriasComunes(ejercicio: EjercicioComunArchivo): string[] {
    const nombresPorId = new Map(this.categoriasComunes().map((categoria) => [categoria.id, categoria.nombre]));
    return ejercicio.categoriaIds.map((id) => nombresPorId.get(id)).filter((nombre): nombre is string => nombre !== undefined);
  }

  alternarCategoriaFiltro(categoriaId: string): void {
    this.categoriaId.update((actual) => (actual === categoriaId ? null : categoriaId));
  }

  async buscar(): Promise<void> {
    this.estado.set('cargando');
    this.mensajeError.set(null);
    try {
      const resultados = await this.buscarEjerciciosComunes.buscar(this.texto(), this.categoriaId());
      this.resultados.set(resultados);
      this.seleccionadosIds.set(new Set());
      this.estado.set(resultados.length === 0 ? 'vacio' : 'resultados');
    } catch (error) {
      this.mensajeError.set(
        error instanceof Error ? error.message : 'No se ha podido conectar con el repositorio común.'
      );
      this.estado.set('error');
    }
  }

  onSeleccionCambia(evento: MatSelectionListChange): void {
    const idsSeleccionados = evento.source.selectedOptions.selected.map((opcion) => opcion.value as string);
    this.seleccionadosIds.set(new Set(idsSeleccionados));
  }

  async importar(): Promise<void> {
    const seleccionados = this.seleccionados();
    if (seleccionados.length === 0) return;

    if (this.categoriasPropias().length === 0) {
      this.dialog.open(ProtoBloqueoCategoriasPropiasDialogComponent, { width: '420px' });
      return;
    }

    const pendientes = await this.importarEjerciciosComunes.obtenerCategoriasPendientes(seleccionados);
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
        if (mapeo) void this.completarImportacion(seleccionados, mapeo);
      });
      return;
    }

    await this.completarImportacion(seleccionados, new Map());
  }

  private async completarImportacion(seleccionados: EjercicioComunArchivo[], mapeo: Map<string, string>): Promise<void> {
    try {
      const resultado = await this.importarEjerciciosComunes.importar(seleccionados, mapeo);
      const plural = resultado.creados === 1 ? '' : 's';
      let mensaje = `${resultado.creados} ejercicio${plural} importado${plural}.`;
      if (resultado.imagenesOmitidas > 0) {
        const pluralImagenes = resultado.imagenesOmitidas === 1 ? '' : 'es';
        const verbo = resultado.imagenesOmitidas === 1 ? 'ha' : 'han';
        mensaje += ` Se ${verbo} omitido ${resultado.imagenesOmitidas} imagen${pluralImagenes}.`;
      }
      this.mensajeFeedback.mostrarExito(mensaje);
      this.seleccionadosIds.set(new Set());
    } catch (error) {
      this.mensajeFeedback.mostrarError(
        error instanceof Error ? error.message : 'No se ha podido completar la importación.'
      );
    }
  }
}
