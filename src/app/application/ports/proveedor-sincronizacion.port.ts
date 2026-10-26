import type { ExportacionJSON, ImagenArchivoJSON } from './github-sync.port';

export type LecturaRemota = { existe: false } | { existe: true; datos: ExportacionJSON; version: string };

export abstract class ProveedorSincronizacionPort {
  abstract leerRemoto(): Promise<LecturaRemota>;

  abstract escribirRemoto(
    datos: ExportacionJSON,
    imagenes: ImagenArchivoJSON[],
    versionEsperada: string | null
  ): Promise<{ versionNueva: string }>;

  abstract leerImagen(ruta: string): Promise<ImagenArchivoJSON>;
}
