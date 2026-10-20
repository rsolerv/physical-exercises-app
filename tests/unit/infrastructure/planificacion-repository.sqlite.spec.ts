import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SqliteConexionService } from '../../../src/app/infrastructure/persistencia-sqlite/sqlite-conexion.service';
import { PlanificacionRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/planificacion-repository.sqlite';
import { EjercicioRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/ejercicio-repository.sqlite';
import { CategoriaRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/categoria-repository.sqlite';
import {
  ErrorEjercicioDuplicadoEnDia,
  ErrorPlanificacionActivaDuplicada,
  ErrorValidacion,
} from '../../../src/app/domain/errores/errores-dominio';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';

describe('PlanificacionRepositorySqlite', () => {
  let conexion: SqliteConexionService;
  let repositorio: PlanificacionRepositorySqlite;
  let ejercicios: EjercicioRepositorySqlite;
  let categorias: CategoriaRepositorySqlite;

  beforeEach(async () => {
    conexion = new SqliteConexionService();
    await conexion.inicializar({ forzarEnMemoria: true });
    TestBed.configureTestingModule({ providers: [{ provide: SqliteConexionService, useValue: conexion }] });
    repositorio = TestBed.inject(PlanificacionRepositorySqlite);
    ejercicios = TestBed.inject(EjercicioRepositorySqlite);
    categorias = TestBed.inject(CategoriaRepositorySqlite);
  });

  async function crearEjercicio(nombre: string) {
    const categoria = await categorias.crear('Cat ' + nombre);
    return ejercicios.crear({
      nombre,
      descripcion: 'desc',
      categoriaIds: [categoria.id],
      enlaces: [],
      imagenes: [],
    });
  }

  it('crea una planificación concreta y la recupera por id', async () => {
    const creada = await repositorio.crear({ nombre: 'Semana 1', fechaInicio: '2026-10-12', dias: crearDiasVacios() });
    const leida = await repositorio.obtenerPorId(creada.id);
    expect(leida?.nombre).toBe('Semana 1');
    expect(leida?.fechaInicio).toBe('2026-10-12');
    expect(leida?.dias).toHaveLength(7);
  });

  it('crea una plantilla sin fechaInicio', async () => {
    const creada = await repositorio.crear({ nombre: 'Plantilla', dias: crearDiasVacios() });
    expect(creada.fechaInicio).toBeUndefined();
  });

  it('rechaza una fechaInicio que no es lunes (FR-017)', async () => {
    await expect(
      repositorio.crear({ nombre: 'Semana', fechaInicio: '2026-10-13', dias: crearDiasVacios() })
    ).rejects.toThrow(ErrorValidacion);
  });

  it('rechaza una fechaInicio duplicada con ErrorPlanificacionActivaDuplicada (FR-022)', async () => {
    await repositorio.crear({ nombre: 'Semana 1', fechaInicio: '2026-10-12', dias: crearDiasVacios() });
    await expect(
      repositorio.crear({ nombre: 'Semana 2', fechaInicio: '2026-10-12', dias: crearDiasVacios() })
    ).rejects.toThrow(ErrorPlanificacionActivaDuplicada);
  });

  it('asignarEjercicioADia() añade el ejercicio al día indicado', async () => {
    const planificacion = await repositorio.crear({ nombre: 'Semana', dias: crearDiasVacios() });
    const ejercicio = await crearEjercicio('Sentadilla');

    await repositorio.asignarEjercicioADia(planificacion.id, 'lunes', ejercicio.id);

    const leida = await repositorio.obtenerPorId(planificacion.id);
    const lunes = leida?.dias.find((d) => d.diaSemana === 'lunes');
    expect(lunes?.ejercicioIds).toEqual([ejercicio.id]);
  });

  it('asignarEjercicioADia() lanza ErrorEjercicioDuplicadoEnDia si ya está asignado (FR-021)', async () => {
    const planificacion = await repositorio.crear({ nombre: 'Semana', dias: crearDiasVacios() });
    const ejercicio = await crearEjercicio('Sentadilla');
    await repositorio.asignarEjercicioADia(planificacion.id, 'lunes', ejercicio.id);

    await expect(repositorio.asignarEjercicioADia(planificacion.id, 'lunes', ejercicio.id)).rejects.toThrow(
      ErrorEjercicioDuplicadoEnDia
    );
  });

  it('quitarEjercicioDeDia() retira el ejercicio del día', async () => {
    const planificacion = await repositorio.crear({ nombre: 'Semana', dias: crearDiasVacios() });
    const ejercicio = await crearEjercicio('Sentadilla');
    await repositorio.asignarEjercicioADia(planificacion.id, 'lunes', ejercicio.id);

    await repositorio.quitarEjercicioDeDia(planificacion.id, 'lunes', ejercicio.id);

    const leida = await repositorio.obtenerPorId(planificacion.id);
    expect(leida?.dias.find((d) => d.diaSemana === 'lunes')?.ejercicioIds).toEqual([]);
  });

  it('obtenerActiva() devuelve la planificación concreta de la semana de la fecha dada', async () => {
    await repositorio.crear({ nombre: 'Semana activa', fechaInicio: '2026-10-12', dias: crearDiasVacios() });
    await repositorio.crear({ nombre: 'Plantilla', dias: crearDiasVacios() });

    const activa = await repositorio.obtenerActiva(new Date('2026-10-15T10:00:00'));
    expect(activa?.nombre).toBe('Semana activa');
  });

  it('obtenerActiva() devuelve null cuando no hay planificación para esa semana (CL2)', async () => {
    const activa = await repositorio.obtenerActiva(new Date('2026-10-15T10:00:00'));
    expect(activa).toBeNull();
  });

  it('duplicar() crea una copia independiente sin fechaInicio', async () => {
    const original = await repositorio.crear({ nombre: 'Original', fechaInicio: '2026-10-12', dias: crearDiasVacios() });
    const ejercicio = await crearEjercicio('Sentadilla');
    await repositorio.asignarEjercicioADia(original.id, 'lunes', ejercicio.id);

    const copia = await repositorio.duplicar(original.id, 'Copia');

    expect(copia.id).not.toBe(original.id);
    expect(copia.fechaInicio).toBeUndefined();
    expect(copia.dias.find((d) => d.diaSemana === 'lunes')?.ejercicioIds).toEqual([ejercicio.id]);
  });

  it('listarPorEjercicio() devuelve todas las planificaciones que incluyen un ejercicio (FR-028)', async () => {
    const ejercicio = await crearEjercicio('Sentadilla');
    const plan1 = await repositorio.crear({ nombre: 'Semana 1', fechaInicio: '2026-10-12', dias: crearDiasVacios() });
    const plan2 = await repositorio.crear({ nombre: 'Semana 2', fechaInicio: '2026-10-19', dias: crearDiasVacios() });
    await repositorio.asignarEjercicioADia(plan1.id, 'lunes', ejercicio.id);
    await repositorio.asignarEjercicioADia(plan2.id, 'martes', ejercicio.id);

    const planificaciones = await repositorio.listarPorEjercicio(ejercicio.id);
    expect(planificaciones.map((p) => p.id).sort()).toEqual([plan1.id, plan2.id].sort());
  });

  it('al eliminar un ejercicio, desaparece de todos los días de todas las planificaciones (FR-028, CA13)', async () => {
    const ejercicio = await crearEjercicio('Sentadilla');
    const plan = await repositorio.crear({ nombre: 'Semana', fechaInicio: '2026-10-12', dias: crearDiasVacios() });
    await repositorio.asignarEjercicioADia(plan.id, 'lunes', ejercicio.id);

    await ejercicios.eliminar(ejercicio.id);

    const leida = await repositorio.obtenerPorId(plan.id);
    expect(leida?.dias.find((d) => d.diaSemana === 'lunes')?.ejercicioIds).toEqual([]);
  });

  it('restaura la relación del ejercicio con cada día planificado después de reponer el ejercicio', async () => {
    const ejercicio = await crearEjercicio('Sentadilla');
    const plan = await repositorio.crear({ nombre: 'Semana', fechaInicio: '2026-10-12', dias: crearDiasVacios() });
    await repositorio.asignarEjercicioADia(plan.id, 'lunes', ejercicio.id);
    await ejercicios.eliminar(ejercicio.id);
    await ejercicios.restaurar(ejercicio);

    await repositorio.asignarEjercicioADia(plan.id, 'lunes', ejercicio.id);

    const leida = await repositorio.obtenerPorId(plan.id);
    expect(leida?.dias.find((d) => d.diaSemana === 'lunes')?.ejercicioIds).toEqual([ejercicio.id]);
  });

  it('listarTodas() devuelve todas las planificaciones', async () => {
    await repositorio.crear({ nombre: 'Semana 1', fechaInicio: '2026-10-12', dias: crearDiasVacios() });
    await repositorio.crear({ nombre: 'Plantilla', dias: crearDiasVacios() });

    const todas = await repositorio.listarTodas();
    expect(todas).toHaveLength(2);
  });

  it('eliminar() borra la planificación y sus días en cascada', async () => {
    const plan = await repositorio.crear({ nombre: 'Semana', fechaInicio: '2026-10-12', dias: crearDiasVacios() });

    await repositorio.eliminar(plan.id);

    expect(await repositorio.obtenerPorId(plan.id)).toBeNull();
  });
});
