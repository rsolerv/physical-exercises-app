import { Component, computed, inject, resource, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AjustesRepositoryPort } from '../../../application/ports/ajustes-repository.port';
import { SincronizarGithubUseCase } from '../../../application/casos-uso/sincronizar-github.use-case';
import { ConflictoSincronizacionEstadoService } from '../conflicto-sincronizacion-estado.service';
import { CabeceraPaginaComponent } from '../../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { MensajeFeedbackService } from '../../compartido/ui/mensaje-feedback.service';

interface ModeloCredencialesGitHub {
  token: string;
  repositorio: string;
}

const ETIQUETAS_ACCION: Record<'subir' | 'descargar' | 'nada', string> = {
  subir: 'Datos subidos a GitHub.',
  descargar: 'Datos descargados de GitHub.',
  nada: 'Ya estaba todo sincronizado.',
};

/**
 * Configuración y ejecución de la sincronización con GitHub (Historia de
 * Usuario 5): guarda el token (oculto) y el repositorio privado de datos,
 * permite "olvidar" las credenciales (FR-002, FR-037) y lanza una
 * sincronización manual (FR-032).
 */
@Component({
  selector: 'app-configuracion-sincronizacion',
  standalone: true,
  imports: [FormField, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, CabeceraPaginaComponent],
  templateUrl: './configuracion-sincronizacion.component.html',
  styleUrl: './configuracion-sincronizacion.component.scss',
})
export class ConfiguracionSincronizacionComponent {
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly sincronizarGithub = inject(SincronizarGithubUseCase);
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
  readonly guardando = signal(false);
  readonly errorRepositorio = signal<string | null>(null);
  readonly errorToken = signal<string | null>(null);
  private readonly fechaSincronizacionTemporal = signal<Date | null>(null);
  private readonly resultadoSincronizacion = signal<'inicial' | 'sincronizado' | 'error' | 'conflicto'>('inicial');

  protected get tieneCredenciales(): boolean {
    const ajustes = this.recursoAjustes.value();
    return !!(ajustes?.tokenGitHub && ajustes?.repositorioGitHub);
  }

  protected readonly estadoVisible = computed(() => {
    if (!this.tieneCredenciales) return 'Sin configurar';
    if (this.sincronizando()) return 'Sincronizando...';
    switch (this.resultadoSincronizacion()) {
      case 'sincronizado':
        return 'Sincronizado';
      case 'error':
        return 'Error de sincronización';
      case 'conflicto':
        return 'Conflicto pendiente de resolución';
      default:
        return 'Configurado';
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

  async sincronizarAhora(): Promise<void> {
    this.resultadoSincronizacion.set('inicial');
    this.sincronizando.set(true);
    try {
      const resultado = await this.sincronizarGithub.sincronizar();
      if (resultado.tipo === 'conflicto') {
        this.resultadoSincronizacion.set('conflicto');
        this.conflictoEstado.conflictoActual.set({
          opcionPorDefecto: resultado.opcionPorDefecto,
          datosRemotos: resultado.datosRemotos,
          sha: resultado.sha,
        });
        await this.router.navigate(['/sincronizacion/conflicto']);
        return;
      }
      this.resultadoSincronizacion.set('sincronizado');
      this.fechaSincronizacionTemporal.set(new Date());
      this.mensajeFeedback.mostrarExito(`Sincronización completada. ${ETIQUETAS_ACCION[resultado.accion]}`);
    } catch (error) {
      this.resultadoSincronizacion.set('error');
      this.mensajeFeedback.mostrarError(error instanceof Error ? error.message : 'No se ha podido sincronizar con GitHub.');
    } finally {
      this.sincronizando.set(false);
    }
  }
}
