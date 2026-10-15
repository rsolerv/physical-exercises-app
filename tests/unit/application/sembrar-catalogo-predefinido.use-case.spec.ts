import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SembrarCatalogoPredefinidoUseCase } from '../../../src/app/application/casos-uso/sembrar-catalogo-predefinido.use-case';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { validarEjercicio } from '../../../src/app/domain/ejercicio/validar-ejercicio';
import catalogoPredefinido from '../../../src/assets/catalogo-predefinido/catalogo.json';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';
import type { DatosNuevoEjercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

describe('SembrarCatalogoPredefinidoUseCase', () => {
  let categoriaRepo: CategoriaRepositoryPort;
  let ejercicioRepo: EjercicioRepositoryPort;
  let ajustesRepo: AjustesRepositoryPort;
  let caso: SembrarCatalogoPredefinidoUseCase;

  beforeEach(() => {
    categoriaRepo = {
      listarTodas: vi.fn().mockResolvedValue([]),
      obtenerPorId: vi.fn(),
      obtenerGenerica: vi.fn(),
      crear: vi.fn().mockImplementation(async (nombre: string) => ({ id: `cat-${nombre}`, nombre, esGenerica: false }) as Categoria),
      crearGenerica: vi.fn().mockResolvedValue({ id: 'cat-generica', nombre: 'Sin categoría', esGenerica: true }),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
    };
    ejercicioRepo = {
      obtenerPorId: vi.fn(),
      listarTodos: vi.fn(),
      buscarPorTexto: vi.fn(),
      buscarPorCategorias: vi.fn(),
      crear: vi.fn().mockImplementation(async (datos: DatosNuevoEjercicio) => ({ id: 'ej-x', ...datos })),
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
      estaCatalogoPredefinidoCargado: vi.fn().mockResolvedValue(false),
      marcarCatalogoPredefinidoCargado: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: CategoriaRepositoryPort, useValue: categoriaRepo },
        { provide: EjercicioRepositoryPort, useValue: ejercicioRepo },
        { provide: AjustesRepositoryPort, useValue: ajustesRepo },
      ],
    });
    caso = TestBed.inject(SembrarCatalogoPredefinidoUseCase);
  });

  it('no hace nada si el catálogo ya está cargado', async () => {
    (ajustesRepo.estaCatalogoPredefinidoCargado as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    await caso.sembrarSiNecesario();

    expect(categoriaRepo.crearGenerica).not.toHaveBeenCalled();
    expect(categoriaRepo.crear).not.toHaveBeenCalled();
    expect(ejercicioRepo.crear).not.toHaveBeenCalled();
  });

  it('crea la categoría genérica "Sin categoría" si el catálogo no está cargado', async () => {
    await caso.sembrarSiNecesario();
    expect(categoriaRepo.crearGenerica).toHaveBeenCalledWith('Sin categoría');
  });

  it(`crea las ${catalogoPredefinido.categorias.length} categorías del catálogo`, async () => {
    await caso.sembrarSiNecesario();
    expect(categoriaRepo.crear).toHaveBeenCalledTimes(catalogoPredefinido.categorias.length);
  });

  it(`crea los ${catalogoPredefinido.ejercicios.length} ejercicios del catálogo, resolviendo sus categorías por nombre`, async () => {
    await caso.sembrarSiNecesario();
    expect(ejercicioRepo.crear).toHaveBeenCalledTimes(catalogoPredefinido.ejercicios.length);

    const primeraLlamada = (ejercicioRepo.crear as ReturnType<typeof vi.fn>).mock.calls[0][0] as DatosNuevoEjercicio;
    expect(primeraLlamada.categoriaIds.every((id) => id.startsWith('cat-'))).toBe(true);
  });

  it('no se repite en arranques posteriores (marca catalogoPredefinidoCargado) y NO marca cambiosLocalesPendientes (FR-034)', async () => {
    await caso.sembrarSiNecesario();
    expect(ajustesRepo.marcarCatalogoPredefinidoCargado).toHaveBeenCalledOnce();
    expect(ajustesRepo.marcarCambiosLocalesPendientes).not.toHaveBeenCalled();
  });
});

describe('Integridad del catálogo predefinido (catalogo.json)', () => {
  const nombresCategorias = new Set(catalogoPredefinido.categorias.map((c) => c.nombre));

  it('todas las categorías tienen un nombre único', () => {
    expect(nombresCategorias.size).toBe(catalogoPredefinido.categorias.length);
  });

  it('todos los ejercicios superan validarEjercicio y referencian categorías existentes', () => {
    for (const ejercicio of catalogoPredefinido.ejercicios) {
      for (const nombreCategoria of ejercicio.categorias) {
        expect(nombresCategorias.has(nombreCategoria)).toBe(true);
      }
      const datos: DatosNuevoEjercicio = {
        nombre: ejercicio.nombre,
        descripcion: ejercicio.descripcion,
        categoriaIds: ejercicio.categorias.map((nombre) => `cat-${nombre}`),
        enlaces: [
          ...ejercicio.enlacesWeb.map((url) => ({ tipo: 'web' as const, url })),
          ...ejercicio.enlacesYoutube.map((url) => ({ tipo: 'youtube' as const, url })),
        ],
        imagenes: [],
        observaciones: ejercicio.observaciones,
      };
      expect(() => validarEjercicio(datos)).not.toThrow();
    }
  });

  it('todos los nombres de ejercicio son únicos', () => {
    const nombres = catalogoPredefinido.ejercicios.map((e) => e.nombre);
    expect(new Set(nombres).size).toBe(nombres.length);
  });
});
