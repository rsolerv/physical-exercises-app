import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DescargaArchivoService {
  private readonly documento = inject(DOCUMENT);

  descargar(nombre: string, contenido: Uint8Array): void {
    const bytes = new Uint8Array(contenido.length);
    bytes.set(contenido);
    const archivo = new Blob([bytes.buffer], { type: 'application/zip' });
    const url = URL.createObjectURL(archivo);
    const enlace = this.documento.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }
}
