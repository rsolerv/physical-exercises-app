import { Injectable, inject } from '@angular/core';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { EjercicioRepositoryPort } from '../ports/ejercicio-repository.port';
import { RepositorioComunPort } from '../ports/repositorio-comun.port';
import { ErrorNoEncontrado, ErrorOperacionNoPermitida } from '../../domain/errores/errores-dominio';
import { USUARIO_ADMINISTRADOR_GITHUB } from '../configuracion/administrador.config';
import type { CredencialesGitHub } from '../ports/github-sync.port';

@Injectable({ providedIn: 'root' })
export class AdministrarRepositorioComunUseCase {
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
  private readonly repositorioComun = inject(RepositorioComunPort);

  async esAdministrador(): Promise<boolean> {
    const credenciales = await this.obtenerCredenciales();
    if (!credenciales) return false;
    const login = await this.repositorioComun.obtenerLoginGitHub(credenciales.tokenPAT);
    return login.toLowerCase() === USUARIO_ADMINISTRADOR_GITHUB.toLowerCase();
  }

  async eliminarEjercicio(ejercicioId: string): Promise<void> {
    const credenciales = await this.obtenerCredencialesAdministrador();
    await this.repositorioComun.eliminarEjercicio(credenciales, ejercicioId);
  }

  async quitarMarcaSubido(ejercicioId: string): Promise<void> {
    await this.obtenerCredencialesAdministrador();
    const ejercicio = await this.ejercicioRepository.obtenerPorId(ejercicioId);
    if (!ejercicio) throw new ErrorNoEncontrado(`No existe el ejercicio «${ejercicioId}».`);
    await this.ejercicioRepository.quitarMarcaSubidoRepositorioComun(ejercicioId);
  }

  private async obtenerCredencialesAdministrador(): Promise<CredencialesGitHub> {
    const credenciales = await this.obtenerCredenciales();
    if (!credenciales) {
      throw new ErrorOperacionNoPermitida('Introduce una PAT de GitHub para acreditar la cuenta administradora.');
    }

    const login = await this.repositorioComun.obtenerLoginGitHub(credenciales.tokenPAT);
    if (login.toLowerCase() !== USUARIO_ADMINISTRADOR_GITHUB.toLowerCase()) {
      throw new ErrorOperacionNoPermitida('Esta acción está reservada a la cuenta administradora de GitHub.');
    }
    return credenciales;
  }

  private async obtenerCredenciales(): Promise<CredencialesGitHub | null> {
    const ajustes = await this.ajustesRepository.obtener();
    if (!ajustes.tokenGitHub) return null;
    return { tokenPAT: ajustes.tokenGitHub, repositorio: ajustes.repositorioGitHub ?? '' };
  }
}
