import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, type MatListOption, type MatSelectionListChange } from '@angular/material/list';
import { BuscarEjerciciosComunesUseCase } from '../../application/casos-uso/buscar-ejercicios-comunes.use-case';
import { ImportarEjerciciosComunesUseCase } from '../../application/casos-uso/importar-ejercicios-comunes.use-case';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import type { EjercicioComunArchivo } from '../../application/ports/repositorio-comun.port';
import { EstadoCargaComponent } from '../compartido/ui/estado-carga/estado-carga.component';
import { EstadoVacioComponent } from '../compartido/ui/estado-vacio/estado-vacio.component';
import { CabeceraPaginaComponent } from '../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { MensajeFeedbackService } from '../compartido/ui/mensaje-feedback.service';
import {
  MapearCategoriaImportadaDialogComponent,
  type DatosMapearCategoriaImportadaDialog,
} from './mapear-categoria-importada-dialog.component';

type EstadoBusquedaImportar = 'inicial' | 'cargando' | 'resultados' | 'vacio' | 'error';

@Component({
  selector: 'app-importar-ejercicios',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    CabeceraPaginaComponent,
    EstadoCargaComponent,
    EstadoVacioComponent,
  ],
  templateUrl: './importar-ejercicios.component.html',
  styleUrl: './importar-ejercicios.component.scss',
})
export class ImportarEjerciciosComponent {
  private readonly buscarEjerciciosComunes = inject(BuscarEjerciciosComunesUseCase);
  private readonly importarEjerciciosComunes = inject(ImportarEjerciciosComunesUseCase);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly dialog = inject(MatDialog, { optional: true });
  private readonly mensajeFeedback = inject(MensajeFeedbackService);

  readonly texto = signal('');
  readonly categoriaId = signal<string | null>(null);
  readonly estado = signal<EstadoBusquedaImportar>('inicial');
  readonly resultados = signal<EjercicioComunArchivo[]>([]);
  readonly seleccionadosIds = signal<Set<string>>(new Set());
  readonly mensajeError = signal<string | null>(null);
  readonly bloqueoCategorias = signal(false);

  protected readonly recursoCategoriasComunes = resource({
    loader: () => this.buscarEjerciciosComunes.listarCategorias(),
  });
  protected readonly recursoCategoriasLocales = resource({
    loader: () => this.categoriaRepository.listarTodas(),
  });

  readonly categoriasComunes = computed(() => this.recursoCategoriasComunes.value() ?? []);
  readonly categoriasPropias = computed(() => this.recursoCategoriasLocales.value() ?? []);
  readonly seleccionados = computed(() => this.resultados().filter((ejercicio) => this.seleccionadosIds().has(ejercicio.id)));
  readonly numSeleccionados = computed(() => this.seleccionadosIds().size);

  nombresCategoriasComunes(ejercicio: EjercicioComunArchivo): string[] {
    const nombresPorId = new Map(this.categoriasComunes().map((categoria) => [categoria.id, categoria.nombre]));
    return ejercicio.categoriaIds.map((id) => nombresPorId.get(id)).filter((nombre): nombre is string => nombre !== undefined);
  }

  alternarCategoriaFiltro(categoriaId: string): void {
    this.categoriaId.update((actual) => (actual === categoriaId ? null : categoriaId));
  }

  alternarSeleccion(ejercicioId: string): void {
    this.seleccionadosIds.update((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(ejercicioId)) siguientes.delete(ejercicioId);
      else if (this.resultados().some((ejercicio) => ejercicio.id === ejercicioId)) siguientes.add(ejercicioId);
      return siguientes;
    });
  }

  onSeleccionCambia(evento: MatSelectionListChange): void {
    const idsSeleccionados = evento.source.selectedOptions.selected.map((opcion: MatListOption) => String(opcion.value));
    this.seleccionadosIds.set(new Set(idsSeleccionados));
  }

  async buscar(): Promise<void> {
    this.estado.set('cargando');
    this.mensajeError.set(null);
    this.bloqueoCategorias.set(false);
    try {
      const resultados = await this.buscarEjerciciosComunes.buscar(this.texto(), this.categoriaId());
      this.resultados.set(resultados);
      this.seleccionadosIds.set(new Set());
      this.estado.set(resultados.length === 0 ? 'vacio' : 'resultados');
    } catch (error) {
      this.mensajeError.set(error instanceof Error ? error.message : 'No se ha podido conectar con el repositorio común.');
      this.estado.set('error');
    }
  }

  async importar(): Promise<void> {
    const seleccionados = this.seleccionados();
    if (seleccionados.length === 0) return;

    try {
      const categoriasLocales = this.categoriasPropias();
      if (categoriasLocales.length === 0) {
        this.bloqueoCategorias.set(true);
        return;
      }

      const pendientes = await this.importarEjerciciosComunes.obtenerCategoriasPendientes(seleccionados);
      if (pendientes.length > 0) {
        const dialogo = this.dialog?.open<
          MapearCategoriaImportadaDialogComponent,
          DatosMapearCategoriaImportadaDialog,
          Map<string, string> | null
        >(MapearCategoriaImportadaDialogComponent, {
          width: '480px',
          maxWidth: 'calc(100vw - 32px)',
          data: { pendientes, categoriasLocales },
        });
        dialogo?.afterClosed().subscribe((mapeo) => {
          if (mapeo) void this.completarImportacion(seleccionados, mapeo);
        });
        return;
      }

      await this.completarImportacion(seleccionados, new Map());
    } catch (error) {
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se ha podido preparar la importación.');
    }
  }

  private async completarImportacion(
    seleccionados: EjercicioComunArchivo[],
    mapeo: Map<string, string>
  ): Promise<void> {
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
      this.bloqueoCategorias.set(false);
    } catch (error) {
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se ha podido completar la importación.');
    }
  }
}
