import { Component, computed, inject, resource, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AjustesRepositoryPort } from '../../../application/ports/ajustes-repository.port';
import { SincronizarUseCase } from '../../../application/casos-uso/sincronizar.use-case';
import { GestionarConexionSincronizacionUseCase } from '../../../application/casos-uso/gestionar-conexion-sincronizacion.use-case';
import { CopiaManualComponent } from '../copia-manual/copia-manual.component';
import { ConflictoSincronizacionEstadoService } from '../conflicto-sincronizacion-estado.service';
import { CabeceraPaginaComponent } from '../../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { MensajeFeedbackService } from '../../compartido/ui/mensaje-feedback.service';
import { ErrorAutorizacionGoogle, ErrorConflictoRemoto } from '../../../domain/errores/errores-dominio';

interface ModeloCredencialesGitHub {
  token: string;
  repositorio: string;
}

/**
 * Configuración y ejecución de la sincronización con GitHub (Historia de
 * Usuario 5): guarda el token (oculto) y el repositorio privado de datos,
 * permite "olvidar" las credenciales (FR-002, FR-037) y lanza una
 * sincronización manual (FR-032).
 */
@Component({
  selector: 'app-configuracion-sincronizacion',
  standalone: true,
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CabeceraPaginaComponent,
    CopiaManualComponent,
  ],
  templateUrl: './configuracion-sincronizacion.component.html',
  styleUrl: './configuracion-sincronizacion.component.scss',
})
export class ConfiguracionSincronizacionComponent {
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly sincronizar = inject(SincronizarUseCase);
  private readonly gestionarConexion = inject(GestionarConexionSincronizacionUseCase);
  private readonly conflictoEstado = inject(ConflictoSincronizacionEstadoService);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);
  private readonly router = inject(Router);

  protected readonly recursoAjustes = resource({
    loader: async () => {
      const ajustes = await this.ajustesRepository.obtener();
      this.modelo.set({ token: '', repositorio: ajustes.repositorioGitHub ?? '' });
      return ajustes;
    },
  });

  readonly modelo = signal<ModeloCredencialesGitHub>({ token: '', repositorio: '' });
  readonly formulario = form(this.modelo);

  readonly sincronizando = signal(false);
  readonly conectando = signal(false);
  readonly guardando = signal(false);
  readonly confirmandoDesconexion = signal(false);
  readonly requiereReconectar = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly errorRepositorio = signal<string | null>(null);
  readonly errorToken = signal<string | null>(null);
  private readonly sincronizacionPendiente = signal(false);
  private readonly fechaSincronizacionTemporal = signal<Date | null>(null);
  readonly resultadoSincronizacion = signal<'inicial' | 'sincronizado' | 'error' | 'conflicto'>('inicial');

  protected get tieneCredenciales(): boolean {
    const ajustes = this.recursoAjustes.value();
    return !!(ajustes?.tokenGitHub && ajustes?.repositorioGitHub);
  }

  protected get cuentaGoogle(): string | null {
    const ajustes = this.recursoAjustes.value();
    return ajustes?.metodoSincronizacion === 'google' ? ajustes.cuentaGoogle : null;
  }

  protected get metodoGoogleActivo(): boolean {
    return this.recursoAjustes.value()?.metodoSincronizacion === 'google';
  }

  protected get metodoGitHubActivo(): boolean {
    return this.recursoAjustes.value()?.metodoSincronizacion === 'github';
  }

  protected get hayMetodoActivo(): boolean {
    return this.metodoGoogleActivo || this.metodoGitHubActivo;
  }

  protected get metodoActivoNombre(): string {
    return this.metodoGoogleActivo ? 'Google' : 'GitHub';
  }

  protected get esConfiguracionGitHubPlegada(): boolean {
    return !this.metodoGitHubActivo;
  }

  protected readonly estadoVisible = computed(() => {
    if (!this.hayMetodoActivo) return 'Sin configurar';
    if (this.sincronizando()) return 'Sincronizando...';
    if (this.requiereReconectar()) return 'Requiere reconectar';
    switch (this.resultadoSincronizacion()) {
      case 'sincronizado':
        return 'Sincronizado';
      case 'error':
        return 'Error de sincronización';
      case 'conflicto':
        return 'Conflicto pendiente de resolución';
      default:
        return this.metodoGoogleActivo ? 'Conectado' : 'Sincronización activa con GitHub';
    }
  });

  protected readonly fechaSincronizacionLegible = computed(() => {
    const fecha = this.fechaSincronizacionTemporal() ?? this.recursoAjustes.value()?.ultimaSincronizacionCorrecta;
    return fecha ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha) : null;
  });

  async guardarCredenciales(): Promise<void> {
    const { token, repositorio } = this.modelo();
    this.errorToken.set(token.trim() ? null : 'Introduce el token de GitHub.');
    this.errorRepositorio.set(
      !repositorio.trim()
        ? 'Introduce el repositorio de datos.'
        : /^[^/\s]+\/[^/\s]+$/.test(repositorio.trim())
          ? null
          : 'Usa el formato usuario/repositorio.'
    );
    if (this.errorToken() || this.errorRepositorio()) return;
    this.guardando.set(true);
    try {
      await this.ajustesRepository.guardarCredencialesGitHub(token.trim(), repositorio.trim());
      this.modelo.update((modelo) => ({ ...modelo, token: '' }));
      this.recursoAjustes.reload();
      this.mensajeFeedback.mostrarExito('Credenciales de GitHub guardadas.');
    } catch (error) {
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se han podido guardar las credenciales.');
    } finally {
      this.guardando.set(false);
    }
  }

  async olvidarToken(): Promise<void> {
    try {
      await this.ajustesRepository.olvidarCredencialesGitHub();
      this.modelo.set({ token: '', repositorio: '' });
      this.fechaSincronizacionTemporal.set(null);
      this.resultadoSincronizacion.set('inicial');
      this.recursoAjustes.reload();
      this.mensajeFeedback.mostrarExito('Token olvidado.');
    } catch (error) {
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se ha podido olvidar el token.');
    }
  }

  async conectarGoogle(): Promise<void> {
    if (this.metodoGitHubActivo) return;
    this.conectando.set(true);
    this.mensajeError.set(null);
    try {
      await this.gestionarConexion.conectarGoogle();
      this.requiereReconectar.set(false);
      this.recursoAjustes.reload();
      this.mensajeFeedback.mostrarExito('Cuenta de Google conectada.');
      if (this.sincronizacionPendiente()) {
        this.sincronizacionPendiente.set(false);
        await this.sincronizarAhora(true);
      }
    } catch (error) {
      this.resultadoSincronizacion.set('error');
      const mensaje = error instanceof Error ? error.message : 'No se ha podido conectar con Google.';
      this.mensajeError.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
    } finally {
      this.conectando.set(false);
    }
  }

  async desconectarGoogle(): Promise<void> {
    try {
      await this.gestionarConexion.desconectar();
      this.confirmandoDesconexion.set(false);
      this.requiereReconectar.set(false);
      this.sincronizacionPendiente.set(false);
      this.resultadoSincronizacion.set('inicial');
      this.fechaSincronizacionTemporal.set(null);
      this.recursoAjustes.reload();
      this.mensajeFeedback.mostrarExito('Cuenta de Google desconectada. Tus datos se conservan en este dispositivo y en Google.');
    } catch (error) {
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se ha podido desconectar la cuenta.');
    }
  }

  async sincronizarAhora(continuarTrasReconectar = false): Promise<void> {
    if (!this.hayMetodoActivo && !continuarTrasReconectar) return;
    this.resultadoSincronizacion.set('inicial');
    this.mensajeError.set(null);
    this.sincronizando.set(true);
    try {
      const resultado = await this.sincronizar.sincronizar();
      if (!resultado) return;
      if (resultado.tipo === 'conflicto') {
        this.resultadoSincronizacion.set('conflicto');
        this.conflictoEstado.conflictoActual.set({
          opcionPorDefecto: resultado.opcionPorDefecto,
          datosRemotos: resultado.datosRemotos,
          version: resultado.version,
        });
        await this.router.navigate(['/sincronizacion/conflicto']);
        return;
      }
      this.resultadoSincronizacion.set('sincronizado');
      this.fechaSincronizacionTemporal.set(new Date());
      const accion =
        resultado.accion === 'subir'
          ? `Datos subidos a ${this.metodoActivoNombre}.`
          : resultado.accion === 'descargar'
            ? `Datos descargados de ${this.metodoActivoNombre}.`
            : 'Ya estaba todo sincronizado.';
      this.mensajeFeedback.mostrarExito(`Sincronización completada. ${accion}`);
    } catch (error) {
      if (error instanceof ErrorAutorizacionGoogle && this.metodoGoogleActivo) {
        this.requiereReconectar.set(true);
        this.sincronizacionPendiente.set(true);
        const mensaje = 'La conexión con Google ha caducado. Vuelve a conectar para sincronizar.';
        this.mensajeError.set(mensaje);
        this.mensajeFeedback.mostrarError(mensaje);
      } else {
        this.resultadoSincronizacion.set('error');
        const mensaje =
          error instanceof Error
            ? error instanceof ErrorConflictoRemoto
              ? `${error.message} Tus datos de este dispositivo no han cambiado.`
              : error.message
            : 'No se ha podido sincronizar.';
        this.mensajeError.set(mensaje);
        this.mensajeFeedback.mostrarError(mensaje);
      }
    } finally {
      this.sincronizando.set(false);
    }
  }
}
