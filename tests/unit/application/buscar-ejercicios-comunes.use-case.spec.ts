import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BuscarEjerciciosComunesUseCase } from '../../../src/app/application/casos-uso/buscar-ejercicios-comunes.use-case';
import { RepositorioComunPort } from '../../../src/app/application/ports/repositorio-comun.port';
import type { EjercicioComunArchivo } from '../../../src/app/application/ports/repositorio-comun.port';

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
});
