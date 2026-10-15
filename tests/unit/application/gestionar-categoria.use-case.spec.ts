import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GestionarCategoriaUseCase } from '../../../src/app/application/casos-uso/gestionar-categoria.use-case';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';

describe('GestionarCategoriaUseCase', () => {
  let categoriaRepo: CategoriaRepositoryPort;
  let ejercicioRepo: EjercicioRepositoryPort;
  let ajustesRepo: AjustesRepositoryPort;
  let caso: GestionarCategoriaUseCase;

  const generica: Categoria = { id: 'cat-generica', nombre: 'Sin categoría', esGenerica: true };

  beforeEach(() => {
    categoriaRepo = {
      listarTodas: vi.fn(),
      obtenerPorId: vi.fn(),
      obtenerGenerica: vi.fn().mockResolvedValue(generica),
      crear: vi.fn().mockResolvedValue({ id: 'cat-nueva', nombre: 'Rodilla', esGenerica: false }),
      crearGenerica: vi.fn(),
      actualizar: vi.fn().mockResolvedValue({ id: 'cat-1', nombre: 'Rodillas', esGenerica: false }),
      eliminar: vi.fn(),
    };
    ejercicioRepo = {
      obtenerPorId: vi.fn(),
      listarTodos: vi.fn(),
      buscarPorTexto: vi.fn(),
      buscarPorCategorias: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
      quitarCategoriaDeTodos: vi.fn(),
    };
    ajustesRepo = {
      obtener: vi.fn(),
      guardarCredencialesGitHub: vi.fn(),
      olvidarCredencialesGitHub: vi.fn(),
      actualizarUltimoShaSincronizado: vi.fn(),
      marcarCambiosLocalesPendientes: vi.fn(),
      estaCatalogoPredefinidoCargado: vi.fn(),
      marcarCatalogoPredefinidoCargado: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: CategoriaRepositoryPort, useValue: categoriaRepo },
        { provide: EjercicioRepositoryPort, useValue: ejercicioRepo },
        { provide: AjustesRepositoryPort, useValue: ajustesRepo },
      ],
    });
    caso = TestBed.inject(GestionarCategoriaUseCase);
  });

  it('crea una categoría y marca cambios locales pendientes', async () => {
    const creada = await caso.crear('Rodilla');
    expect(creada.id).toBe('cat-nueva');
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledWith(true);
  });

  it('actualiza una categoría y marca cambios locales pendientes', async () => {
    await caso.actualizar('cat-1', { nombre: 'Rodillas' });
    expect(categoriaRepo.actualizar).toHaveBeenCalledWith('cat-1', { nombre: 'Rodillas' });
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledWith(true);
  });

  it('eliminar retira la categoría de los ejercicios (con reasignación a la genérica) antes de borrarla (FR-011)', async () => {
    const orden: string[] = [];
    (ejercicioRepo.quitarCategoriaDeTodos as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      orden.push('quitarCategoriaDeTodos');
    });
    (categoriaRepo.eliminar as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      orden.push('eliminar');
    });

    await caso.eliminar('cat-1');

    expect(categoriaRepo.obtenerGenerica).toHaveBeenCalled();
    expect(ejercicioRepo.quitarCategoriaDeTodos).toHaveBeenCalledWith('cat-1', 'cat-generica');
    expect(categoriaRepo.eliminar).toHaveBeenCalledWith('cat-1');
    expect(orden).toEqual(['quitarCategoriaDeTodos', 'eliminar']);
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledWith(true);
  });
});
