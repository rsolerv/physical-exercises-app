import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ExportarImportarDatosUseCase } from '../../../src/app/application/casos-uso/exportar-importar-datos.use-case';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { PlanificacionRepositoryPort } from '../../../src/app/application/ports/planificacion-repository.port';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';
import type { ImagenArchivoJSON } from '../../../src/app/application/ports/github-sync.port';

const resolverImagenVacio = async (): Promise<ImagenArchivoJSON> => {
  throw new Error('No se esperaban imágenes de archivo.');
};

function ejercicio(sobrescribir: Partial<Ejercicio> = {}): Ejercicio {
  return {
    id: 'ej-1',
    nombre: 'Sentadilla',
    descripcion: 'desc',
    categoriaIds: ['cat-1'],
    enlaces: [],
    imagenes: [],
    ...sobrescribir,
  };
}

describe('ExportarImportarDatosUseCase', () => {
  function configurar(overrides: {
    ejercicios?: Partial<EjercicioRepositoryPort>;
    categorias?: Partial<CategoriaRepositoryPort>;
    planificaciones?: Partial<PlanificacionRepositoryPort>;
    progreso?: Partial<ProgresoDiarioRepositoryPort>;
  }) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: EjercicioRepositoryPort,
          useValue: {
            listarTodos: vi.fn().mockResolvedValue([]),
            eliminar: vi.fn().mockResolvedValue(undefined),
            crear: vi.fn().mockResolvedValue(ejercicio()),
            ...overrides.ejercicios,
          },
        },
        {
          provide: CategoriaRepositoryPort,
          useValue: {
            listarTodas: vi.fn().mockResolvedValue([]),
            eliminar: vi.fn().mockResolvedValue(undefined),
            crear: vi.fn().mockResolvedValue({ id: 'cat-nueva', nombre: 'Cat' }),
            ...overrides.categorias,
          },
        },
        {
          provide: PlanificacionRepositoryPort,
          useValue: {
            listarTodas: vi.fn().mockResolvedValue([]),
            eliminar: vi.fn().mockResolvedValue(undefined),
            crear: vi.fn().mockResolvedValue({ id: 'plan-nueva', nombre: 'Semana', dias: crearDiasVacios() }),
            asignarEjercicioADia: vi.fn().mockResolvedValue(undefined),
            ...overrides.planificaciones,
          },
        },
        {
          provide: ProgresoDiarioRepositoryPort,
          useValue: {
            obtenerPorFecha: vi.fn().mockResolvedValue([]),
            marcar: vi.fn().mockResolvedValue(undefined),
            ...overrides.progreso,
          },
        },
      ],
    });
    return TestBed.inject(ExportarImportarDatosUseCase);
  }

  it('exportar() construye el JSON con ejercicios, categorías, planificaciones y progreso diario', async () => {
    const dias = crearDiasVacios();
    dias[0].ejercicioIds = ['ej-1'];
    const planificacion: Planificacion = { id: 'plan-1', nombre: 'Semana', fechaInicio: '2026-10-12', dias };
    const obtenerPorFecha = vi.fn().mockImplementation((fecha: Date) =>
      Promise.resolve(
        fecha.getFullYear() === 2026 && fecha.getMonth() === 9 && fecha.getDate() === 12
          ? [{ fecha: '2026-10-12', ejercicioId: 'ej-1', realizado: true }]
          : []
      )
    );
    const caso = configurar({
      ejercicios: { listarTodos: vi.fn().mockResolvedValue([ejercicio()]) },
      categorias: { listarTodas: vi.fn().mockResolvedValue([{ id: 'cat-1', nombre: 'Piernas' } as Categoria]) },
      planificaciones: { listarTodas: vi.fn().mockResolvedValue([planificacion]) },
      progreso: { obtenerPorFecha },
    });

    const resultado = await caso.exportar();

    expect(resultado.datos.ejercicios).toHaveLength(1);
    expect(resultado.datos.categorias).toHaveLength(1);
    expect(resultado.datos.planificaciones).toHaveLength(1);
    expect(resultado.datos.progresoDiario).toHaveLength(1);
  });

  it('exportar() nunca incluye el token ni el repositorio en el JSON (FR-037)', async () => {
    const caso = configurar({});
    const resultado = await caso.exportar();
    expect(JSON.stringify(resultado.datos)).not.toContain('token');
  });

  it('exportar() guarda las imágenes de archivo solo como ruta imagenes/<id>.json, nunca con su contenido (FR-036)', async () => {
    const ejercicioConImagen = ejercicio({
      imagenes: [{ id: 'img-1', tipo: 'archivo', contenidoBase64: 'ABC123', tipoMime: 'image/png', nombreArchivo: 'foto.png' }],
    });
    const caso = configurar({ ejercicios: { listarTodos: vi.fn().mockResolvedValue([ejercicioConImagen]) } });

    const resultado = await caso.exportar();

    expect(resultado.datos.ejercicios[0].imagenes[0]).toEqual({ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' });
    expect(resultado.imagenesParaSubir).toEqual([
      { id: 'img-1', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'ABC123' },
    ]);
  });

  it('importar() reemplaza los datos locales: elimina lo existente y crea lo importado', async () => {
    const eliminarEjercicio = vi.fn().mockResolvedValue(undefined);
    const eliminarPlanificacion = vi.fn().mockResolvedValue(undefined);
    const eliminarCategoria = vi.fn().mockResolvedValue(undefined);
    const crearEjercicio = vi.fn().mockResolvedValue(ejercicio({ id: 'ej-nuevo' }));

    const caso = configurar({
      ejercicios: {
        listarTodos: vi.fn().mockResolvedValue([ejercicio({ id: 'ej-viejo' })]),
        eliminar: eliminarEjercicio,
        crear: crearEjercicio,
      },
      categorias: {
        listarTodas: vi.fn().mockResolvedValue([{ id: 'cat-vieja', nombre: 'Vieja' } as Categoria]),
        eliminar: eliminarCategoria,
      },
      planificaciones: {
        listarTodas: vi.fn().mockResolvedValue([{ id: 'plan-vieja', nombre: 'Vieja', dias: crearDiasVacios() } as Planificacion]),
        eliminar: eliminarPlanificacion,
      },
    });

    await caso.importar(
      { version: 1, ejercicios: [ejercicio()], categorias: [{ id: 'cat-1', nombre: 'Piernas' }], planificaciones: [], progresoDiario: [] },
      resolverImagenVacio
    );

    expect(eliminarEjercicio).toHaveBeenCalledWith('ej-viejo');
    expect(eliminarPlanificacion).toHaveBeenCalledWith('plan-vieja');
    expect(eliminarCategoria).toHaveBeenCalledWith('cat-vieja');
    expect(crearEjercicio).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Sentadilla' }));
  });

  it('importar() rechaza ejercicios sin categoría antes de borrar los datos locales', async () => {
    const listarTodos = vi.fn().mockResolvedValue([ejercicio({ id: 'ej-local' })]);
    const eliminar = vi.fn();
    const caso = configurar({ ejercicios: { listarTodos, eliminar } });

    await expect(
      caso.importar(
        {
          version: 1,
          ejercicios: [ejercicio({ categoriaIds: [] })],
          categorias: [],
          planificaciones: [],
          progresoDiario: [],
        },
        resolverImagenVacio
      )
    ).rejects.toThrow(ErrorValidacion);

    expect(listarTodos).not.toHaveBeenCalled();
    expect(eliminar).not.toHaveBeenCalled();
  });

  it('importar() resuelve por ruta cada imagen de archivo y la guarda localmente', async () => {
    const resolverImagen = vi
      .fn<(ruta: string) => Promise<ImagenArchivoJSON>>()
      .mockResolvedValue({ id: 'img-1', nombreArchivo: 'foto.png', tipoMime: 'image/png', contenidoBase64: 'ABC123' });
    const crearEjercicio = vi.fn().mockResolvedValue(ejercicio());
    const caso = configurar({ ejercicios: { crear: crearEjercicio } });

    const ejercicioConImagen = {
      id: 'ej-1',
      nombre: 'Sentadilla',
      descripcion: 'desc',
      categoriaIds: ['cat-1'],
      enlaces: [],
      imagenes: [{ id: 'img-1', tipo: 'archivo' as const, ruta: 'imagenes/img-1.json' }],
    };

    await caso.importar(
      {
        version: 1,
        ejercicios: [ejercicioConImagen],
        categorias: [{ id: 'cat-1', nombre: 'Piernas' }],
        planificaciones: [],
        progresoDiario: [],
      },
      resolverImagen
    );

    expect(resolverImagen).toHaveBeenCalledWith('imagenes/img-1.json');
    expect(crearEjercicio).toHaveBeenCalledWith(
      expect.objectContaining({
        imagenes: [{ id: 'img-1', tipo: 'archivo', contenidoBase64: 'ABC123', tipoMime: 'image/png', nombreArchivo: 'foto.png' }],
      })
    );
  });

  it('resuelve todas las imágenes antes de eliminar datos locales', async () => {
    const eliminar = vi.fn().mockResolvedValue(undefined);
    const resolverImagen = vi.fn().mockResolvedValue({
      id: 'img-1',
      nombreArchivo: 'foto.png',
      tipoMime: 'image/png',
      contenidoBase64: 'ABC123',
    });
    const caso = configurar({
      ejercicios: {
        listarTodos: vi.fn().mockResolvedValue([ejercicio({ id: 'local' })]),
        eliminar,
      },
    });
    const datos = {
      version: 1,
      ejercicios: [{
        id: 'ej-1',
        nombre: 'Sentadilla',
        descripcion: 'desc',
        categoriaIds: ['cat-1'],
        enlaces: [],
        imagenes: [{ id: 'img-1', tipo: 'archivo' as const, ruta: 'imagenes/img-1.json' }],
      }],
      categorias: [{ id: 'cat-1', nombre: 'Piernas' }],
      planificaciones: [],
      progresoDiario: [],
    };

    await caso.importar(datos, resolverImagen);

    expect(resolverImagen.mock.invocationCallOrder[0]).toBeLessThan(eliminar.mock.invocationCallOrder[0]);
    expect(eliminar).toHaveBeenCalledWith('local');
  });

  it('si falla la resolución de imágenes, conserva intactos los datos locales', async () => {
    const listarTodos = vi.fn().mockResolvedValue([ejercicio({ id: 'local' })]);
    const eliminar = vi.fn();
    const resolverImagen = vi.fn().mockRejectedValue(new Error('Fallo de red'));
    const caso = configurar({ ejercicios: { listarTodos, eliminar } });
    const datos = {
      version: 1,
      ejercicios: [{
        id: 'ej-1',
        nombre: 'Sentadilla',
        descripcion: 'desc',
        categoriaIds: ['cat-1'],
        enlaces: [],
        imagenes: [{ id: 'img-1', tipo: 'archivo' as const, ruta: 'imagenes/img-1.json' }],
      }],
      categorias: [{ id: 'cat-1', nombre: 'Piernas' }],
      planificaciones: [],
      progresoDiario: [],
    };

    await expect(caso.importar(datos, resolverImagen)).rejects.toThrow('Fallo de red');

    expect(listarTodos).not.toHaveBeenCalled();
    expect(eliminar).not.toHaveBeenCalled();
  });

  it('con omitirImagenesInvalidas importa el resto y omite solo la imagen con documento inválido', async () => {
    const crearEjercicio = vi.fn().mockResolvedValue(ejercicio());
    const resolverImagen = vi
      .fn<(ruta: string) => Promise<ImagenArchivoJSON>>()
      .mockRejectedValueOnce(new ErrorValidacion('Documento inválido'))
      .mockResolvedValueOnce({ id: 'img-2', nombreArchivo: 'b.png', tipoMime: 'image/png', contenidoBase64: 'ABC123' });
    const caso = configurar({ ejercicios: { crear: crearEjercicio } });
    const datos = {
      version: 1,
      ejercicios: [{
        id: 'ej-1',
        nombre: 'Sentadilla',
        descripcion: 'desc',
        categoriaIds: ['cat-1'],
        enlaces: [],
        imagenes: [
          { id: 'img-1', tipo: 'archivo' as const, ruta: 'imagenes/img-1.json' },
          { id: 'img-2', tipo: 'archivo' as const, ruta: 'imagenes/img-2.json' },
        ],
      }],
      categorias: [{ id: 'cat-1', nombre: 'Piernas' }],
      planificaciones: [],
      progresoDiario: [],
    };

    const resultado = await caso.importar(datos, resolverImagen, true);

    expect(resultado).toEqual({ imagenesOmitidas: 1 });
    expect(crearEjercicio).toHaveBeenCalledWith(
      expect.objectContaining({
        imagenes: [{ id: 'img-2', tipo: 'archivo', contenidoBase64: 'ABC123', tipoMime: 'image/png', nombreArchivo: 'b.png' }],
      })
    );
  });

  it('sin omitirImagenesInvalidas una imagen inválida sigue abortando la importación', async () => {
    const eliminar = vi.fn();
    const resolverImagen = vi.fn().mockRejectedValue(new ErrorValidacion('Documento inválido'));
    const caso = configurar({ ejercicios: { eliminar } });
    const datos = {
      version: 1,
      ejercicios: [{
        id: 'ej-1',
        nombre: 'Sentadilla',
        descripcion: 'desc',
        categoriaIds: ['cat-1'],
        enlaces: [],
        imagenes: [{ id: 'img-1', tipo: 'archivo' as const, ruta: 'imagenes/img-1.json' }],
      }],
      categorias: [{ id: 'cat-1', nombre: 'Piernas' }],
      planificaciones: [],
      progresoDiario: [],
    };

    await expect(caso.importar(datos, resolverImagen)).rejects.toThrow('Documento inválido');
    expect(eliminar).not.toHaveBeenCalled();
  });

  it('con omitirImagenesInvalidas los errores que no son de validación (p. ej. red) siguen abortando', async () => {
    const eliminar = vi.fn();
    const resolverImagen = vi.fn().mockRejectedValue(new Error('Fallo de red'));
    const caso = configurar({ ejercicios: { eliminar } });
    const datos = {
      version: 1,
      ejercicios: [{
        id: 'ej-1',
        nombre: 'Sentadilla',
        descripcion: 'desc',
        categoriaIds: ['cat-1'],
        enlaces: [],
        imagenes: [{ id: 'img-1', tipo: 'archivo' as const, ruta: 'imagenes/img-1.json' }],
      }],
      categorias: [{ id: 'cat-1', nombre: 'Piernas' }],
      planificaciones: [],
      progresoDiario: [],
    };

    await expect(caso.importar(datos, resolverImagen, true)).rejects.toThrow('Fallo de red');
    expect(eliminar).not.toHaveBeenCalled();
  });

  it('rechaza imágenes de archivo mayores de 5 MB antes de borrar datos locales', async () => {
    const listarTodos = vi.fn().mockResolvedValue([ejercicio({ id: 'local' })]);
    const eliminar = vi.fn();
    const resolverImagen = vi.fn().mockResolvedValue({
      id: 'img-1',
      nombreArchivo: 'grande.png',
      tipoMime: 'image/png',
      contenidoBase64: 'A'.repeat(Math.ceil(((5 * 1024 * 1024 + 1) * 4) / 3)),
    });
    const caso = configurar({ ejercicios: { listarTodos, eliminar } });
    const datos = {
      version: 1,
      ejercicios: [{
        id: 'ej-1',
        nombre: 'Sentadilla',
        descripcion: 'desc',
        categoriaIds: ['cat-1'],
        enlaces: [],
        imagenes: [{ id: 'img-1', tipo: 'archivo' as const, ruta: 'imagenes/img-1.json' }],
      }],
      categorias: [{ id: 'cat-1', nombre: 'Piernas' }],
      planificaciones: [],
      progresoDiario: [],
    };

    await expect(caso.importar(datos, resolverImagen)).rejects.toThrow(
      'Cada imagen de archivo no puede superar los 5 MB.'
    );

    expect(listarTodos).not.toHaveBeenCalled();
    expect(eliminar).not.toHaveBeenCalled();
  });
});
