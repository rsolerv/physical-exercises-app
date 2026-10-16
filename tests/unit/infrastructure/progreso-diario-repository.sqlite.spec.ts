import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SqliteConexionService } from '../../../src/app/infrastructure/persistencia-sqlite/sqlite-conexion.service';
import { ProgresoDiarioRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/progreso-diario-repository.sqlite';
import { EjercicioRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/ejercicio-repository.sqlite';
import { CategoriaRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/categoria-repository.sqlite';

describe('ProgresoDiarioRepositorySqlite', () => {
  let conexion: SqliteConexionService;
  let repositorio: ProgresoDiarioRepositorySqlite;
  let ejercicios: EjercicioRepositorySqlite;
  let categorias: CategoriaRepositorySqlite;

  beforeEach(async () => {
    conexion = new SqliteConexionService();
    await conexion.inicializar({ forzarEnMemoria: true });
    TestBed.configureTestingModule({ providers: [{ provide: SqliteConexionService, useValue: conexion }] });
    repositorio = TestBed.inject(ProgresoDiarioRepositorySqlite);
    ejercicios = TestBed.inject(EjercicioRepositorySqlite);
    categorias = TestBed.inject(CategoriaRepositorySqlite);
  });

  async function crearEjercicio(nombre: string) {
    const categoria = await categorias.crear('Cat ' + nombre);
    return ejercicios.crear({ nombre, descripcion: 'desc', categoriaIds: [categoria.id], enlaces: [], imagenes: [] });
  }

  it('marcar() crea el registro de progreso si no existe', async () => {
    const ejercicio = await crearEjercicio('Sentadilla');
    await repositorio.marcar(new Date('2026-10-15T00:00:00'), ejercicio.id, true);

    const registros = await repositorio.obtenerPorFecha(new Date('2026-10-15T00:00:00'));
    expect(registros).toHaveLength(1);
    expect(registros[0].realizado).toBe(true);
  });

  it('marcar() actualiza el registro existente de (fecha, ejercicioId)', async () => {
    const ejercicio = await crearEjercicio('Sentadilla');
    await repositorio.marcar(new Date('2026-10-15T00:00:00'), ejercicio.id, true);
    await repositorio.marcar(new Date('2026-10-15T00:00:00'), ejercicio.id, false);

    const registros = await repositorio.obtenerPorFecha(new Date('2026-10-15T00:00:00'));
    expect(registros).toHaveLength(1);
    expect(registros[0].realizado).toBe(false);
  });

  it('obtenerPorFecha() solo devuelve los registros de esa fecha', async () => {
    const ejercicio = await crearEjercicio('Sentadilla');
    await repositorio.marcar(new Date('2026-10-15T00:00:00'), ejercicio.id, true);
    await repositorio.marcar(new Date('2026-10-16T00:00:00'), ejercicio.id, true);

    const registros = await repositorio.obtenerPorFecha(new Date('2026-10-15T00:00:00'));
    expect(registros).toHaveLength(1);
    expect(registros[0].fecha).toBe('2026-10-15');
  });
});
