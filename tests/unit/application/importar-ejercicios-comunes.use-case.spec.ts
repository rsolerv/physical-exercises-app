import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ImportarEjerciciosComunesUseCase } from '../../../src/app/application/casos-uso/importar-ejercicios-comunes.use-case';
import { RepositorioComunPort } from '../../../src/app/application/ports/repositorio-comun.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { ErrorRedSincronizacion, ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';
import type { EjercicioComunArchivo } from '../../../src/app/application/ports/repositorio-comun.port';
import type { ImagenArchivoJSON } from '../../../src/app/application/ports/github-sync.port';

function ejercicioComun(sobrescribir: Partial<EjercicioComunArchivo> = {}): EjercicioComunArchivo {
  return {
    id: 'comun-1',
    nombre: 'Almeja',
    descripcion: 'Tumbada de lado.',
    categoriaIds: ['cat-comun-rodilla'],
    enlaces: [],
    imagenes: [],
    ...sobrescribir,
  };
}

describe('ImportarEjerciciosComunesUseCase', () => {
  function configurar(opciones: {
    categoriasComunes?: { id: string; nombre: string }[];
    categoriasLocales?: { id: string; nombre: string }[];
    leerImagen?: ReturnType<typeof vi.fn>;
    crear?: ReturnType<typeof vi.fn>;
    marcarCambiosLocalesPendientes?: ReturnType<typeof vi.fn>;
  }) {
    const crear =
      opciones.crear ??
      vi.fn().mockImplementation(async (datos) => ({ id: 'nuevo-id', ...datos, subidoRepositorioComun: false }));
    const marcarCambiosLocalesPendientes = opciones.marcarCambiosLocalesPendientes ?? vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: RepositorioComunPort,
          useValue: {
            listarCategorias: vi
              .fn()
              .mockResolvedValue(opciones.categoriasComunes ?? [{ id: 'cat-comun-rodilla', nombre: 'Rodilla' }]),
            leerImagen: opciones.leerImagen ?? vi.fn(),
          },
        },
        {
          provide: CategoriaRepositoryPort,
          useValue: {
            listarTodas: vi
              .fn()
              .mockResolvedValue(opciones.categoriasLocales ?? [{ id: 'cat-local-rodilla', nombre: 'Rodilla' }]),
          },
        },
        { provide: EjercicioRepositoryPort, useValue: { crear } },
        { provide: AjustesRepositoryPort, useValue: { marcarCambiosLocalesPendientes } },
      ],
    });
    return {
      caso: TestBed.inject(ImportarEjerciciosComunesUseCase),
      crear,
      marcarCambiosLocalesPendientes,
    };
  }

  describe('obtenerCategoriasPendientes', () => {
    it('devuelve una lista vacía si todas las categorías coinciden por nombre con alguna propia', async () => {
      const { caso } = configurar({});
      const pendientes = await caso.obtenerCategoriasPendientes([ejercicioComun()]);
      expect(pendientes).toEqual([]);
    });

    it('devuelve las categorías comunes referenciadas que no coinciden por nombre (FR-009)', async () => {
      const { caso } = configurar({
        categoriasComunes: [{ id: 'cat-comun-rodilla', nombre: 'Rodilla' }, { id: 'cat-comun-cadera', nombre: 'Cadera' }],
        categoriasLocales: [{ id: 'cat-local-rodilla', nombre: 'Rodilla' }],
      });
      const pendientes = await caso.obtenerCategoriasPendientes([
        ejercicioComun({ categoriaIds: ['cat-comun-rodilla', 'cat-comun-cadera'] }),
      ]);
      expect(pendientes).toEqual([{ id: 'cat-comun-cadera', nombre: 'Cadera' }]);
    });

    it('compara nombres ignorando mayúsculas y espacios', async () => {
      const { caso } = configurar({
        categoriasComunes: [{ id: 'cat-comun-rodilla', nombre: '  RODILLA ' }],
        categoriasLocales: [{ id: 'cat-local-rodilla', nombre: 'rodilla' }],
      });
      const pendientes = await caso.obtenerCategoriasPendientes([ejercicioComun()]);
      expect(pendientes).toEqual([]);
    });
  });

  describe('importar', () => {
    it('importa directamente cuando todas las categorías coinciden por nombre (CA6)', async () => {
      const { caso, crear, marcarCambiosLocalesPendientes } = configurar({});

      const resultado = await caso.importar([ejercicioComun()], new Map());

      expect(crear).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Almeja', categoriaIds: ['cat-local-rodilla'] })
      );
      expect(marcarCambiosLocalesPendientes).toHaveBeenCalledOnce();
      expect(resultado).toEqual({ creados: 1, imagenesOmitidas: 0 });
    });

    it('sustituye una categoría no reconocida por el mapeo manual indicado (FR-009)', async () => {
      const { caso, crear } = configurar({
        categoriasComunes: [{ id: 'cat-comun-cadera', nombre: 'Cadera' }],
        categoriasLocales: [{ id: 'cat-local-rodilla', nombre: 'Rodilla' }],
      });

      await caso.importar(
        [ejercicioComun({ categoriaIds: ['cat-comun-cadera'] })],
        new Map([['cat-comun-cadera', 'cat-local-rodilla']])
      );

      expect(crear).toHaveBeenCalledWith(expect.objectContaining({ categoriaIds: ['cat-local-rodilla'] }));
    });

    it('bloquea la importación si falta resolver una categoría no reconocida, sin crear nada', async () => {
      const { caso, crear } = configurar({
        categoriasComunes: [{ id: 'cat-comun-cadera', nombre: 'Cadera' }],
        categoriasLocales: [{ id: 'cat-local-rodilla', nombre: 'Rodilla' }],
      });

      await expect(
        caso.importar([ejercicioComun({ categoriaIds: ['cat-comun-cadera'] })], new Map())
      ).rejects.toThrow(ErrorValidacion);
      expect(crear).not.toHaveBeenCalled();
    });

    it('bloquea la importación si el usuario no tiene ninguna categoría propia (FR-010), sin crear nada', async () => {
      const { caso, crear } = configurar({ categoriasLocales: [] });

      await expect(caso.importar([ejercicioComun()], new Map())).rejects.toThrow(ErrorValidacion);
      expect(crear).not.toHaveBeenCalled();
    });

    it('omite solo las imágenes de archivo inválidas e informa el recuento omitido (FR-011)', async () => {
      const leerImagen = vi.fn().mockRejectedValue(new ErrorValidacion('Formato inválido.'));
      const { caso, crear } = configurar({ leerImagen });

      const resultado = await caso.importar(
        [ejercicioComun({ imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }] })],
        new Map()
      );

      expect(crear).toHaveBeenCalledWith(expect.objectContaining({ imagenes: [] }));
      expect(resultado).toEqual({ creados: 1, imagenesOmitidas: 1 });
    });

    it('reincorpora correctamente una imagen de archivo válida', async () => {
      const imagenLeida: ImagenArchivoJSON = {
        id: 'img-1',
        nombreArchivo: 'foto.png',
        tipoMime: 'image/png',
        contenidoBase64: 'QUJD',
      };
      const leerImagen = vi.fn().mockResolvedValue(imagenLeida);
      const { caso, crear } = configurar({ leerImagen });

      await caso.importar(
        [ejercicioComun({ imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }] })],
        new Map()
      );

      expect(crear).toHaveBeenCalledWith(
        expect.objectContaining({
          imagenes: [{ id: 'img-1', tipo: 'archivo', contenidoBase64: 'QUJD', tipoMime: 'image/png', nombreArchivo: 'foto.png' }],
        })
      );
    });

    it('no importa nada si falla la red al leer una imagen, sin dejar cambios parciales (FR-023)', async () => {
      const leerImagen = vi.fn().mockRejectedValue(new ErrorRedSincronizacion('Sin conexión.'));
      const { caso, crear } = configurar({ leerImagen });

      await expect(
        caso.importar(
          [ejercicioComun({ imagenes: [{ id: 'img-1', tipo: 'archivo', ruta: 'imagenes/img-1.json' }] })],
          new Map()
        )
      ).rejects.toThrow(ErrorRedSincronizacion);
      expect(crear).not.toHaveBeenCalled();
    });

    it('no deja ninguna creación a medias si un segundo ejercicio seleccionado falla al resolver su categoría', async () => {
      const { caso, crear } = configurar({
        categoriasComunes: [
          { id: 'cat-comun-rodilla', nombre: 'Rodilla' },
          { id: 'cat-comun-cadera', nombre: 'Cadera' },
        ],
        categoriasLocales: [{ id: 'cat-local-rodilla', nombre: 'Rodilla' }],
      });

      await expect(
        caso.importar(
          [
            ejercicioComun({ id: 'comun-1', categoriaIds: ['cat-comun-rodilla'] }),
            ejercicioComun({ id: 'comun-2', categoriaIds: ['cat-comun-cadera'] }),
          ],
          new Map()
        )
      ).rejects.toThrow(ErrorValidacion);
      expect(crear).not.toHaveBeenCalled();
    });

    it('importa cada ejercicio seleccionado como una entrada nueva e independiente (no fusiona, CA10)', async () => {
      const { caso, crear } = configurar({});

      const resultado = await caso.importar(
        [ejercicioComun({ id: 'comun-1' }), ejercicioComun({ id: 'comun-2', nombre: 'Sentadilla' })],
        new Map()
      );

      expect(crear).toHaveBeenCalledTimes(2);
      expect(resultado.creados).toBe(2);
    });
  });
});
