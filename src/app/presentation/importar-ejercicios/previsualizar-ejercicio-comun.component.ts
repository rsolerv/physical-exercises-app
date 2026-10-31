import { Component, computed, inject, resource, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BuscarEjerciciosComunesUseCase } from '../../application/casos-uso/buscar-ejercicios-comunes.use-case';
import { ImportarEjerciciosComunesUseCase } from '../../application/casos-uso/importar-ejercicios-comunes.use-case';
import { AdministrarRepositorioComunUseCase } from '../../application/casos-uso/administrar-repositorio-comun.use-case';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import type { EjercicioComunArchivo } from '../../application/ports/repositorio-comun.port';
import { CabeceraPaginaComponent } from '../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EnlaceEmbedComponent } from '../compartido/embebidos/enlace-embed.component';
import { YoutubeEmbedComponent } from '../compartido/embebidos/youtube-embed.component';
import { EstadoCargaComponent } from '../compartido/ui/estado-carga/estado-carga.component';
import { EstadoVacioComponent } from '../compartido/ui/estado-vacio/estado-vacio.component';
import { MensajeFeedbackService } from '../compartido/ui/mensaje-feedback.service';
import { BloqueoCategoriasPropiasDialogComponent } from './bloqueo-categorias-propias-dialog.component';
import { ConfirmarEliminarEjercicioComunDialogComponent } from './confirmar-eliminar-ejercicio-comun-dialog.component';
import {
  MapearCategoriaImportadaDialogComponent,
  type DatosMapearCategoriaImportadaDialog,
} from './mapear-categoria-importada-dialog.component';

