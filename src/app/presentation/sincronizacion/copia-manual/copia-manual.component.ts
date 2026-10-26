import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { CopiaManualUseCase } from '../../../application/casos-uso/copia-manual.use-case';
import { validarCopiaSeguridad } from '../../../domain/copia-seguridad/validar-copia-seguridad';
import { ErrorValidacion } from '../../../domain/errores/errores-dominio';
import { MensajeFeedbackService } from '../../compartido/ui/mensaje-feedback.service';
import { DescargaArchivoService } from './descarga-archivo.service';

@Component({
  selector: 'app-copia-manual',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './copia-manual.component.html',
  styleUrl: './copia-manual.component.scss',
})
export class CopiaManualComponent {
  private readonly copiaManual = inject(CopiaManualUseCase);
  private readonly descarga = inject(DescargaArchivoService);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);

  readonly exportando = signal(false);
  readonly importando = signal(false);
  readonly confirmacionImportacion = signal(false);
  readonly error = signal<string | null>(null);
  private datosPendientes: string | null = null;
  private archivosPendientes: Record<string, string> | null = null;

  async exportar(): Promise<void> {
    this.exportando.set(true);
    this.error.set(null);
    try {
      const copia = await this.copiaManual.exportar();
      const archivos = Object.fromEntries(
        Object.entries(copia.archivos).map(([ruta, contenido]) => [ruta, strToU8(contenido)])
      );
      this.descarga.descargar(copia.nombreSugerido, zipSync(archivos));
      this.mensajeFeedback.mostrarExito('Copia de seguridad descargada.');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se ha podido crear la copia de seguridad.';
      this.error.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
    } finally {
      this.exportando.set(false);
    }
  }

  async seleccionarArchivo(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];
    entrada.value = '';
    this.confirmacionImportacion.set(false);
    this.datosPendientes = null;
    this.archivosPendientes = null;
    this.error.set(null);
    if (!archivo) return;

    try {
      const contenidoZip = unzipSync(new Uint8Array(await archivo.arrayBuffer()));
      const datos = contenidoZip['datos.json'];
      if (!datos) throw new ErrorValidacion('El fichero está dañado o incompleto.');

      const archivosImagenes: Record<string, string> = Object.create(null);
      for (const [ruta, contenido] of Object.entries(contenidoZip)) {
        if (ruta !== 'datos.json' && !(ruta === 'imagenes/' && contenido.length === 0)) {
          archivosImagenes[ruta] = strFromU8(contenido);
        }
      }

      const datosJson = strFromU8(datos);
      validarCopiaSeguridad(datosJson, archivosImagenes);
      this.datosPendientes = datosJson;
      this.archivosPendientes = archivosImagenes;
      this.confirmacionImportacion.set(true);
    } catch (error) {
      const mensaje = error instanceof ErrorValidacion
        ? error.message
        : 'El fichero ZIP está dañado o no es válido.';
      this.error.set(mensaje);
    }
  }

  async confirmarImportacion(): Promise<void> {
    const datos = this.datosPendientes;
    const archivos = this.archivosPendientes;
    if (datos === null || archivos === null) return;
    this.importando.set(true);
    this.error.set(null);
    try {
      await this.copiaManual.importar(datos, archivos);
      this.cancelarImportacion();
      this.mensajeFeedback.mostrarExito('Copia de seguridad importada. Tus datos se han reemplazado.');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se ha podido importar la copia de seguridad.';
      this.error.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
    } finally {
      this.importando.set(false);
    }
  }

  cancelarImportacion(): void {
    this.datosPendientes = null;
    this.archivosPendientes = null;
    this.confirmacionImportacion.set(false);
  }
}
