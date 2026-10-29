import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SubirEjercicioComunUseCase } from '../../../src/app/application/casos-uso/subir-ejercicio-comun.use-case';
import { RepositorioComunPort } from '../../../src/app/application/ports/repositorio-comun.port';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { ErrorNombreDuplicado, ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';
import type { AjustesAplicacion } from '../../../src/app/application/ports/ajustes-repository.port';

function ejercicio(sobrescribir: Partial<Ejercicio> = {}): Ejercicio {
  return {
    id: 'ej-1',
    nombre: 'Sentadilla',
    descripcion: 'Flexionar las rodillas.',
    categoriaIds: ['cat-1'],
    enlaces: [{ tipo: 'youtube', url: 'https://www.youtube.com/watch?v=abc123' }],
    imagenes: [],
    subidoRepositorioComun: false,
    ...sobrescribir,
  };
}

function ajustes(sobrescribir: Partial<AjustesAplicacion> = {}): AjustesAplicacion {
  return {
    tokenGitHub: 'token-secreto',
    repositorioGitHub: 'owner/datos-privados',
    ultimaVersionSincronizada: null,
    ultimaSincronizacionCorrecta: null,
    cambiosLocalesPendientes: false,
    catalogoPredefinidoCargado: true,
    metodoSincronizacion: 'github',
    cuentaGoogle: null,
    ...sobrescribir,
  };
}

describe('SubirEjercicioComunUseCase', () => {
  function configurar(opciones: {
    ajustes?: AjustesAplicacion;
    existeEjercicioPorNombre?: ReturnType<typeof vi.fn>;
    subirEjercicio?: ReturnType<typeof vi.fn>;
    marcarSubidoRepositorioComun?: ReturnType<typeof vi.fn>;
  }) {
    const existeEjercicioPorNombre = opciones.existeEjercicioPorNombre ?? vi.fn().mockResolvedValue(false);
    const subirEjercicio = opciones.subirEjercicio ?? vi.fn().mockResolvedValue(undefined);
    const marcarSubidoRepositorioComun = opciones.marcarSubidoRepositorioComun ?? vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: RepositorioComunPort,
          useValue: {
            listarCategorias: vi.fn().mockResolvedValue([{ id: 'cat-comun-1', nombre: 'Rodilla' }]),
            existeEjercicioPorNombre,
            subirEjercicio,
          },
        },
        { provide: AjustesRepositoryPort, useValue: { obtener: vi.fn().mockResolvedValue(opciones.ajustes ?? ajustes()) } },
        { provide: EjercicioRepositoryPort, useValue: { marcarSubidoRepositorioComun } },
      ],
    });
    return {
      caso: TestBed.inject(SubirEjercicioComunUseCase),
      existeEjercicioPorNombre,
      subirEjercicio,
      marcarSubidoRepositorioComun,
    };
  }

  describe('puedeOfrecerSubida', () => {
    it('devuelve false sin credenciales de GitHub guardadas (FR-014)', async () => {
      const { caso } = configurar({ ajustes: ajustes({ tokenGitHub: null }) });
      expect(await caso.puedeOfrecerSubida(ejercicio())).toBe(false);
    });

    it('devuelve false si el ejercicio no cumple el requisito mínimo (FR-015)', async () => {
      const { caso } = configurar({});
      expect(await caso.puedeOfrecerSubida(ejercicio({ enlaces: [], imagenes: [] }))).toBe(false);
    });

    it('devuelve false si el ejercicio ya se subió (FR-021)', async () => {
      const { caso } = configurar({});
      expect(await caso.puedeOfrecerSubida(ejercicio({ subidoRepositorioComun: true }))).toBe(false);
    });

    it('devuelve true cuando hay credenciales, el ejercicio cumple el requisito y no se ha subido aún', async () => {
      const { caso } = configurar({});
      expect(await caso.puedeOfrecerSubida(ejercicio())).toBe(true);
    });
  });

  describe('subir', () => {
    it('bloquea con ErrorNombreDuplicado si ya existe un ejercicio con ese nombre en main (FR-017)', async () => {
      const { caso, subirEjercicio } = configurar({ existeEjercicioPorNombre: vi.fn().mockResolvedValue(true) });

      await expect(caso.subir(ejercicio(), ['cat-comun-1'])).rejects.toThrow(ErrorNombreDuplicado);
      expect(subirEjercicio).not.toHaveBeenCalled();
    });

    it('exige al menos una categoría común (FR-016)', async () => {
      const { caso, subirEjercicio } = configurar({});
      await expect(caso.subir(ejercicio(), [])).rejects.toThrow(ErrorValidacion);
      expect(subirEjercicio).not.toHaveBeenCalled();
    });

    it('exige que el ejercicio cumpla el requisito mínimo antes de subir', async () => {
      const { caso, subirEjercicio } = configurar({});
      await expect(caso.subir(ejercicio({ enlaces: [], imagenes: [] }), ['cat-comun-1'])).rejects.toThrow(ErrorValidacion);
      expect(subirEjercicio).not.toHaveBeenCalled();
    });

    it('sube el ejercicio convertido y marca el ejercicio local como subido solo tras el éxito', async () => {
      const { caso, subirEjercicio, marcarSubidoRepositorioComun } = configurar({});

      await caso.subir(ejercicio(), ['cat-comun-1']);

      expect(subirEjercicio).toHaveBeenCalledWith(
        { tokenPAT: 'token-secreto', repositorio: 'owner/datos-privados' },
        expect.objectContaining({ id: 'ej-1', nombre: 'Sentadilla', categoriaIds: ['cat-comun-1'] }),
        []
      );
      expect(marcarSubidoRepositorioComun).toHaveBeenCalledWith('ej-1');
    });

    it('no marca el ejercicio como subido si la subida falla', async () => {
      const { caso, marcarSubidoRepositorioComun } = configurar({
        subirEjercicio: vi.fn().mockRejectedValue(new Error('fallo de red')),
      });

      await expect(caso.subir(ejercicio(), ['cat-comun-1'])).rejects.toThrow('fallo de red');
      expect(marcarSubidoRepositorioComun).not.toHaveBeenCalled();
    });
  });

  describe('comprobarDuplicado', () => {
    it('delega en el puerto usando las credenciales guardadas', async () => {
      const { caso, existeEjercicioPorNombre } = configurar({});
      await caso.comprobarDuplicado('Sentadilla');
      expect(existeEjercicioPorNombre).toHaveBeenCalledWith(
        { tokenPAT: 'token-secreto', repositorio: 'owner/datos-privados' },
        'Sentadilla'
      );
    });
  });

  describe('listarCategoriasComunes', () => {
    it('delega en el puerto', async () => {
      const { caso } = configurar({});
      expect(await caso.listarCategoriasComunes()).toEqual([{ id: 'cat-comun-1', nombre: 'Rodilla' }]);
    });
  });
});
