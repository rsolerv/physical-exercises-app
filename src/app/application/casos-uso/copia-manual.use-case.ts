import { Injectable, inject } from '@angular/core';
import { AjustesRepositoryPort } from '../ports/ajustes-repository.port';
import { ExportarImportarDatosUseCase } from './exportar-importar-datos.use-case';
import { ErrorValidacion } from '../../domain/errores/errores-dominio';
import { validarCopiaSeguridad } from '../../domain/copia-seguridad/validar-copia-seguridad';

@Injectable({ providedIn: 'root' })
export class CopiaManualUseCase {
  private readonly exportarImportarDatos = inject(ExportarImportarDatosUseCase);
  private readonly ajustesRepository = inject(AjustesRepositoryPort);

  async exportar(): Promise<{ nombreSugerido: string; archivos: Record<string, string> }> {
    const { datos, imagenesParaSubir } = await this.exportarImportarDatos.exportar();
    const hoy = new Date().toISOString().slice(0, 10);
    return {
      nombreSugerido: `copia-ejercicios-${hoy}.zip`,
      archivos: {
        'datos.json': JSON.stringify(datos),
        ...Object.fromEntries(
          imagenesParaSubir.map((imagen) => [`imagenes/${imagen.id}.json`, JSON.stringify(imagen)])
        ),
      },
    };
  }

  async importar(datosJson: string, archivosImagenes: Record<string, string>): Promise<void> {
    const copia = validarCopiaSeguridad(datosJson, archivosImagenes);
    await this.exportarImportarDatos.importar(copia.datos, async (ruta) => {
      const imagen = copia.imagenes[ruta];
      if (!imagen) throw new ErrorValidacion('El fichero está dañado o incompleto.');
      return imagen;
    });
    await this.ajustesRepository.marcarCambiosLocalesPendientes();
  }
}
