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

  const generica: Categoria = { id: 'cat-generica', nombre: 'Sin categoría', esGenerica: true };

  beforeEach(() => {
    categoriaRepo = {
      listarTodas: vi.fn(),
      obtenerPorId: vi.fn().mockResolvedValue({ id: 'cat-1', nombre: 'Abdomen', esGenerica: false }),
      obtenerGenerica: vi.fn().mockResolvedValue(generica),
      crear: vi.fn().mockResolvedValue({ id: 'cat-nueva', nombre: 'Rodilla', esGenerica: false }),
      crearGenerica: vi.fn(),
      actualizar: vi.fn().mockResolvedValue({ id: 'cat-1', nombre: 'Rodillas', esGenerica: false }),
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
    };
    ajustesRepo = {
      obtener: vi.fn(),
      guardarCredencialesGitHub: vi.fn(),
      olvidarCredencialesGitHub: vi.fn(),
      actualizarUltimoShaSincronizado: vi.fn(),
      registrarSincronizacionCorrecta: vi.fn(),
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

  it('captura la categoría y las asignaciones antes de eliminar para poder restaurarlas', async () => {
    const ejercicio = {
      id: 'ej-1',
      nombre: 'Sentadilla',
      descripcion: 'Flexionar rodillas',
      categoriaIds: ['cat-1', 'cat-2'],
      enlaces: [],
      imagenes: [],
    } satisfies Ejercicio;
    (ejercicioRepo.listarTodos as ReturnType<typeof vi.fn>).mockResolvedValue([ejercicio]);

    const snapshot = await caso.eliminar('cat-1');

    expect(snapshot).toEqual({
      categoria: { id: 'cat-1', nombre: 'Abdomen', esGenerica: false },
      ejercicios: [{ id: 'ej-1', categoriaIds: ['cat-1', 'cat-2'] }],
    });
  });

  it('restaura la categoría con su identificador y las asignaciones anteriores', async () => {
    const snapshot = {
      categoria: { id: 'cat-1', nombre: 'Abdomen', esGenerica: false },
      ejercicios: [{ id: 'ej-1', categoriaIds: ['cat-1', 'cat-2'] }],
    };

    await caso.restaurarEliminacion(snapshot);

    expect(categoriaRepo.restaurar).toHaveBeenCalledWith(snapshot.categoria);
    expect(ejercicioRepo.actualizar).toHaveBeenCalledWith('ej-1', { categoriaIds: ['cat-1', 'cat-2'] });
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledWith(true);
  });

  it('propaga explícitamente los errores al restaurar la categoría', async () => {
    (categoriaRepo.restaurar as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fallo de restauración'));

    await expect(
      caso.restaurarEliminacion({
        categoria: { id: 'cat-1', nombre: 'Abdomen', esGenerica: false },
        ejercicios: [],
      })
    ).rejects.toThrow('fallo de restauración');
  });
});
