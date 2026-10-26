import { Component, computed, inject, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { ConflictoSincronizacionEstadoService } from '../conflicto-sincronizacion-estado.service';
import { SincronizarUseCase } from '../../../application/casos-uso/sincronizar.use-case';
import { CabeceraPaginaComponent } from '../../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../../compartido/ui/estado-vacio/estado-vacio.component';
import { MensajeFeedbackService } from '../../compartido/ui/mensaje-feedback.service';
import { AjustesRepositoryPort } from '../../../application/ports/ajustes-repository.port';
import { textoImagenesOmitidas } from '../texto-imagenes-omitidas';

/**
 * Resolución de un conflicto de sincronización (Historia de Usuario 5,
 * FR-035): el usuario elige explícitamente entre conservar todos los datos
 * locales o todos los datos remotos antes de completar la sincronización.
 */
@Component({
  selector: 'app-resolucion-conflicto',
  standalone: true,
  imports: [MatRadioModule, MatButtonModule, CabeceraPaginaComponent, EstadoVacioComponent],
  templateUrl: './resolucion-conflicto.component.html',
  styleUrl: './resolucion-conflicto.component.scss',
})
export class ResolucionConflictoComponent {
  private readonly conflictoEstado = inject(ConflictoSincronizacionEstadoService);
  private readonly sincronizar = inject(SincronizarUseCase);
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);
  private readonly router = inject(Router);

  protected readonly conflicto = this.conflictoEstado.conflictoActual;
  protected readonly recursoAjustes = resource({ loader: () => this.ajustesRepository.obtener() });
  protected readonly proveedorRemoto = computed(
    () => (this.recursoAjustes.value()?.metodoSincronizacion === 'google' ? 'Google' : 'GitHub'),
  );

  readonly opcionSeleccionada = signal<'conservar_local' | 'conservar_remoto'>(this.conflicto()?.opcionPorDefecto ?? 'conservar_remoto');

  readonly confirmando = signal(false);
  readonly errorAlResolver = signal<string | null>(null);

  protected readonly puedeConfirmar = computed(() => this.conflicto() !== null);

  async confirmar(): Promise<void> {
    const conflicto = this.conflicto();
    if (!conflicto) return;
    this.errorAlResolver.set(null);
    this.confirmando.set(true);
    try {
      const { imagenesOmitidas } = await this.sincronizar.resolverConflicto(
        this.opcionSeleccionada(),
        conflicto.datosRemotos,
        conflicto.version
      );
      this.conflictoEstado.conflictoActual.set(null);
      if (imagenesOmitidas > 0) {
        this.mensajeFeedback.mostrarError(
          `Conflicto resuelto. Sincronización completada. ${textoImagenesOmitidas(imagenesOmitidas)}`
        );
      } else {
        this.mensajeFeedback.mostrarExito('Conflicto resuelto. Sincronización completada.');
      }
      await this.router.navigate(['/sincronizacion']);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se ha podido resolver el conflicto.';
      this.errorAlResolver.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
    } finally {
      this.confirmando.set(false);
    }
  }
}
