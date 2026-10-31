import { Component, computed, inject, resource, signal } from '@angular/core';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { EjercicioRepositoryPort } from '../../application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import { ProgresoDiarioRepositoryPort } from '../../application/ports/progreso-diario-repository.port';
import { ConsultarPlanificacionUseCase } from '../../application/casos-uso/consultar-planificacion.use-case';
import { GestionarProgresoDiarioUseCase } from '../../application/casos-uso/gestionar-progreso-diario.use-case';
import { GestionarEjercicioUseCase } from '../../application/casos-uso/gestionar-ejercicio.use-case';
import { SubirEjercicioComunUseCase } from '../../application/casos-uso/subir-ejercicio-comun.use-case';
import { AdministrarRepositorioComunUseCase } from '../../application/casos-uso/administrar-repositorio-comun.use-case';
import type { EliminacionEjercicio } from '../../application/casos-uso/gestionar-ejercicio.use-case';
import type { CambioProgreso } from '../../application/casos-uso/gestionar-progreso-diario.use-case';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import { diaSemanaDeFecha } from '../../domain/planificacion/fecha-semana';
import { CabeceraPaginaComponent } from '../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../compartido/ui/estado-vacio/estado-vacio.component';
import { YoutubeEmbedComponent } from '../compartido/embebidos/youtube-embed.component';
import { EnlaceEmbedComponent } from '../compartido/embebidos/enlace-embed.component';
import { MensajeFeedbackService } from '../compartido/ui/mensaje-feedback.service';
import { EstadoCargaComponent } from '../compartido/ui/estado-carga/estado-carga.component';
import { SubirEjercicioComunDialogComponent } from './subir-ejercicio-comun-dialog.component';

const RUTAS_ORIGEN_EJERCICIO = new Set(['/inicio', '/planificacion', '/buscar']);

/**
 * Ficha de un ejercicio (Historias de Usuario 1 y 2): muestra sus datos
 * completos, los vídeos de YouTube y enlaces web embebidos (FR-015, FR-016)
 * y permite editarlo o eliminarlo.
 */
