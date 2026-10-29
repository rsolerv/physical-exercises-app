import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BuscarEjerciciosComunesUseCase } from '../../../src/app/application/casos-uso/buscar-ejercicios-comunes.use-case';
import { RepositorioComunPort } from '../../../src/app/application/ports/repositorio-comun.port';
import type { EjercicioComunArchivo } from '../../../src/app/application/ports/repositorio-comun.port';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';

function ejercicioComun(sobrescribir: Partial<EjercicioComunArchivo> = {}): EjercicioComunArchivo {
  return {
    id: 'ej-1',
    nombre: 'Almeja',
    descripcion: 'Tumbada de lado.',
    categoriaIds: ['cat-comun-1'],
    enlaces: [],
    imagenes: [],
    ...sobrescribir,
  };
}

describe('BuscarEjerciciosComunesUseCase', () => {
  function configurar(repo: Partial<RepositorioComunPort>) {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: RepositorioComunPort, useValue: repo }],
    });
    return TestBed.inject(BuscarEjerciciosComunesUseCase);
  }

  it('sin texto ni categoría, devuelve el catálogo completo (FR-004)', async () => {
    const buscarEjercicios = vi.fn().mockResolvedValue([ejercicioComun()]);
    const caso = configurar({ buscarEjercicios });

    const resultado = await caso.buscar('', null);

    expect(buscarEjercicios).toHaveBeenCalledWith('', null);
    expect(resultado).toEqual([ejercicioComun()]);
  });

  it('delega el filtro de texto y de una sola categoría en el puerto (FR-002, FR-003)', async () => {
    const buscarEjercicios = vi.fn().mockResolvedValue([]);
    const caso = configurar({ buscarEjercicios });

    await caso.buscar('  Almeja  ', 'cat-comun-1');

    expect(buscarEjercicios).toHaveBeenCalledWith('Almeja', 'cat-comun-1');
  });

  it('expone las categorías comunes del catálogo', async () => {
    const listarCategorias = vi.fn().mockResolvedValue([{ id: 'cat-comun-1', nombre: 'Rodilla' }]);
    const caso = configurar({ listarCategorias });

    const resultado = await caso.listarCategorias();

    expect(resultado).toEqual([{ id: 'cat-comun-1', nombre: 'Rodilla' }]);
  });

  it('carga la ficha remota y las imágenes de archivo para previsualizarla', async () => {
    const imagen = { id: 'img-1', nombreArchivo: 'almeja.png', tipoMime: 'image/png', contenidoBase64: 'QUJD' };
    const ejercicio = ejercicioComun({
      imagenes: [
        { id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' },
        { id: 'img-url', tipo: 'url', valorUrl: 'https://example.com/almeja.png' },
      ],
    });
    const obtenerEjercicioPorId = vi.fn().mockResolvedValue(ejercicio);
    const leerImagen = vi.fn().mockResolvedValue(imagen);
    const caso = configurar({ obtenerEjercicioPorId, leerImagen });

    const resultado = await caso.obtenerVistaPrevia('ej-1');

    expect(obtenerEjercicioPorId).toHaveBeenCalledWith('ej-1');
    expect(leerImagen).toHaveBeenCalledWith('imagenes/img-1.json');
    expect(resultado).toEqual({
      ejercicio,
      imagenesArchivo: new Map([['img-1', imagen]]),
      imagenesOmitidas: 0,
    });
  });

  it('omite imágenes remotas inválidas en la previsualización', async () => {
    const ejercicio = ejercicioComun({
      imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }],
    });
    const caso = configurar({
      obtenerEjercicioPorId: vi.fn().mockResolvedValue(ejercicio),
      leerImagen: vi.fn().mockRejectedValue(new ErrorValidacion('Imagen inválida')),
    });

    await expect(caso.obtenerVistaPrevia('ej-1')).resolves.toEqual({
      ejercicio,
      imagenesArchivo: new Map(),
      imagenesOmitidas: 1,
    });

  });

  it('propaga errores de red al cargar las imágenes remotas', async () => {
    const ejercicio = ejercicioComun({
      imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }],
    });
    const errorRed = new Error('Sin conexión');
    const caso = configurar({
      obtenerEjercicioPorId: vi.fn().mockResolvedValue(ejercicio),
      leerImagen: vi.fn().mockRejectedValue(errorRed),
    });
    await expect(caso.obtenerVistaPrevia('ej-1')).rejects.toBe(errorRed);
  });

  it('devuelve null si el ejercicio remoto ya no existe', async () => {
    const caso = configurar({ obtenerEjercicioPorId: vi.fn().mockResolvedValue(null) });

    await expect(caso.obtenerVistaPrevia('ej-inexistente')).resolves.toBeNull();
  });
});
