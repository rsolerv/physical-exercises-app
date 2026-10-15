import { Injectable, inject } from '@angular/core';
import { SqliteConexionService } from '../../infrastructure/persistencia-sqlite/sqlite-conexion.service';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { SembrarCatalogoPredefinidoPort } from '../ports/sembrar-catalogo-predefinido.port';

export interface ResultadoArranque {
  /** Si es `false`, el navegador no admite OPFS y los datos no se conservarán entre sesiones (FR-027). */
  opfsDisponible: boolean;
}

/**
 * Caso de uso de orquestación (no puro: usa los puertos de Infrastructure)
 * que se ejecuta al abrir la aplicación (FR-001). Inicializa la conexión
 * SQLite y siembra el catálogo predefinido la primera vez (FR-034).
 */
@Injectable({ providedIn: 'root' })
export class ArrancarAplicacionUseCase {
  private readonly conexion = inject(SqliteConexionService);
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly sembradorCatalogo = inject(SembrarCatalogoPredefinidoPort);

  async ejecutar(): Promise<ResultadoArranque> {
    const { opfsDisponible } = await this.conexion.inicializar();

    const catalogoCargado = await this.ajustesRepository.estaCatalogoPredefinidoCargado();
    if (!catalogoCargado) {
      await this.sembradorCatalogo.sembrarSiNecesario();
    }

    return { opfsDisponible };
  }
}
