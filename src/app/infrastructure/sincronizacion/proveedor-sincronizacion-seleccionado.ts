import { InjectionToken, Injectable, inject } from '@angular/core';
import { AjustesRepositoryPort } from '../../application/ports/ajustes-repository.port';
import {
  ProveedorSincronizacionPort,
  type LecturaRemota,
} from '../../application/ports/proveedor-sincronizacion.port';
import type { ExportacionJSON, ImagenArchivoJSON } from '../../application/ports/github-sync.port';
import { ErrorValidacion } from '../../domain/errores/errores-dominio';
import { ProveedorGithubSync } from '../github-sync/proveedor-github-sync';

export const GOOGLE_DRIVE_SYNC_PROVIDER = new InjectionToken<ProveedorSincronizacionPort>(
  'GOOGLE_DRIVE_SYNC_PROVIDER',
);

@Injectable({ providedIn: 'root' })
export class ProveedorSincronizacionSeleccionado extends ProveedorSincronizacionPort {
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly proveedorGithub = inject(ProveedorGithubSync);
  private readonly proveedorGoogle = inject(GOOGLE_DRIVE_SYNC_PROVIDER);

  async leerRemoto(): Promise<LecturaRemota> {
    return (await this.obtenerProveedor()).leerRemoto();
  }

  async escribirRemoto(
    datos: ExportacionJSON,
    imagenes: ImagenArchivoJSON[],
    versionEsperada: string | null,
  ): Promise<{ versionNueva: string }> {
    return (await this.obtenerProveedor()).escribirRemoto(datos, imagenes, versionEsperada);
  }

  async leerImagen(ruta: string): Promise<ImagenArchivoJSON> {
    return (await this.obtenerProveedor()).leerImagen(ruta);
  }

  private async obtenerProveedor(): Promise<ProveedorSincronizacionPort> {
    const ajustes = await this.ajustesRepository.obtener();
    switch (ajustes.metodoSincronizacion) {
      case 'github':
        return this.proveedorGithub;
      case 'google':
        return this.proveedorGoogle;
      default:
        throw new ErrorValidacion('Configura un método de sincronización antes de continuar.');
    }
  }
}
