import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SqliteConexionService } from '../../../src/app/infrastructure/persistencia-sqlite/sqlite-conexion.service';
import { EjercicioRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/ejercicio-repository.sqlite';
import { MotorSqlite, crearMotorSqliteEnMemoria } from '../../../src/app/infrastructure/persistencia-sqlite/motor-sqlite';
import { ErrorValidacion, ErrorNoEncontrado } from '../../../src/app/domain/errores/errores-dominio';
import type { DatosNuevoEjercicio, Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

describe('EjercicioRepositorySqlite', () => {
  let conexion: SqliteConexionService;
  let repositorio: EjercicioRepositorySqlite;

  beforeEach(async () => {
    conexion = new SqliteConexionService();
    await conexion.inicializar({ forzarEnMemoria: true });
    await conexion.ejecutarSinResultado("INSERT INTO categoria (id, nombre) VALUES ('cat-rodilla', 'Rodilla')");

    TestBed.configureTestingModule({ providers: [{ provide: SqliteConexionService, useValue: conexion }] });
    repositorio = TestBed.inject(EjercicioRepositorySqlite);
  });

  function datos(sobrescribir: Partial<DatosNuevoEjercicio> = {}): DatosNuevoEjercicio {
    return {
      nombre: 'Sentadilla',
      descripcion: 'Flexionar las rodillas.',
      categoriaIds: ['cat-rodilla'],
      enlaces: [{ tipo: 'youtube', url: 'https://www.youtube.com/watch?v=abc123' }],
      imagenes: [{ id: 'img-1', tipo: 'url', valorUrl: 'https://example.com/foto.jpg' }],
      observaciones: 'Hacerlo despacio.',
      ...sobrescribir,
    };
  }

  it('crea un ejercicio con enlaces e imágenes y lo recupera por id', async () => {
    const creado = await repositorio.crear(datos());
    expect(creado.id).toBeTruthy();

    const leido = await repositorio.obtenerPorId(creado.id);
    expect(leido?.nombre).toBe('Sentadilla');
    expect(leido?.categoriaIds).toEqual(['cat-rodilla']);
    expect(leido?.enlaces).toEqual([{ tipo: 'youtube', url: 'https://www.youtube.com/watch?v=abc123' }]);
    expect(leido?.imagenes).toEqual([{ id: 'img-1', tipo: 'url', valorUrl: 'https://example.com/foto.jpg' }]);
    expect(leido?.observaciones).toBe('Hacerlo despacio.');
  });

  it('crea un ejercicio con una imagen de archivo (contenido en base64)', async () => {
    const creado = await repositorio.crear(
      datos({
        imagenes: [
          { id: 'img-1', tipo: 'archivo', contenidoBase64: 'QQ==', tipoMime: 'image/png', nombreArchivo: 'a.png' },
        ],
      })
    );
    const leido = await repositorio.obtenerPorId(creado.id);
    expect(leido?.imagenes).toEqual([
      { id: 'img-1', tipo: 'archivo', contenidoBase64: 'QQ==', tipoMime: 'image/png', nombreArchivo: 'a.png' },
    ]);
  });

  it('rechaza crear un ejercicio con datos no válidos (delega en validarEjercicio)', async () => {
    await expect(repositorio.crear(datos({ nombre: '' }))).rejects.toThrow(ErrorValidacion);
  });

  it('obtenerPorId devuelve null si no existe', async () => {
    expect(await repositorio.obtenerPorId('no-existe')).toBeNull();
  });

  it('listarTodos devuelve los ejercicios ordenados por nombre', async () => {
    await repositorio.crear(datos({ nombre: 'Zancada' }));
    await repositorio.crear(datos({ nombre: 'Abdominales' }));

    const todos = await repositorio.listarTodos();
    expect(todos.map((e) => e.nombre)).toEqual(['Abdominales', 'Zancada']);
  });

  it('actualiza un ejercicio existente (reemplaza enlaces e imágenes)', async () => {
    const creado = await repositorio.crear(datos());
    const actualizado = await repositorio.actualizar(creado.id, {
      nombre: 'Sentadilla profunda',
      enlaces: [{ tipo: 'web', url: 'https://example.com/guia' }],
    });

    expect(actualizado.nombre).toBe('Sentadilla profunda');
    expect(actualizado.enlaces).toEqual([{ tipo: 'web', url: 'https://example.com/guia' }]);
    // El resto de campos no modificados se conserva.
    expect(actualizado.descripcion).toBe('Flexionar las rodillas.');
  });

  it('actualizar lanza ErrorNoEncontrado si el id no existe', async () => {
    await expect(repositorio.actualizar('no-existe', { nombre: 'X' })).rejects.toThrow(ErrorNoEncontrado);
  });

  it('elimina un ejercicio', async () => {
    const creado = await repositorio.crear(datos());
    await repositorio.eliminar(creado.id);
    expect(await repositorio.obtenerPorId(creado.id)).toBeNull();
  });

  it('restaura un ejercicio con su identificador, datos, categorías y marca de subida originales', async () => {
    const original: Ejercicio = {
      id: 'ejercicio-restaurado',
      ...datos({
        imagenes: [
          { id: 'img-archivo', tipo: 'archivo', contenidoBase64: 'QQ==', tipoMime: 'image/png', nombreArchivo: 'a.png' },
        ],
      }),
      subidoRepositorioComun: true,
    };
    await repositorio.eliminar(original.id);

    await repositorio.restaurar(original);

    expect(await repositorio.obtenerPorId(original.id)).toEqual(original);
  });

  it('buscarPorTexto encuentra coincidencias parciales sin distinguir mayúsculas (FR-013)', async () => {
    await repositorio.crear(datos({ nombre: 'Estiramiento de cuádriceps' }));
    await repositorio.crear(datos({ nombre: 'Plancha abdominal' }));

    const resultado = await repositorio.buscarPorTexto('CUÁDRI');
    expect(resultado.map((e) => e.nombre)).toEqual(['Estiramiento de cuádriceps']);
  });

  it('buscarPorTexto devuelve una lista vacía sin error si no hay coincidencias (CL3)', async () => {
    await repositorio.crear(datos());
    expect(await repositorio.buscarPorTexto('no-existe-ningun-ejercicio-asi')).toEqual([]);
  });

  it('buscarPorCategorias devuelve los ejercicios de una o varias categorías (FR-012)', async () => {
    await conexion.ejecutarSinResultado("INSERT INTO categoria (id, nombre) VALUES ('cat-cadera', 'Cadera')");

    await repositorio.crear(datos({ nombre: 'Ejercicio rodilla', categoriaIds: ['cat-rodilla'] }));
    await repositorio.crear(datos({ nombre: 'Ejercicio cadera', categoriaIds: ['cat-cadera'] }));

    const resultado = await repositorio.buscarPorCategorias(['cat-cadera']);
    expect(resultado.map((e) => e.nombre)).toEqual(['Ejercicio cadera']);
  });

  it('quitarCategoriaDeTodos retira la categoría de los ejercicios asociados (FR-011)', async () => {
    await conexion.ejecutarSinResultado("INSERT INTO categoria (id, nombre) VALUES ('cat-cadera', 'Cadera')");

    const conDosCategorias = await repositorio.crear(datos({ categoriaIds: ['cat-rodilla', 'cat-cadera'] }));

    await repositorio.quitarCategoriaDeTodos('cat-rodilla');

    const ej1 = await repositorio.obtenerPorId(conDosCategorias.id);
    expect(ej1?.categoriaIds).toEqual(['cat-cadera']);
  });

  it('un ejercicio nuevo tiene subidoRepositorioComun a false por defecto (data-model.md § Ejercicio)', async () => {
    const creado = await repositorio.crear(datos());
    expect(creado.subidoRepositorioComun).toBe(false);
    expect((await repositorio.obtenerPorId(creado.id))?.subidoRepositorioComun).toBe(false);
  });

  it('marcarSubidoRepositorioComun pone subidoRepositorioComun a true de forma persistente (FR-021)', async () => {
    const creado = await repositorio.crear(datos());
    await repositorio.marcarSubidoRepositorioComun(creado.id);
    expect((await repositorio.obtenerPorId(creado.id))?.subidoRepositorioComun).toBe(true);
  });

  it('marcarSubidoRepositorioComun no modifica ningún otro campo del ejercicio', async () => {
    const creado = await repositorio.crear(datos());
    await repositorio.marcarSubidoRepositorioComun(creado.id);
    const actualizado = await repositorio.obtenerPorId(creado.id);
    expect(actualizado).toEqual({ ...creado, subidoRepositorioComun: true });
  });

  it('quitarMarcaSubidoRepositorioComun restablece la marca de forma persistente', async () => {
    const creado = await repositorio.crear(datos());
    await repositorio.marcarSubidoRepositorioComun(creado.id);
    await repositorio.quitarMarcaSubidoRepositorioComun(creado.id);
    expect((await repositorio.obtenerPorId(creado.id))?.subidoRepositorioComun).toBe(false);
  });

  it('migra bases de datos existentes añadiendo la columna subido_repositorio_comun con valor 0 (ALTER TABLE)', async () => {
    await conexion.cerrar();
    const motor: MotorSqlite = await crearMotorSqliteEnMemoria();
    await motor.ejecutarSinResultado(
      'CREATE TABLE ejercicio (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, descripcion TEXT NOT NULL, observaciones TEXT)',
    );
    await motor.ejecutarSinResultado(
      "INSERT INTO ejercicio (id, nombre, descripcion) VALUES ('ej-antiguo', 'Sentadilla', 'Flexionar las rodillas.')",
    );
    await motor.aplicarEsquema();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: SqliteConexionService, useValue: motor }] });

    const repositorioMigrado = TestBed.inject(EjercicioRepositorySqlite);
    const ejercicioMigrado = await repositorioMigrado.obtenerPorId('ej-antiguo');
    expect(ejercicioMigrado?.subidoRepositorioComun).toBe(false);
    await motor.cerrar();
  });
});
