import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DescargaArchivoService } from '../../../src/app/presentation/sincronizacion/copia-manual/descarga-archivo.service';

describe('DescargaArchivoService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('descarga los bytes con MIME ZIP y revoca la URL temporal', async () => {
    const enlace = { href: '', download: '', click: vi.fn() };
    const documento = { createElement: vi.fn(() => enlace) };
    let blobDescargado: Blob | undefined;
    const crearUrl = vi.fn((blob: Blob) => {
      blobDescargado = blob;
      return 'blob:copia';
    });
    const revocarUrl = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: crearUrl, revokeObjectURL: revocarUrl });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: DOCUMENT, useValue: documento },
      ],
    });

    TestBed.inject(DescargaArchivoService).descargar('copia.zip', new Uint8Array([80, 75, 3, 4]));

    expect(documento.createElement).toHaveBeenCalledWith('a');
    expect(enlace.download).toBe('copia.zip');
    expect(enlace.href).toBe('blob:copia');
    expect(enlace.click).toHaveBeenCalledOnce();
    expect(blobDescargado?.type).toBe('application/zip');
    expect([...new Uint8Array(await blobDescargado!.arrayBuffer())]).toEqual([80, 75, 3, 4]);
    expect(revocarUrl).toHaveBeenCalledWith('blob:copia');
  });
});
