import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CopiaManualUseCase } from '../../../src/app/application/casos-uso/copia-manual.use-case';
import { ExportarImportarDatosUseCase } from '../../../src/app/application/casos-uso/exportar-importar-datos.use-case';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import type { ExportacionJSON, ImagenArchivoJSON } from '../../../src/app/application/ports/github-sync.port';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';
import { crearCatalogoPaginacion } from '../../fixtures/crear-catalogo-paginacion';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

const DATOS: ExportacionJSON = { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] };

function archivos(imagenes: ImagenArchivoJSON[] = []) {
  return Object.fromEntries(imagenes.map((imagen) => [`imagenes/${imagen.id}.json`, JSON.stringify(imagen)]));
}

describe('CopiaManualUseCase', () => {
  function configurar(exportar = vi.fn().mockResolvedValue({ datos: DATOS, imagenesParaSubir: [] })) {
    const importar = vi.fn().mockResolvedValue(undefined);
    const marcarCambiosLocalesPendientes = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ExportarImportarDatosUseCase, useValue: { exportar, importar } },
        { provide: AjustesRepositoryPort, useValue: { marcarCambiosLocalesPendientes } },
      ],
    });
    return { caso: TestBed.inject(CopiaManualUseCase), exportar, importar, marcarCambiosLocalesPendientes };
  }

  it('exporta datos.json y cada imagen como fichero hermano sin incluir ajustes', async () => {
    const imagen: ImagenArchivoJSON = {
      id: 'img-1',
      nombreArchivo: 'foto.png',
      tipoMime: 'image/png',
      contenidoBase64: 'ABC123',
    };
    const exportar = vi.fn().mockResolvedValue({ datos: DATOS, imagenesParaSubir: [imagen] });
    const { caso, importar } = configurar(exportar);

    const resultado = await caso.exportar();

    expect(resultado.nombreSugerido).toMatch(/^copia-ejercicios-\d{4}-\d{2}-\d{2}\.zip$/);
    expect(JSON.parse(resultado.archivos['datos.json'])).toEqual(DATOS);
    expect(JSON.parse(resultado.archivos['imagenes/img-1.json'])).toEqual(imagen);
    expect(JSON.stringify(resultado.archivos)).not.toMatch(/token|correo|cuenta/i);
    expect(importar).not.toHaveBeenCalled();
  });

  it('copia y restaura 125 ejercicios completos con medios y planificación más allá del primer bloque', async () => {
    const { datos, imagenes, archivos } = crearCatalogoPaginacion(125);
    const { caso, exportar, importar, marcarCambiosLocalesPendientes } = configurar(
      vi.fn().mockResolvedValue({ datos, imagenesParaSubir: Object.values(imagenes) })
    );
    const copia = await caso.exportar();
    const comprimido = zipSync(Object.fromEntries(
      Object.entries(copia.archivos).map(([ruta, contenido]) => [ruta, strToU8(contenido)])
    ));
    const restaurados = Object.fromEntries(
      Object.entries(unzipSync(comprimido)).map(([ruta, contenido]) => [ruta, strFromU8(contenido)])
    );
    expect(exportar).toHaveBeenCalledOnce();
    expect(restaurados).toEqual(archivos);
    expect(JSON.parse(restaurados['datos.json']).ejercicios.map((e: { id: string }) => e.id))
      .toEqual(datos.ejercicios.map((e) => e.id));

    const { ['datos.json']: documento, ...imagenesZip } = restaurados;
    await caso.importar(documento, imagenesZip);

    expect(importar).toHaveBeenCalledWith(datos, expect.any(Function));
    const resolver = importar.mock.calls[0][1] as (ruta: string) => Promise<ImagenArchivoJSON>;
    for (const [ruta, imagen] of Object.entries(imagenes)) {
      await expect(resolver(ruta)).resolves.toEqual(imagen);
    }
    expect(datos.planificaciones[0].dias[0].ejercicioIds).toContain(datos.ejercicios[124].id);
    expect(datos.progresoDiario[0].ejercicioId).toBe(datos.ejercicios[124].id);
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });

  it('rechaza una copia inválida antes de modificar datos o ajustes', async () => {
    const { caso, importar, marcarCambiosLocalesPendientes } = configurar();

    await expect(caso.importar('texto inválido', {})).rejects.toThrow(ErrorValidacion);

    expect(importar).not.toHaveBeenCalled();
    expect(marcarCambiosLocalesPendientes).not.toHaveBeenCalled();
  });

  it('importa datos e imágenes desde rutas ZIP y marca cambios pendientes', async () => {
    const imagen: ImagenArchivoJSON = {
      id: 'img-1',
      nombreArchivo: 'foto.png',
      tipoMime: 'image/png',
      contenidoBase64: 'ABC123',
    };
    const datosConImagen = {
      ...DATOS,
      ejercicios: [{
        id: 'ej-1',
        nombre: 'Sentadilla',
        descripcion: '',
        categoriaIds: [],
        enlaces: [],
        imagenes: [{ id: 'img-1', tipo: 'archivo' as const, ruta: 'imagenes/img-1.json' }],
      }],
    };
    const { caso, importar, marcarCambiosLocalesPendientes } = configurar();

    await caso.importar(JSON.stringify(datosConImagen), archivos([imagen]));

    expect(importar).toHaveBeenCalledWith(datosConImagen, expect.any(Function));
    const resolver = importar.mock.calls[0][1] as (ruta: string) => Promise<ImagenArchivoJSON>;
    await expect(resolver('imagenes/img-1.json')).resolves.toEqual(imagen);
    await expect(resolver('imagenes/inexistente.json')).rejects.toThrow(ErrorValidacion);
    expect(marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });

  it('rechaza una imagen demasiado grande sin marcar cambios pendientes', async () => {
    const imagen: ImagenArchivoJSON = {
      id: 'img-1',
      nombreArchivo: 'grande.png',
      tipoMime: 'image/png',
      contenidoBase64: 'A'.repeat(Math.ceil(((5 * 1024 * 1024 + 1) * 4) / 3)),
    };
    const datosConImagen = {
      ...DATOS,
      ejercicios: [{
        id: 'ej-1',
        nombre: 'Sentadilla',
        descripcion: '',
        categoriaIds: [],
        enlaces: [],
        imagenes: [{ id: 'img-1', tipo: 'archivo' as const, ruta: 'imagenes/img-1.json' }],
      }],
    };
    const { caso, importar, marcarCambiosLocalesPendientes } = configurar();

    await expect(caso.importar(JSON.stringify(datosConImagen), archivos([imagen]))).rejects.toThrow(
      'Cada imagen de archivo no puede superar los 5 MB.'
    );

    expect(importar).not.toHaveBeenCalled();
    expect(marcarCambiosLocalesPendientes).not.toHaveBeenCalled();
  });
});
