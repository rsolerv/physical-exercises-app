import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BuscarEjerciciosUseCase } from '../../../src/app/application/casos-uso/buscar-ejercicios.use-case';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

function ejercicio(id: string, nombre: string, categoriaIds: string[] = ['cat-1']): Ejercicio {
  return { id, nombre, descripcion: `Descripción de ${nombre}`, categoriaIds, enlaces: [], imagenes: [] };
}

describe('BuscarEjerciciosUseCase', () => {
  function configurar(repo: Partial<EjercicioRepositoryPort>) {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: EjercicioRepositoryPort, useValue: repo }],
    });
    return TestBed.inject(BuscarEjerciciosUseCase);
  }

  it('sin texto ni categorías, devuelve todos los ejercicios', async () => {
    const listarTodos = vi.fn().mockResolvedValue([ejercicio('1', 'Sentadilla')]);
    const caso = configurar({ listarTodos });

    const resultado = await caso.buscar('', []);

    expect(listarTodos).toHaveBeenCalled();
    expect(resultado).toHaveLength(1);
  });

  it('busca por texto parcial sin distinguir mayúsculas sobre nombre o descripción (FR-013, CA6)', async () => {
    const buscarPorTexto = vi.fn().mockResolvedValue([ejercicio('1', 'Sentadilla')]);
    const caso = configurar({ buscarPorTexto });

    const resultado = await caso.buscar('senta', []);

    expect(buscarPorTexto).toHaveBeenCalledWith('senta');
    expect(resultado).toHaveLength(1);
  });

  it('busca por una o varias categorías (FR-012, CA7)', async () => {
    const buscarPorCategorias = vi.fn().mockResolvedValue([ejercicio('1', 'Sentadilla', ['cat-1', 'cat-2'])]);
    const caso = configurar({ buscarPorCategorias });

    const resultado = await caso.buscar('', ['cat-1', 'cat-2']);

    expect(buscarPorCategorias).toHaveBeenCalledWith(['cat-1', 'cat-2']);
    expect(resultado).toHaveLength(1);
  });

  it('combina texto y categorías con intersección (coincide con ambos criterios)', async () => {
    const buscarPorTexto = vi.fn().mockResolvedValue([ejercicio('1', 'Sentadilla'), ejercicio('2', 'Plancha')]);
    const buscarPorCategorias = vi.fn().mockResolvedValue([ejercicio('2', 'Plancha')]);
    const caso = configurar({ buscarPorTexto, buscarPorCategorias });

    const resultado = await caso.buscar('a', ['cat-1']);

    expect(resultado.map((e) => e.id)).toEqual(['2']);
  });

  it('devuelve una lista vacía sin lanzar error cuando no hay coincidencias (CL3)', async () => {
    const buscarPorTexto = vi.fn().mockResolvedValue([]);
    const caso = configurar({ buscarPorTexto });

    const resultado = await caso.buscar('inexistente', []);

    expect(resultado).toEqual([]);
  });

  it('devuelve una lista vacía cuando la biblioteca está vacía (CL1)', async () => {
    const listarTodos = vi.fn().mockResolvedValue([]);
    const caso = configurar({ listarTodos });

    const resultado = await caso.buscar('', []);

    expect(resultado).toEqual([]);
  });
});
