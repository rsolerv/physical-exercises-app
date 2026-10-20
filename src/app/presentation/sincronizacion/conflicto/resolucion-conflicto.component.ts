import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { ConflictoSincronizacionEstadoService } from '../conflicto-sincronizacion-estado.service';
import { SincronizarGithubUseCase } from '../../../application/casos-uso/sincronizar-github.use-case';
import { CabeceraPaginaComponent } from '../../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../../compartido/ui/estado-vacio/estado-vacio.component';
import { MensajeFeedbackService } from '../../compartido/ui/mensaje-feedback.service';

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
  private readonly sincronizarGithub = inject(SincronizarGithubUseCase);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);
  private readonly router = inject(Router);

  protected readonly conflicto = this.conflictoEstado.conflictoActual;

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
      await this.sincronizarGithub.resolverConflicto(this.opcionSeleccionada(), conflicto.datosRemotos, conflicto.sha);
      this.conflictoEstado.conflictoActual.set(null);
      this.mensajeFeedback.mostrarExito('Conflicto resuelto. Sincronización completada.');
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
