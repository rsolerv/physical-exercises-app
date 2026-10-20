import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GestionarEjercicioUseCase } from '../../../src/app/application/casos-uso/gestionar-ejercicio.use-case';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { PlanificacionRepositoryPort } from '../../../src/app/application/ports/planificacion-repository.port';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';
import type { DatosNuevoEjercicio, Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';

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
  let planificacionRepo: PlanificacionRepositoryPort;
  let ajustesRepo: AjustesRepositoryPort;
  let caso: GestionarEjercicioUseCase;

  beforeEach(() => {
    ejercicioRepo = {
      obtenerPorId: vi.fn().mockResolvedValue({ id: 'ej-1', ...datosValidos() }),
      listarTodos: vi.fn(),
      buscarPorTexto: vi.fn(),
      buscarPorCategorias: vi.fn(),
      crear: vi.fn().mockImplementation(async (datos: DatosNuevoEjercicio) => ({ id: 'nuevo-id', ...datos }) as Ejercicio),
      actualizar: vi.fn().mockImplementation(async (id: string, cambios: Partial<DatosNuevoEjercicio>) => ({ id, ...datosValidos(), ...cambios }) as Ejercicio),
      eliminar: vi.fn(),
      restaurar: vi.fn().mockResolvedValue(undefined),
      quitarCategoriaDeTodos: vi.fn(),
    };
    planificacionRepo = {
      obtenerPorId: vi.fn(),
      listarTodas: vi.fn(),
      obtenerActiva: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      duplicar: vi.fn(),
      asignarEjercicioADia: vi.fn().mockResolvedValue(undefined),
      quitarEjercicioDeDia: vi.fn(),
      listarPorEjercicio: vi.fn().mockResolvedValue([]),
      eliminar: vi.fn(),
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
        { provide: EjercicioRepositoryPort, useValue: ejercicioRepo },
        { provide: PlanificacionRepositoryPort, useValue: planificacionRepo },
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

  it('captura datos y días planificados antes de eliminar para poder restaurarlos', async () => {
    const ejercicio: Ejercicio = { id: 'ej-1', ...datosValidos() };
    const planificacion: Planificacion = {
      id: 'plan-1',
      nombre: 'Semana',
      dias: [
        { diaSemana: 'lunes', ejercicioIds: ['ej-1'] },
        { diaSemana: 'martes', ejercicioIds: [] },
        { diaSemana: 'miercoles', ejercicioIds: [] },
        { diaSemana: 'jueves', ejercicioIds: [] },
        { diaSemana: 'viernes', ejercicioIds: [] },
        { diaSemana: 'sabado', ejercicioIds: [] },
        { diaSemana: 'domingo', ejercicioIds: [] },
      ],
    };
    (ejercicioRepo.obtenerPorId as ReturnType<typeof vi.fn>).mockResolvedValue(ejercicio);
    (planificacionRepo.listarPorEjercicio as ReturnType<typeof vi.fn>).mockResolvedValue([planificacion]);

    const snapshot = await caso.eliminar('ej-1');

    expect(snapshot).toEqual({
      ejercicio,
      asignaciones: [{ planificacionId: 'plan-1', dia: 'lunes' }],
    });
  });

  it('restaura el ejercicio y sus asociaciones originales con categorías y planificaciones', async () => {
    const ejercicio: Ejercicio = { id: 'ej-1', ...datosValidos() };
    const snapshot = {
      ejercicio,
      asignaciones: [{ planificacionId: 'plan-1', dia: 'lunes' as const }],
    };

    await caso.restaurarEliminacion(snapshot);

    expect(ejercicioRepo.restaurar).toHaveBeenCalledWith(ejercicio);
    expect(planificacionRepo.asignarEjercicioADia).toHaveBeenCalledWith('plan-1', 'lunes', 'ej-1');
    expect(ajustesRepo.marcarCambiosLocalesPendientes).toHaveBeenCalledWith(true);
  });

  it('propaga errores al restaurar un ejercicio o sus asignaciones', async () => {
    (ejercicioRepo.restaurar as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fallo de restauración'));

    await expect(
      caso.restaurarEliminacion({
        ejercicio: { id: 'ej-1', ...datosValidos() },
        asignaciones: [],
      })
    ).rejects.toThrow('fallo de restauración');
  });
});
