import { Component, computed, inject, resource, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { AdministrarRepositorioComunUseCase } from '../../application/casos-uso/administrar-repositorio-comun.use-case';
import { BuscarEjerciciosComunesUseCase } from '../../application/casos-uso/buscar-ejercicios-comunes.use-case';
import { ImportarEjerciciosComunesUseCase } from '../../application/casos-uso/importar-ejercicios-comunes.use-case';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import type { EjercicioComunArchivo } from '../../application/ports/repositorio-comun.port';
import { EstadoCargaComponent } from '../compartido/ui/estado-carga/estado-carga.component';
import { EstadoVacioComponent } from '../compartido/ui/estado-vacio/estado-vacio.component';
import { CabeceraPaginaComponent } from '../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { MensajeFeedbackService } from '../compartido/ui/mensaje-feedback.service';
import { BloqueoCategoriasPropiasDialogComponent } from './bloqueo-categorias-propias-dialog.component';
import { ConfirmarEliminarEjercicioComunDialogComponent } from './confirmar-eliminar-ejercicio-comun-dialog.component';
import {
  MapearCategoriaImportadaDialogComponent,
  type DatosMapearCategoriaImportadaDialog,
} from './mapear-categoria-importada-dialog.component';

type EstadoBusquedaImportar = 'inicial' | 'cargando' | 'resultados' | 'vacio' | 'error';

interface EstadoRestauracionImportar {
  texto: string;
  categoriaId: string | null;
  resultados: EjercicioComunArchivo[];
  seleccionadosIds: string[];
}

function esEjercicioComun(valor: unknown): valor is EjercicioComunArchivo {
  if (typeof valor !== 'object' || valor === null) return false;
  const ejercicio = valor as Record<string, unknown>;
  return (
    typeof ejercicio['id'] === 'string' &&
    typeof ejercicio['nombre'] === 'string' &&
    typeof ejercicio['descripcion'] === 'string' &&
    Array.isArray(ejercicio['categoriaIds']) &&
    Array.isArray(ejercicio['enlaces']) &&
    Array.isArray(ejercicio['imagenes'])
  );
}

function esEstadoRestauracionImportar(valor: unknown): valor is EstadoRestauracionImportar {
  if (typeof valor !== 'object' || valor === null) return false;
  const estado = valor as Record<string, unknown>;
  const resultados = estado['resultados'];
  const seleccionadosIds = estado['seleccionadosIds'];
  if (
    typeof estado['texto'] !== 'string' ||
    (typeof estado['categoriaId'] !== 'string' && estado['categoriaId'] !== null) ||
    !Array.isArray(resultados) ||
    !resultados.every(esEjercicioComun) ||
    !Array.isArray(seleccionadosIds) ||
    !seleccionadosIds.every((id) => typeof id === 'string' && resultados.some((ejercicio) => ejercicio.id === id))
  ) {
    return false;
  }
  return true;
}

@Component({
  selector: 'app-importar-ejercicios',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
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
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly importarEjerciciosComunes = inject(ImportarEjerciciosComunesUseCase);
  private readonly administrarRepositorioComun = inject(AdministrarRepositorioComunUseCase);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly dialog = inject(MatDialog);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);

  readonly texto = signal('');
  readonly categoriaId = signal<string | null>(null);
  readonly estado = signal<EstadoBusquedaImportar>('inicial');
  readonly resultados = signal<EjercicioComunArchivo[]>([]);
  readonly seleccionadosIds = signal<Set<string>>(new Set());
  readonly mensajeError = signal<string | null>(null);

  protected readonly recursoAdministrador = resource({
    loader: () => this.administrarRepositorioComun.esAdministrador(),
  });
  protected readonly esAdministrador = computed(() => this.recursoAdministrador.value() ?? false);
  protected readonly errorAcreditacion = computed(() =>
    this.recursoAdministrador.error()
      ? 'No se ha podido verificar la cuenta GitHub. Las acciones de administración no están disponibles.'
      : null
  );

  constructor() {
    const state = this.location.getState();
    if (typeof state === 'object' && state !== null && 'restaurarImportacion' in state) {
      const restauracion = state.restaurarImportacion;
      if (esEstadoRestauracionImportar(restauracion)) {
        this.texto.set(restauracion.texto);
        this.categoriaId.set(restauracion.categoriaId);
        this.resultados.set(restauracion.resultados);
        this.seleccionadosIds.set(new Set(restauracion.seleccionadosIds));
        this.estado.set('resultados');
      }
    }
  }

  protected readonly recursoCategoriasComunes = resource({
    loader: async () => {
      const categorias = await this.buscarEjerciciosComunes.listarCategorias();
      if (categorias.length > 0 && this.categoriaId() === null) this.categoriaId.set(categorias[0].id);
      return categorias;
    },
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

  abrirPrevisualizacion(ejercicioId: string): void {
    void this.router.navigate(['/ejercicios/importar', ejercicioId], {
      state: {
        estadoImportacion: {
          texto: this.texto(),
          categoriaId: this.categoriaId(),
          resultados: this.resultados(),
          seleccionadosIds: [...this.seleccionadosIds()],
        } satisfies EstadoRestauracionImportar,
      },
    });
  }

  async buscar(): Promise<void> {
    if (this.categoriaId() === null) return;

    this.estado.set('cargando');
    this.mensajeError.set(null);
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

  async eliminarEjercicio(ejercicio: EjercicioComunArchivo): Promise<void> {
    if (!this.esAdministrador()) return;
    const referencia = this.dialog.open(ConfirmarEliminarEjercicioComunDialogComponent, {
      width: '440px',
      maxWidth: 'calc(100vw - 32px)',
      data: { nombre: ejercicio.nombre },
    });
    referencia.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) void this.confirmarEliminacion(ejercicio);
    });
  }

  private async confirmarEliminacion(ejercicio: EjercicioComunArchivo): Promise<void> {
    try {
      await this.administrarRepositorioComun.eliminarEjercicio(ejercicio.id);
      this.resultados.update((resultados) => resultados.filter((actual) => actual.id !== ejercicio.id));
      this.seleccionadosIds.update((ids) => {
        const siguientes = new Set(ids);
        siguientes.delete(ejercicio.id);
        return siguientes;
      });
      if (this.resultados().length === 0) this.estado.set('vacio');
      this.mensajeFeedback.mostrarExito(`Se ha borrado «${ejercicio.nombre}» del repositorio común.`);
    } catch (error) {
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se ha podido borrar el ejercicio común.');
    }
  }

  async importar(): Promise<void> {
    const seleccionados = this.seleccionados();
    if (seleccionados.length === 0) return;

    try {
      const categoriasLocales = this.categoriasPropias();
      if (categoriasLocales.length === 0) {
        this.dialog.open(BloqueoCategoriasPropiasDialogComponent, {
          width: '420px',
          maxWidth: 'calc(100vw - 32px)',
        });
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
    } catch (error) {
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se ha podido completar la importación.');
    }
  }
}
