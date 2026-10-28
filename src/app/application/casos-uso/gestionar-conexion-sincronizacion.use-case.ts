import { Injectable, inject } from '@angular/core';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { GoogleAutorizacionPort } from '../ports/google-autorizacion.port';
import { ErrorRedSincronizacion } from '../../domain/errores/errores-dominio';

@Injectable({ providedIn: 'root' })
export class GestionarConexionSincronizacionUseCase {
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly googleAutorizacion = inject(GoogleAutorizacionPort);

  async conectarGoogle(): Promise<{ correo: string; nombre: string | null }> {
    const cuenta = await this.googleAutorizacion.conectar();
    await this.ajustesRepository.conectarGoogle(cuenta.correo);
    return cuenta;
  }

  async activarMetodo(metodo: 'github' | 'google'): Promise<void> {
    await this.ajustesRepository.activarMetodo(metodo);
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
