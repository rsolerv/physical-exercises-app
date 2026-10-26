import { Injectable, inject } from '@angular/core';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { ProveedorSincronizacionPort } from '../ports/proveedor-sincronizacion.port';
import { ExportarImportarDatosUseCase } from './exportar-importar-datos.use-case';
import type { ExportacionJSON } from '../ports/github-sync.port';
import { decidirAccionSincronizacion } from '../../domain/sincronizacion/decidir-accion-sincronizacion';
import { identificarDestinoSincronizacion } from '../../domain/sincronizacion/identificar-destino-sincronizacion';
import { versionSincronizadaEfectiva } from '../../domain/sincronizacion/version-sincronizada-efectiva';
import { ErrorValidacion } from '../../domain/errores/errores-dominio';

export type ResultadoSincronizacion =
  | { tipo: 'completada'; accion: 'subir' | 'descargar' | 'nada' }
  | {
      tipo: 'conflicto';
      opcionPorDefecto: 'conservar_local' | 'conservar_remoto';
      datosRemotos: ExportacionJSON;
      version: string;
    };

@Injectable({ providedIn: 'root' })
export class SincronizarUseCase {
  private readonly ajustesRepository = inject(AjustesRepositoryPort);
  private readonly proveedor = inject(ProveedorSincronizacionPort);
  private readonly exportarImportarDatos = inject(ExportarImportarDatosUseCase);
  private sincronizacionEnCurso = false;

  async sincronizar(): Promise<ResultadoSincronizacion | null> {
    if (this.sincronizacionEnCurso) return null;
    this.sincronizacionEnCurso = true;
    try {
      return await this.sincronizarInterno();
    } finally {
      this.sincronizacionEnCurso = false;
    }
  }

  private async sincronizarInterno(): Promise<ResultadoSincronizacion> {
    const ajustes = await this.ajustesRepository.obtener();
    const destino = identificarDestinoSincronizacion(ajustes.metodoSincronizacion, ajustes.cuentaGoogle);
    const versionGuardada = versionSincronizadaEfectiva(
      destino,
      ajustes.destinoUltimaSincronizacion,
      ajustes.ultimaVersionSincronizada
    );
    const lecturaRemota = await this.proveedor.leerRemoto();
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: ajustes.cambiosLocalesPendientes,
      ultimaVersionSincronizada: versionGuardada,
      lecturaRemota,
    });

    switch (accion.tipo) {
      case 'nada':
        if (!lecturaRemota.existe) throw new ErrorValidacion('No hay una versión remota para validar la sincronización.');
        await this.registrarExito(lecturaRemota.version, destino);
        return { tipo: 'completada', accion: 'nada' };
      case 'subir': {
        const versionEsperada = lecturaRemota.existe ? lecturaRemota.version : null;
        await this.subir(versionEsperada, destino);
        return { tipo: 'completada', accion: 'subir' };
      }
      case 'descargar': {
        if (!lecturaRemota.existe) throw new ErrorValidacion('No hay datos remotos para descargar.');
        await this.aplicarDescarga(lecturaRemota.datos, lecturaRemota.version, destino);
        return { tipo: 'completada', accion: 'descargar' };
      }
      case 'conflicto':
        if (!lecturaRemota.existe) throw new ErrorValidacion('No hay datos remotos para resolver el conflicto.');
        return {
          tipo: 'conflicto',
          opcionPorDefecto: accion.opcionPorDefecto,
          datosRemotos: lecturaRemota.datos,
          version: lecturaRemota.version,
        };
    }
  }

  async resolverConflicto(
    opcion: 'conservar_local' | 'conservar_remoto',
    datosRemotos: ExportacionJSON,
    version: string
  ): Promise<void> {
    const ajustes = await this.ajustesRepository.obtener();
    const destino = identificarDestinoSincronizacion(ajustes.metodoSincronizacion, ajustes.cuentaGoogle);
    if (destino === null) throw new ErrorValidacion('No hay ningún método de sincronización activo.');
    if (opcion === 'conservar_local') {
      await this.subir(version, destino);
    } else {
      await this.aplicarDescarga(datosRemotos, version, destino);
    }
  }

  private async subir(versionEsperada: string | null, destino: string | null): Promise<void> {
    const { datos, imagenesParaSubir } = await this.exportarImportarDatos.exportar();
    const { versionNueva } = await this.proveedor.escribirRemoto(datos, imagenesParaSubir, versionEsperada);
    await this.registrarExito(versionNueva, destino);
  }

  private async aplicarDescarga(datos: ExportacionJSON, version: string, destino: string | null): Promise<void> {
    await this.exportarImportarDatos.importar(datos, (ruta) => this.proveedor.leerImagen(ruta));
    await this.registrarExito(version, destino);
  }

  private async registrarExito(version: string, destino: string | null): Promise<void> {
    if (destino === null) throw new ErrorValidacion('No hay ningún método de sincronización activo.');
    await this.ajustesRepository.actualizarUltimaVersionSincronizada(version);
    await this.ajustesRepository.registrarDestinoSincronizado(destino);
    await this.ajustesRepository.marcarCambiosLocalesPendientes(false);
    await this.ajustesRepository.registrarSincronizacionCorrecta(new Date());
  }
}
