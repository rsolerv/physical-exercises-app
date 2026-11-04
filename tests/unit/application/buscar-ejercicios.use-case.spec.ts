import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BuscarEjerciciosUseCase } from '../../../src/app/application/casos-uso/buscar-ejercicios.use-case';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';

describe('BuscarEjerciciosUseCase', () => {
  function configurar(repo: Partial<EjercicioRepositoryPort>) {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: EjercicioRepositoryPort, useValue: repo }],
    });
    return TestBed.inject(BuscarEjerciciosUseCase);
  }

  it('delega sin cargar el catálogo completo, con página inicial 0 y tamaño 50', async () => {
    const buscarPaginado = vi.fn().mockResolvedValue({ resultados: [], total: 0 });
    const listarTodos = vi.fn();
    const caso = configurar({ buscarPaginado, listarTodos });
    expect(await caso.buscarPaginado('  senta  ', ['cat-1', 'cat-1', 'cat-2'])).toEqual({
      resultados: [],
      total: 0,
    });
    expect(buscarPaginado).toHaveBeenCalledWith({
      texto: 'senta', categoriaIds: ['cat-1', 'cat-2'], pagina: 0, tamanoPagina: 50,
    });
    expect(listarTodos).not.toHaveBeenCalled();
  });

  it('transmite página y tamaño explícitos, y consulta el total ligero', async () => {
    const buscarPaginado = vi.fn().mockResolvedValue({ resultados: [], total: 125 });
    const contarTodos = vi.fn().mockResolvedValue(125);
    const caso = configurar({ buscarPaginado, contarTodos });
    await caso.buscarPaginado('', [], 2, 25);
    expect(buscarPaginado).toHaveBeenCalledWith({
      texto: '', categoriaIds: [], pagina: 2, tamanoPagina: 25,
    });
    expect(await caso.contarTotal()).toBe(125);
    expect(contarTodos).toHaveBeenCalledOnce();
  });

  it.each([
    [-1, 50], [0.5, 50], [Number.NaN, 50], [Number.MAX_SAFE_INTEGER + 1, 50],
    [0, 0], [0, 101], [0, 1.5], [0, Infinity], [Number.MAX_SAFE_INTEGER, 50],
  ])('rechaza página/tamaño inválidos (%s, %s)', async (pagina, tamano) => {
    const buscarPaginado = vi.fn();
    const caso = configurar({ buscarPaginado });
    expect(() => caso.buscarPaginado('', [], pagina, tamano)).toThrow(ErrorValidacion);
    expect(buscarPaginado).not.toHaveBeenCalled();
  });

  it('propaga errores de búsqueda y conteo', async () => {
    const fallo = new Error('SQLite no disponible');
    const caso = configurar({
      buscarPaginado: vi.fn().mockRejectedValue(fallo),
      contarTodos: vi.fn().mockRejectedValue(fallo),
    });
    await expect(caso.buscarPaginado('', [])).rejects.toBe(fallo);
    await expect(caso.contarTotal()).rejects.toBe(fallo);
  });
});
