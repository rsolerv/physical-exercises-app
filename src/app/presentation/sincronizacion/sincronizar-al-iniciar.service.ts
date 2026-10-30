import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AjustesRepositoryPort } from '../../application/ports/ajustes-repository.port';
import { SincronizarUseCase } from '../../application/casos-uso/sincronizar.use-case';
import { MensajeFeedbackService } from '../compartido/ui/mensaje-feedback.service';
import { ErrorAutorizacionGoogle } from '../../domain/errores/errores-dominio';

@Injectable({ providedIn: 'root' })
export class SincronizarAlIniciarService {
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly sincronizar = inject(SincronizarUseCase);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);
  private readonly router = inject(Router);
  private iniciado = false;

  async ejecutar(): Promise<void> {
    if (this.iniciado) return;
    this.iniciado = true;

    try {
      const ajustes = await this.ajustesRepository.obtener();
      if (ajustes.metodoSincronizacion === null) return;

      const resultado = await this.sincronizar.sincronizar();
      if (!resultado) return;

      if (resultado.tipo === 'conflicto') return;

      this.mensajeFeedback.mostrarExito('Sincronización automática completada.');
    } catch (error) {
      const mensaje =
        error instanceof ErrorAutorizacionGoogle
          ? 'La conexión con Google necesita que vuelvas a conectar tu cuenta. Ve a Sincronización para continuar.'
          : error instanceof Error
            ? error.message
            : 'No se ha podido sincronizar al iniciar la aplicación.';
      this.mensajeFeedback.mostrarError(mensaje);
    }
  }
}
