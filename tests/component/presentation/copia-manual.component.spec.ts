import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { CopiaManualComponent } from '../../../src/app/presentation/sincronizacion/copia-manual/copia-manual.component';
import { CopiaManualUseCase } from '../../../src/app/application/casos-uso/copia-manual.use-case';
import { DescargaArchivoService } from '../../../src/app/presentation/sincronizacion/copia-manual/descarga-archivo.service';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';

const DATOS_VALIDOS = JSON.stringify({
  version: 1,
  ejercicios: [],
  categorias: [],
  planificaciones: [],
  progresoDiario: [],
});

const ARCHIVO_IMAGEN = JSON.stringify({
  id: 'img-1',
  nombreArchivo: 'foto.png',
  tipoMime: 'image/png',
  contenidoBase64: 'ABC123',
});

function crearZip(archivos: Record<string, string>): Uint8Array {
  return zipSync(Object.fromEntries(Object.entries(archivos).map(([ruta, contenido]) => [ruta, strToU8(contenido)])));
}

function crearFichero(bytes: Uint8Array, nombre = 'copia.zip'): File {
  const contenido = new Uint8Array(bytes.length);
  contenido.set(bytes);
  const fichero = new File([contenido.buffer], nombre, { type: 'application/zip' });
  Object.defineProperty(fichero, 'arrayBuffer', {
    configurable: true,
    value: async () => contenido.buffer,
  });
  return fichero;
}

describe('CopiaManualComponent', () => {
  const configurar = () => {
    const exportar = vi.fn().mockResolvedValue({
      nombreSugerido: 'copia-ejercicios-2026-10-26.zip',
      archivos: { 'datos.json': DATOS_VALIDOS, 'imagenes/img-1.json': ARCHIVO_IMAGEN },
    });
    const importar = vi.fn().mockResolvedValue(undefined);
    const descargar = vi.fn();
    const mostrarExito = vi.fn();
    const mostrarError = vi.fn();
    TestBed.configureTestingModule({
      imports: [CopiaManualComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: CopiaManualUseCase, useValue: { exportar, importar } },
        { provide: DescargaArchivoService, useValue: { descargar } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarError } },
      ],
    });
    const fixture = TestBed.createComponent(CopiaManualComponent);
    fixture.detectChanges();
    return { fixture, exportar, importar, descargar, mostrarExito, mostrarError };
  };

  it('empaqueta los datos y las imágenes en un ZIP y descarga el archivo', async () => {
    const { fixture, exportar, descargar, mostrarExito } = configurar();

    await fixture.componentInstance.exportar();

    expect(exportar).toHaveBeenCalledOnce();
    expect(descargar).toHaveBeenCalledOnce();
    const [nombre, bytes] = descargar.mock.calls[0] as [string, Uint8Array];
    expect(nombre).toBe('copia-ejercicios-2026-10-26.zip');
    const contenidoZip = unzipSync(bytes);
    expect(strFromU8(contenidoZip['datos.json'])).toBe(DATOS_VALIDOS);
    expect(strFromU8(contenidoZip['imagenes/img-1.json'])).toBe(ARCHIVO_IMAGEN);
    expect(mostrarExito).toHaveBeenCalledWith('Copia de seguridad descargada.');
  });

  it('valida el ZIP y pide confirmación antes de reemplazar los datos', async () => {
    const { fixture, importar } = configurar();
    const entrada = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const fichero = crearFichero(crearZip({ 'datos.json': DATOS_VALIDOS, 'imagenes/img-1.json': ARCHIVO_IMAGEN }));
    Object.defineProperty(entrada, 'files', { configurable: true, value: [fichero] });
    entrada.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(importar).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('se reemplazarán');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Importar');
  });

  it('importa solo después de confirmar y cancelar no modifica los datos', async () => {
    const { fixture, importar, mostrarExito } = configurar();
    const entrada = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const fichero = crearFichero(crearZip({ 'datos.json': DATOS_VALIDOS, 'imagenes/img-1.json': ARCHIVO_IMAGEN }));
    Object.defineProperty(entrada, 'files', { configurable: true, value: [fichero] });
    entrada.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.cancelarImportacion();
    expect(importar).not.toHaveBeenCalled();
    expect(fixture.componentInstance.confirmacionImportacion()).toBe(false);

    Object.defineProperty(entrada, 'files', { configurable: true, value: [fichero] });
    entrada.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    await fixture.componentInstance.confirmarImportacion();

    expect(importar).toHaveBeenCalledWith(DATOS_VALIDOS, { 'imagenes/img-1.json': ARCHIVO_IMAGEN });
    expect(mostrarExito).toHaveBeenCalledWith('Copia de seguridad importada. Tus datos se han reemplazado.');
  });

  it('muestra error si el ZIP no contiene datos.json y no modifica los datos', async () => {
    const { fixture, importar } = configurar();
    const entrada = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const fichero = crearFichero(crearZip({ 'imagenes/img-1.json': ARCHIVO_IMAGEN }));
    Object.defineProperty(entrada, 'files', { configurable: true, value: [fichero] });
    entrada.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('dañado o incompleto');
    expect(importar).not.toHaveBeenCalled();
  });

  it('muestra error si el fichero seleccionado no es un ZIP válido', async () => {
    const { fixture, importar } = configurar();
    const entrada = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const fichero = crearFichero(strToU8('texto no zip'), 'incorrecto.zip');
    Object.defineProperty(entrada, 'files', { configurable: true, value: [fichero] });
    entrada.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('ZIP');
    expect(importar).not.toHaveBeenCalled();
  });
});
