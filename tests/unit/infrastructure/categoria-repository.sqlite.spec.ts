import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SqliteConexionService } from '../../../src/app/infrastructure/persistencia-sqlite/sqlite-conexion.service';
import { CategoriaRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/categoria-repository.sqlite';
import { ErrorNombreDuplicado, ErrorOperacionNoPermitida, ErrorNoEncontrado } from '../../../src/app/domain/errores/errores-dominio';

describe('CategoriaRepositorySqlite', () => {
  let conexion: SqliteConexionService;
  let repositorio: CategoriaRepositorySqlite;

  beforeEach(async () => {
    conexion = new SqliteConexionService();
    await conexion.inicializar({ forzarEnMemoria: true });
    TestBed.configureTestingModule({ providers: [{ provide: SqliteConexionService, useValue: conexion }] });
    repositorio = TestBed.inject(CategoriaRepositorySqlite);
  });

  it('crea una categoría y la recupera por id', async () => {
    const creada = await repositorio.crear('Rodilla', 'Fortalecimiento de rodilla');
    expect(creada.id).toBeTruthy();
    expect(creada.esGenerica).toBe(false);

    const leida = await repositorio.obtenerPorId(creada.id);
    expect(leida?.nombre).toBe('Rodilla');
    expect(leida?.descripcion).toBe('Fortalecimiento de rodilla');
  });

  it('rechaza crear una categoría con un nombre ya existente (FR-010)', async () => {
    await repositorio.crear('Rodilla');
    await expect(repositorio.crear('Rodilla')).rejects.toThrow(ErrorNombreDuplicado);
  });

  it('listarTodas() devuelve las categorías en orden alfabético', async () => {
    await repositorio.crear('Rodilla');
    await repositorio.crear('Abdomen');
    await repositorio.crear('Cadera');

    const todas = await repositorio.listarTodas();
    expect(todas.map((c) => c.nombre)).toEqual(['Abdomen', 'Cadera', 'Rodilla']);
  });

  it('obtenerGenerica() devuelve la categoría de fábrica "Sin categoría"', async () => {
    await conexion.ejecutarSinResultado("INSERT INTO categoria (id, nombre, es_generica) VALUES ('cat-generica', 'Sin categoría', 1)");
    const generica = await repositorio.obtenerGenerica();
    expect(generica.id).toBe('cat-generica');
    expect(generica.esGenerica).toBe(true);
  });

  it('crearGenerica() crea la categoría de fábrica "Sin categoría" con esGenerica = true', async () => {
    const creada = await repositorio.crearGenerica('Sin categoría');
    expect(creada.esGenerica).toBe(true);
    expect(creada.nombre).toBe('Sin categoría');

    const generica = await repositorio.obtenerGenerica();
    expect(generica.id).toBe(creada.id);
  });

  it('actualiza el nombre y la descripción de una categoría', async () => {
    const creada = await repositorio.crear('Rodilla');
    const actualizada = await repositorio.actualizar(creada.id, { nombre: 'Rodillas', descripcion: 'Nueva desc' });
    expect(actualizada.nombre).toBe('Rodillas');
    expect(actualizada.descripcion).toBe('Nueva desc');
  });

  it('actualizar lanza ErrorNoEncontrado si el id no existe', async () => {
    await expect(repositorio.actualizar('no-existe', { nombre: 'X' })).rejects.toThrow(ErrorNoEncontrado);
  });

  it('actualizar rechaza un nombre que colisiona con otra categoría existente', async () => {
    await repositorio.crear('Rodilla');
    const otra = await repositorio.crear('Cadera');
    await expect(repositorio.actualizar(otra.id, { nombre: 'Rodilla' })).rejects.toThrow(ErrorNombreDuplicado);
  });

  it('impide renombrar la categoría genérica (FR-011)', async () => {
    await conexion.ejecutarSinResultado("INSERT INTO categoria (id, nombre, es_generica) VALUES ('cat-generica', 'Sin categoría', 1)");
    await expect(repositorio.actualizar('cat-generica', { nombre: 'Otro nombre' })).rejects.toThrow(ErrorOperacionNoPermitida);
  });

  it('elimina una categoría (incluso con ejercicios asociados, FR-011)', async () => {
    const creada = await repositorio.crear('Rodilla');
    await repositorio.eliminar(creada.id);
    expect(await repositorio.obtenerPorId(creada.id)).toBeNull();
  });

  it('impide eliminar la categoría genérica (FR-011)', async () => {
    await conexion.ejecutarSinResultado("INSERT INTO categoria (id, nombre, es_generica) VALUES ('cat-generica', 'Sin categoría', 1)");
    await expect(repositorio.eliminar('cat-generica')).rejects.toThrow(ErrorOperacionNoPermitida);
  });
});