@Component({
  selector: 'app-previsualizar-ejercicio-comun',
  standalone: true,
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    CabeceraPaginaComponent,
    EnlaceEmbedComponent,
    EstadoCargaComponent,
    EstadoVacioComponent,
    YoutubeEmbedComponent,
  ],
  templateUrl: './previsualizar-ejercicio-comun.component.html',
  styleUrl: './previsualizar-ejercicio-comun.component.scss',
})
export class PrevisualizarEjercicioComunComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly buscarEjerciciosComunes = inject(BuscarEjerciciosComunesUseCase);
  private readonly importarEjerciciosComunes = inject(ImportarEjerciciosComunesUseCase);
  private readonly administrarRepositorioComun = inject(AdministrarRepositorioComunUseCase);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly dialog = inject(MatDialog);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);
  private readonly ejercicioId = this.ruta.snapshot.paramMap.get('id') ?? '';

  readonly imagenesConError = signal<ReadonlySet<string>>(new Set());

  protected readonly recursoAdministrador = resource({
    loader: () => this.administrarRepositorioComun.esAdministrador(),
  });
  protected readonly esAdministrador = computed(() => this.recursoAdministrador.value() ?? false);
  protected readonly errorAcreditacion = computed(() =>
    this.recursoAdministrador.error()
      ? 'No se ha podido verificar la cuenta GitHub. Las acciones de administración no están disponibles.'
      : null
  );

  protected readonly recursoVistaPrevia = resource({
    loader: () => this.buscarEjerciciosComunes.obtenerVistaPrevia(this.ejercicioId),
  });
  protected readonly recursoCategorias = resource({
    loader: () => this.buscarEjerciciosComunes.listarCategorias(),
  });
  protected readonly errorCarga = computed(() => {
    const error = this.recursoVistaPrevia.error() ?? this.recursoCategorias.error();
    return error instanceof Error ? error.message : error ? 'No se ha podido cargar el ejercicio.' : null;
  });
  protected readonly categoriasDelEjercicio = computed(() => {
    const ejercicio = this.recursoVistaPrevia.value()?.ejercicio;
    if (!ejercicio) return [];
    const nombresPorId = new Map((this.recursoCategorias.value() ?? []).map((categoria) => [categoria.id, categoria.nombre]));
    return ejercicio.categoriaIds.map((id) => nombresPorId.get(id) ?? id);
  });
  protected readonly enlacesYoutube = computed(
    () => this.recursoVistaPrevia.value()?.ejercicio.enlaces.filter((enlace) => enlace.tipo === 'youtube') ?? []
  );
  protected readonly enlacesWeb = computed(
    () => this.recursoVistaPrevia.value()?.ejercicio.enlaces.filter((enlace) => enlace.tipo === 'web') ?? []
  );
  protected readonly imagenes = computed(() => {
    const vistaPrevia = this.recursoVistaPrevia.value();
    if (!vistaPrevia) return [];
    return vistaPrevia.ejercicio.imagenes
      .map((imagen) => {
        const archivo = vistaPrevia.imagenesArchivo.get(imagen.id);
        const src =
          imagen.tipo === 'url'
            ? imagen.valorUrl
            : archivo
              ? `data:${archivo.tipoMime};base64,${archivo.contenidoBase64}`
              : undefined;
        return { id: imagen.id, src };
      })
      .filter((imagen): imagen is { id: string; src: string } => Boolean(imagen.src));
  });

  async importar(): Promise<void> {
    const ejercicio = this.recursoVistaPrevia.value()?.ejercicio;
    if (!ejercicio) return;

    try {
      const categoriasLocales = await this.categoriaRepository.listarTodas();
      if (categoriasLocales.length === 0) {
        this.dialog.open(BloqueoCategoriasPropiasDialogComponent, {
          width: '420px',
          maxWidth: 'calc(100vw - 32px)',
        });
        return;
      }

      const pendientes = await this.importarEjerciciosComunes.obtenerCategoriasPendientes([ejercicio]);
      if (pendientes.length > 0) {
        const dialogo = this.dialog.open<
          MapearCategoriaImportadaDialogComponent,
          DatosMapearCategoriaImportadaDialog,
          Map<string, string> | null
        >(MapearCategoriaImportadaDialogComponent, {
          width: '480px',
          maxWidth: 'calc(100vw - 32px)',
          data: { pendientes, categoriasLocales },
        });
        dialogo.afterClosed().subscribe((mapeo) => {
          if (mapeo) void this.completarImportacion(ejercicio, mapeo);
        });
        return;
      }

      await this.completarImportacion(ejercicio, new Map());
    } catch (error) {
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se ha podido preparar la importación.');
    }
  }

  async eliminarEjercicio(): Promise<void> {
    const ejercicio = this.recursoVistaPrevia.value()?.ejercicio;
    if (!ejercicio || !this.esAdministrador()) return;

    const referencia = this.dialog.open(ConfirmarEliminarEjercicioComunDialogComponent, {
      width: '440px',
      maxWidth: 'calc(100vw - 32px)',
      data: { nombre: ejercicio.nombre },
    });
    referencia.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) void this.confirmarEliminacion(ejercicio);
    });
  }

  async reintentar(): Promise<void> {
    this.recursoVistaPrevia.reload();
    this.recursoCategorias.reload();
  }

  async volverAResultados(): Promise<void> {
    const state = this.location.getState();
    const estadoImportacion =
      typeof state === 'object' && state !== null && 'estadoImportacion' in state
        ? state.estadoImportacion
        : undefined;
    await this.router.navigate(['/ejercicios/importar'], {
      state: estadoImportacion === undefined ? undefined : { restaurarImportacion: estadoImportacion },
    });
  }

  marcarErrorImagen(id: string): void {
    this.imagenesConError.update((actuales) => new Set(actuales).add(id));
  }

  private async confirmarEliminacion(ejercicio: EjercicioComunArchivo): Promise<void> {
    try {
      await this.administrarRepositorioComun.eliminarEjercicio(ejercicio.id);
      this.mensajeFeedback.mostrarExito(`Se ha borrado «${ejercicio.nombre}» del repositorio común.`);
      const state = this.location.getState();
      const estadoImportacion =
        typeof state === 'object' && state !== null && 'estadoImportacion' in state
          ? this.filtrarEjercicioDeEstado(state.estadoImportacion, ejercicio.id)
          : undefined;
      await this.router.navigate(['/ejercicios/importar'], {
        state: estadoImportacion === undefined ? undefined : { restaurarImportacion: estadoImportacion },
      });
    } catch (error) {
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se ha podido borrar el ejercicio común.');
    }
  }

  private filtrarEjercicioDeEstado(valor: unknown, ejercicioId: string): unknown {
    if (typeof valor !== 'object' || valor === null || !('resultados' in valor)) return valor;
    const estado = valor as Record<string, unknown>;
    if (!Array.isArray(estado['resultados'])) return valor;
    const resultados = estado['resultados'].filter(
      (resultado) =>
        typeof resultado === 'object' &&
        resultado !== null &&
        'id' in resultado &&
        resultado.id !== ejercicioId
    );
    const seleccionadosIds = Array.isArray(estado['seleccionadosIds'])
      ? estado['seleccionadosIds'].filter((id) => id !== ejercicioId)
      : [];
    return { ...estado, resultados, seleccionadosIds };
  }

  private async completarImportacion(
    ejercicio: EjercicioComunArchivo,
    mapeo: Map<string, string>
  ): Promise<void> {
    try {
      const resultado = await this.importarEjerciciosComunes.importar([ejercicio], mapeo);
      let mensaje = `${resultado.creados} ejercicio${resultado.creados === 1 ? '' : 's'} importado${resultado.creados === 1 ? '' : 's'}.`;
      if (resultado.imagenesOmitidas > 0) {
        const plural = resultado.imagenesOmitidas === 1 ? '' : 'es';
        const verbo = resultado.imagenesOmitidas === 1 ? 'ha' : 'han';
        mensaje += ` Se ${verbo} omitido ${resultado.imagenesOmitidas} imagen${plural}.`;
      }
      this.mensajeFeedback.mostrarExito(mensaje);
      await this.router.navigate(['/ejercicios/importar']);
    } catch (error) {
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se ha podido completar la importación.');
    }
  }
}
