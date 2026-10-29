import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GestionarCategoriaUseCase } from '../../../src/app/application/casos-uso/gestionar-categoria.use-case';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

describe('GestionarCategoriaUseCase', () => {
  let categoriaRepo: CategoriaRepositoryPort;
  let ejercicioRepo: EjercicioRepositoryPort;
  let ajustesRepo: AjustesRepositoryPort;
  let caso: GestionarCategoriaUseCase;

  beforeEach(() => {
    categoriaRepo = {
      listarTodas: vi.fn(),
      obtenerPorId: vi.fn().mockResolvedValue({ id: 'cat-1', nombre: 'Abdomen' }),
      crear: vi.fn().mockResolvedValue({ id: 'cat-nueva', nombre: 'Rodilla' }),
      actualizar: vi.fn().mockResolvedValue({ id: 'cat-1', nombre: 'Rodillas' }),
      eliminar: vi.fn(),
      restaurar: vi.fn().mockResolvedValue(undefined),
    };
    ejercicioRepo = {
      obtenerPorId: vi.fn(),
      listarTodos: vi.fn().mockResolvedValue([]),
      buscarPorTexto: vi.fn(),
      buscarPorCategorias: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn().mockResolvedValue({}),
      eliminar: vi.fn(),
      restaurar: vi.fn().mockResolvedValue(undefined),
      quitarCategoriaDeTodos: vi.fn(),
      marcarSubidoRepositorioComun: vi.fn(),
    };
    ajustesRepo = {
      obtener: vi.fn(),
      guardarCredencialesGitHub: vi.fn(),
      olvidarCredencialesGitHub: vi.fn(),
      conectarGoogle: vi.fn(),
      desconectarGoogle: vi.fn(),
      activarMetodo: vi.fn(),
      registrarSincronizacionCompletada: vi.fn(),
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
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });

  it('actualiza una categoría y marca cambios locales pendientes', async () => {
    await caso.actualizar('cat-1', { nombre: 'Rodillas' });
    expect(categoriaRepo.actualizar).toHaveBeenCalledWith('cat-1', { nombre: 'Rodillas' });
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });

  it('eliminar retira la categoría de ejercicios con otras categorías antes de borrarla (FR-011)', async () => {
    const orden: string[] = [];
    (ejercicioRepo.listarTodos as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'ej-1', nombre: 'Plancha', categoriaIds: ['cat-1', 'cat-2'] },
    ]);
    (ejercicioRepo.quitarCategoriaDeTodos as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      orden.push('quitarCategoriaDeTodos');
    });
    (categoriaRepo.eliminar as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      orden.push('eliminar');
    });

    await caso.eliminar('cat-1');

    expect(ejercicioRepo.quitarCategoriaDeTodos).toHaveBeenCalledWith('cat-1');
    expect(categoriaRepo.eliminar).toHaveBeenCalledWith('cat-1');
    expect(orden).toEqual(['quitarCategoriaDeTodos', 'eliminar']);
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });

  it('impide eliminar una categoría que es la única asignada y explica qué ejercicios reasignar', async () => {
    (ejercicioRepo.listarTodos as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'ej-1', nombre: 'Sentadilla', categoriaIds: ['cat-1'] },
    ]);

    await expect(caso.eliminar('cat-1')).rejects.toThrow(/Sentadilla.*Asigna otra categoría/);

    expect(ejercicioRepo.quitarCategoriaDeTodos).not.toHaveBeenCalled();
    expect(categoriaRepo.eliminar).not.toHaveBeenCalled();
    expect(ajustesRepo.marcarCambiosLocalesPendientes).not.toHaveBeenCalled();
  });

  it('captura la categoría y las asignaciones antes de eliminar para poder restaurarlas', async () => {
    const ejercicio = {
      id: 'ej-1',
      nombre: 'Sentadilla',
      descripcion: 'Flexionar rodillas',
      categoriaIds: ['cat-1', 'cat-2'],
      enlaces: [],
      imagenes: [],
      subidoRepositorioComun: false,
    } satisfies Ejercicio;
    (ejercicioRepo.listarTodos as ReturnType<typeof vi.fn>).mockResolvedValue([ejercicio]);

    const snapshot = await caso.eliminar('cat-1');

    expect(snapshot).toEqual({
      categoria: { id: 'cat-1', nombre: 'Abdomen' },
      ejercicios: [{ id: 'ej-1', categoriaIds: ['cat-1', 'cat-2'] }],
    });
  });

  it('restaura la categoría con su identificador y las asignaciones anteriores', async () => {
    const snapshot = {
      categoria: { id: 'cat-1', nombre: 'Abdomen' },
      ejercicios: [{ id: 'ej-1', categoriaIds: ['cat-1', 'cat-2'] }],
    };

    await caso.restaurarEliminacion(snapshot);

    expect(categoriaRepo.restaurar).toHaveBeenCalledWith(snapshot.categoria);
    expect(ejercicioRepo.actualizar).toHaveBeenCalledWith('ej-1', { categoriaIds: ['cat-1', 'cat-2'] });
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
  });

  it('propaga explícitamente los errores al restaurar la categoría', async () => {
    (categoriaRepo.restaurar as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fallo de restauración'));

    await expect(
      caso.restaurarEliminacion({
        categoria: { id: 'cat-1', nombre: 'Abdomen' },
        ejercicios: [],
      })
    ).rejects.toThrow('fallo de restauración');
  });
});
