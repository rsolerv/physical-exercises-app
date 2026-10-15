import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GestionarEjercicioUseCase } from '../../../src/app/application/casos-uso/gestionar-ejercicio.use-case';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';
import type { DatosNuevoEjercicio, Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

function datosValidos(): DatosNuevoEjercicio {
  return {
    nombre: 'Sentadilla',
    descripcion: 'desc',
    categoriaIds: ['cat-1'],
    enlaces: [],
    imagenes: [],
  };
}

describe('GestionarEjercicioUseCase', () => {
  let ejercicioRepo: EjercicioRepositoryPort;
  let ajustesRepo: AjustesRepositoryPort;
  let caso: GestionarEjercicioUseCase;

  beforeEach(() => {
    ejercicioRepo = {
      obtenerPorId: vi.fn(),
      listarTodos: vi.fn(),
      buscarPorTexto: vi.fn(),
      buscarPorCategorias: vi.fn(),
      crear: vi.fn().mockImplementation(async (datos: DatosNuevoEjercicio) => ({ id: 'nuevo-id', ...datos }) as Ejercicio),
      actualizar: vi.fn().mockImplementation(async (id: string, cambios: Partial<DatosNuevoEjercicio>) => ({ id, ...datosValidos(), ...cambios }) as Ejercicio),
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
        { provide: EjercicioRepositoryPort, useValue: ejercicioRepo },
        { provide: AjustesRepositoryPort, useValue: ajustesRepo },
      ],
    });
    caso = TestBed.inject(GestionarEjercicioUseCase);
  });

  it('crea un ejercicio válido y marca cambios locales pendientes', async () => {
    const creado = await caso.crear(datosValidos());
    expect(creado.id).toBe('nuevo-id');
    expect(ejercicioRepo.crear).toHaveBeenCalledWith(datosValidos());
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledWith(true);
  });

  it('valida con el dominio antes de guardar: rechaza un ejercicio sin nombre sin llegar al repositorio', async () => {
    await expect(caso.crear({ ...datosValidos(), nombre: '' })).rejects.toThrow(ErrorValidacion);
    expect(ejercicioRepo.crear).not.toHaveBeenCalled();
  });

  it('actualiza un ejercicio y marca cambios locales pendientes', async () => {
    await caso.actualizar('ej-1', { nombre: 'Nuevo nombre' });
    expect(ejercicioRepo.actualizar).toHaveBeenCalledWith('ej-1', { nombre: 'Nuevo nombre' });
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledWith(true);
  });

  it('elimina un ejercicio y marca cambios locales pendientes', async () => {
    await caso.eliminar('ej-1');
    expect(ejercicioRepo.eliminar).toHaveBeenCalledWith('ej-1');
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledWith(true);
  });
});