@Component({
  selector: 'app-ejercicio-ficha',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    CabeceraPaginaComponent,
    EstadoVacioComponent,
    EstadoCargaComponent,
    YoutubeEmbedComponent,
    EnlaceEmbedComponent,
  ],
  templateUrl: './ejercicio-ficha.component.html',
  styleUrl: './ejercicio-ficha.component.scss',
})
export class EjercicioFichaComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly progresoDiarioRepository = inject(ProgresoDiarioRepositoryPort);
  private readonly consultarPlanificacion = inject(ConsultarPlanificacionUseCase);
  private readonly gestionarProgresoDiario = inject(GestionarProgresoDiarioUseCase);
  private readonly gestionarEjercicio = inject(GestionarEjercicioUseCase);
  private readonly subirEjercicioComun = inject(SubirEjercicioComunUseCase);
  private readonly administrarRepositorioComun = inject(AdministrarRepositorioComunUseCase);
  private readonly dialog = inject(MatDialog);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);

  private readonly ejercicioId = this.ruta.snapshot.paramMap.get('id') ?? '';

  protected readonly recursoEjercicio = resource({
    loader: () => this.ejercicioRepository.obtenerPorId(this.ejercicioId),
  });

  protected readonly hoy = new Date();
  private readonly diaSemanaHoy = diaSemanaDeFecha(this.hoy);
  protected readonly recursoPlanificacionHoy = resource({
    loader: () => this.consultarPlanificacion.obtenerDeHoy(this.hoy),
  });
  protected readonly recursoProgresoHoy = resource({
    params: () => ({ fecha: this.hoy }),
    loader: ({ params }) => this.progresoDiarioRepository.obtenerPorFecha(params.fecha),
  });
  protected readonly planificadoHoy = computed(() => {
    const planificacion = this.recursoPlanificacionHoy.value();
    return planificacion?.dias.find((dia) => dia.diaSemana === this.diaSemanaHoy)?.ejercicioIds.includes(this.ejercicioId) ?? false;
  });
  protected readonly realizadoHoy = computed(
    () => this.recursoProgresoHoy.value()?.some((registro) => registro.ejercicioId === this.ejercicioId && registro.realizado) ?? false
  );
  protected readonly errorProgresoHoy = computed(
    () => this.recursoPlanificacionHoy.error() !== undefined || this.recursoProgresoHoy.error() !== undefined
  );

  readonly categorias = toSignal(from(this.categoriaRepository.listarTodas()), { initialValue: [] as Categoria[] });
  readonly imagenesConError = signal<ReadonlySet<string>>(new Set());
  readonly errorAlEliminar = signal<string | null>(null);

  private readonly yaSubidoRepositorioComun = signal(false);
  protected readonly recursoPuedeSubirComun = resource({
    params: () => this.recursoEjercicio.value() ?? undefined,
    loader: ({ params }) => this.subirEjercicioComun.puedeOfrecerSubida(params),
  });
  protected readonly recursoEsAdministrador = resource({
    loader: () => this.administrarRepositorioComun.esAdministrador(),
  });
  protected readonly esAdministrador = computed(() => this.recursoEsAdministrador.value() ?? false);
  protected readonly errorAcreditacion = computed(() =>
    this.recursoEsAdministrador.error()
      ? 'No se ha podido verificar la cuenta GitHub. Las acciones de administración no están disponibles.'
      : null
  );
  protected readonly puedeSubirRepositorioComun = computed(
    () => !this.yaSubidoRepositorioComun() && (this.recursoPuedeSubirComun.value() ?? false)
  );
  protected readonly errorCarga = computed(() => {
    const error = this.recursoEjercicio.error();
    if (!error) return null;
    return error instanceof Error ? error.message : 'No se ha podido cargar el ejercicio.';
  });

  protected readonly nombresCategorias = computed(() => {
    const ejercicio = this.recursoEjercicio.value();
    if (!ejercicio) return [];
    const porId = new Map(this.categorias().map((categoria) => [categoria.id, categoria.nombre]));
    return ejercicio.categoriaIds.map((id) => porId.get(id)).filter((nombre): nombre is string => nombre !== undefined);
  });

  protected readonly enlacesYoutube = computed(
    () => this.recursoEjercicio.value()?.enlaces.filter((enlace) => enlace.tipo === 'youtube') ?? []
  );

  protected readonly enlacesWeb = computed(
    () => this.recursoEjercicio.value()?.enlaces.filter((enlace) => enlace.tipo === 'web') ?? []
  );

  protected readonly pautaObservaciones = computed(() => {
    const observaciones = this.recursoEjercicio.value()?.observaciones;
    if (!observaciones) return null;
    const coincidencia = observaciones.match(/\b(\d+)\s+series?\s+de\s+(\d+)\s+repeticiones?\b/i);
    if (!coincidencia) return null;
    return {
      series: coincidencia[1],
      repeticiones: coincidencia[2],
      detalle: observaciones.replace(coincidencia[0], '').replace(/^\s*[.,;]\s*/, '').trim(),
    };
  });

  protected imagenSrc(imagen: { tipo: 'url' | 'archivo'; valorUrl?: string; contenidoBase64?: string; tipoMime?: string }): string {
    if (imagen.tipo === 'url') return imagen.valorUrl ?? '';
    return `data:${imagen.tipoMime};base64,${imagen.contenidoBase64}`;
  }

  marcarErrorImagen(id: string): void {
    this.imagenesConError.update((actuales) => new Set(actuales).add(id));
  }

  abrirDialogoSubirComun(): void {
    const ejercicio = this.recursoEjercicio.value();
    if (!ejercicio) return;
    const referencia = this.dialog.open(SubirEjercicioComunDialogComponent, { data: { ejercicio } });
    referencia.afterClosed().subscribe((subidoCorrectamente) => {
      if (subidoCorrectamente) {
        this.yaSubidoRepositorioComun.set(true);
        this.mensajeFeedback.mostrarExito(
          'Ejercicio enviado. Quedará pendiente de revisión antes de publicarse en el catálogo común.'
        );
      }
    });
  }

  async quitarMarcaSubido(): Promise<void> {
    try {
      await this.administrarRepositorioComun.quitarMarcaSubido(this.ejercicioId);
      this.mensajeFeedback.mostrarExito('Se ha quitado la marca de subida al repositorio común.');
      this.recursoEjercicio.reload();
      this.recursoPuedeSubirComun.reload();
    } catch (error) {
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se ha podido quitar la marca de subida.');
    }
  }

  async volver(): Promise<void> {
    const state = this.location.getState();
    const returnUrl =
      typeof state === 'object' &&
      state !== null &&
      'returnUrl' in state &&
      typeof state.returnUrl === 'string' &&
      RUTAS_ORIGEN_EJERCICIO.has(state.returnUrl)
        ? state.returnUrl
        : '/buscar';
    await this.router.navigateByUrl(returnUrl);
  }

  async eliminar(): Promise<void> {
    this.errorAlEliminar.set(null);
    try {
      const snapshot = await this.gestionarEjercicio.eliminar(this.ejercicioId);
      this.mensajeFeedback.mostrarExitoConAccion('Ejercicio eliminado.', 'Deshacer', () => {
        void this.restaurar(snapshot);
      });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se ha podido eliminar el ejercicio.';
      this.errorAlEliminar.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
      return;
    }
    await this.router.navigate(['/buscar']);
  }

  async alternarProgresoHoy(): Promise<void> {
    const nuevoEstado = !this.realizadoHoy();
    try {
      const cambio = await this.gestionarProgresoDiario.marcar(this.hoy, this.ejercicioId, nuevoEstado);
      this.mensajeFeedback.mostrarExitoConAccion('Progreso actualizado.', 'Deshacer', () => {
        void this.deshacerProgresoHoy(cambio);
      });
      this.recursoProgresoHoy.reload();
    } catch (error) {
      this.mensajeFeedback.mostrarError(this.mensajeDeErrorProgreso(error));
    }
  }

  protected reintentarProgresoHoy(): void {
    this.recursoPlanificacionHoy.reload();
    this.recursoProgresoHoy.reload();
  }

  private async deshacerProgresoHoy(cambio: CambioProgreso): Promise<void> {
    try {
      await this.gestionarProgresoDiario.restaurarCambio(cambio);
      this.recursoProgresoHoy.reload();
    } catch (error) {
      this.mensajeFeedback.mostrarError(this.mensajeDeErrorProgreso(error));
    }
  }

  private mensajeDeErrorProgreso(error: unknown): string {
    return error instanceof Error && error.message
      ? `No se pudo actualizar el progreso: ${error.message}`
      : 'No se pudo actualizar el progreso. Inténtalo de nuevo.';
  }

  private async restaurar(snapshot: EliminacionEjercicio): Promise<void> {
    try {
      await this.gestionarEjercicio.restaurarEliminacion(snapshot);
      this.mensajeFeedback.mostrarExito('Ejercicio restaurado.');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se ha podido restaurar el ejercicio.';
      this.mensajeFeedback.mostrarError(mensaje);
    }
  }
}
