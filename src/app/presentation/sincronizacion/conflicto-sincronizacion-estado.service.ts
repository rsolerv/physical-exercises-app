import { Injectable, signal } from '@angular/core';
import type { ExportacionJSON } from '../../application/ports/github-sync.port';

export interface ConflictoSincronizacion {
  opcionPorDefecto: 'conservar_local' | 'conservar_remoto';
  datosRemotos: ExportacionJSON;
  sha: string;
}

/**
 * Transporta el conflicto de sincronización detectado (FR-035) entre la
 * pantalla de configuración y la de resolución, sin tener que codificarlo en
 * la URL. Componente de infraestructura de presentación puro, sin lógica de
 * negocio: la decisión ya la tomó `decidir-accion-sincronizacion`.
 */
@Injectable({ providedIn: 'root' })
export class ConflictoSincronizacionEstadoService {
  readonly conflictoActual = signal<ConflictoSincronizacion | null>(null);
}
