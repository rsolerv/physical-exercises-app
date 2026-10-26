import { Injectable, inject } from '@angular/core';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { GoogleAutorizacionPort } from '../ports/google-autorizacion.port';
import { ErrorRedSincronizacion, ErrorValidacion } from '../../domain/errores/errores-dominio';

@Injectable({ providedIn: 'root' })
export class GestionarConexionSincronizacionUseCase {
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly googleAutorizacion = inject(GoogleAutorizacionPort);

  async conectarGoogle(): Promise<{ correo: string; nombre: string | null }> {
    const ajustes = await this.ajustesRepository.obtener();
    if (ajustes.metodoSincronizacion === 'github') {
      throw new ErrorValidacion('Olvida el token de GitHub antes de conectar Google.');
    }

    const cuenta = await this.googleAutorizacion.conectar();
    await this.ajustesRepository.conectarGoogle(cuenta.correo);
    return cuenta;
  }

  async desconectar(): Promise<void> {
    try {
      await this.googleAutorizacion.desconectar();
    } catch (error) {
      if (!(error instanceof ErrorRedSincronizacion)) throw error;
    }
    await this.ajustesRepository.desconectarGoogle();
  }
}
