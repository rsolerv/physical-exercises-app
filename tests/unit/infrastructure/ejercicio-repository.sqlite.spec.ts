import { describe, it, expect, beforeEach, vi } from 'vitest';
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
      series: 3,
      repeticiones: 10,
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
    expect(leido?.series).toBe(3);
    expect(leido?.repeticiones).toBe(10);
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

  it('actualiza y persiste de forma independiente los campos opcionales de pauta', async () => {
    const creado = await repositorio.crear(datos());
    const actualizado = await repositorio.actualizar(creado.id, { series: undefined, repeticiones: 12 });

    expect(actualizado.series).toBeUndefined();
    expect(actualizado.repeticiones).toBe(12);
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

  it('busca texto parcialmente y devuelve resúmenes sin medios, con total filtrado', async () => {
    await repositorio.crear(datos({ nombre: 'Estiramiento de cuádriceps' }));
    await repositorio.crear(datos({ nombre: 'Plancha abdominal' }));
    const ejecutar = vi.spyOn(conexion, 'ejecutar');
    const resultado = await repositorio.buscarPaginado({ texto: 'CUÁDRI', categoriaIds: [], pagina: 0, tamanoPagina: 50 });
    expect(resultado).toEqual({ resultados: [{
      id: expect.any(String), nombre: 'Estiramiento de cuádriceps',
      descripcion: 'Flexionar las rodillas.', categoriaIds: ['cat-rodilla'],
    }], total: 1 });
    expect(ejecutar).toHaveBeenCalledTimes(3);
    expect(ejecutar.mock.calls.map(([sql]) => sql).join(' ')).not.toMatch(/ejercicio_enlace|ejercicio_imagen/);
  });

  it('devuelve 0 y no consulta asociaciones para una página vacía', async () => {
    await repositorio.crear(datos());
    const ejecutar = vi.spyOn(conexion, 'ejecutar');
    expect(await repositorio.buscarPaginado({ texto: 'inexistente', categoriaIds: [], pagina: 0, tamanoPagina: 50 }))
      .toEqual({ resultados: [], total: 0 });
    expect(ejecutar).toHaveBeenCalledTimes(2);
  });

  it('cuenta el catálogo sin hidratar medios en una sola consulta', async () => {
    await repositorio.crear(datos());
    const ejecutar = vi.spyOn(conexion, 'ejecutar');
    expect(await repositorio.contarTodos()).toBe(1);
    expect(ejecutar).toHaveBeenCalledOnce();
    expect(ejecutar.mock.calls[0][0]).toMatch(/COUNT\(\*\)/);
  });

  it('combina texto y varias categorías sin duplicar, recupera todas las categorías del resumen', async () => {
    await conexion.ejecutarSinResultado("INSERT INTO categoria (id, nombre) VALUES ('cat-cadera', 'Cadera')");
    await repositorio.crear(datos({ nombre: 'Ejercicio rodilla', categoriaIds: ['cat-rodilla', 'cat-cadera'] }));
    await repositorio.crear(datos({ nombre: 'Ejercicio cadera', descripcion: 'Movilidad de cadera.', categoriaIds: ['cat-cadera'] }));
    const resultado = await repositorio.buscarPaginado({
      texto: 'rodilla', categoriaIds: ['cat-rodilla', 'cat-cadera'], pagina: 0, tamanoPagina: 50,
    });
    expect(resultado.total).toBe(1);
    expect(resultado.resultados[0].categoriaIds).toEqual(['cat-rodilla', 'cat-cadera']);
  });

  it.each([0, 49, 50, 51, 125])('pagina correctamente %i resultados y desempata por id', async (cantidad) => {
    for (let n = cantidad - 1; n >= 0; n--) {
      await conexion.ejecutarSinResultado(
        'INSERT INTO ejercicio (id, nombre, descripcion) VALUES (?, ?, ?)',
        [`id-${String(n).padStart(3, '0')}`, 'Mismo nombre', 'Descripción']
      );
    }
    const primero = await repositorio.buscarPaginado({ texto: '', categoriaIds: [], pagina: 0, tamanoPagina: 50 });
    expect(primero.total).toBe(cantidad);
    expect(primero.resultados).toHaveLength(Math.min(cantidad, 50));
    expect(primero.resultados.map((e) => e.id)).toEqual(
      Array.from({ length: Math.min(cantidad, 50) }, (_, n) => `id-${String(n).padStart(3, '0')}`)
    );
    const fuera = await repositorio.buscarPaginado({ texto: '', categoriaIds: [], pagina: 3, tamanoPagina: 50 });
    expect(fuera).toEqual({ resultados: [], total: cantidad });
    expect(await repositorio.contarTodos()).toBe(cantidad);
  });

  it('propaga errores SQL y rechaza posiciones inseguras', async () => {
    await expect(repositorio.buscarPaginado({
      texto: '', categoriaIds: [], pagina: Number.MAX_SAFE_INTEGER, tamanoPagina: 50,
    })).rejects.toThrow(ErrorValidacion);
    const fallo = new Error('SQLite no disponible');
    vi.spyOn(conexion, 'ejecutar').mockRejectedValue(fallo);
    await expect(repositorio.buscarPaginado({
      texto: '', categoriaIds: [], pagina: 0, tamanoPagina: 50,
    })).rejects.toBe(fallo);
    await expect(repositorio.contarTodos()).rejects.toBe(fallo);
  });

  it('crea índices de búsqueda idempotentes en bases nuevas y existentes', async () => {
    const indices = await conexion.ejecutar<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_ejercicio_%'"
    );
    expect(indices.map((indice) => indice.name)).toEqual(expect.arrayContaining([
      'idx_ejercicio_nombre_id', 'idx_ejercicio_categoria_categoria_ejercicio',
    ]));
    const motor = await crearMotorSqliteEnMemoria();
    await motor.ejecutarSinResultado(
      'CREATE TABLE ejercicio (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, descripcion TEXT NOT NULL, observaciones TEXT)'
    );
    await motor.aplicarEsquema();
    await motor.aplicarEsquema();
    const migrados = await motor.ejecutar<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_ejercicio_%'"
    );
    expect(migrados.map((indice) => indice.name)).toEqual(expect.arrayContaining([
      'idx_ejercicio_nombre_id', 'idx_ejercicio_categoria_categoria_ejercicio',
    ]));
    await motor.cerrar();
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

  it('migra bases de datos existentes y separa una pauta antigua de observaciones', async () => {
    await conexion.cerrar();
    const motor: MotorSqlite = await crearMotorSqliteEnMemoria();
    await motor.ejecutarSinResultado(
      'CREATE TABLE ejercicio (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, descripcion TEXT NOT NULL, observaciones TEXT)',
    );
    await motor.ejecutarSinResultado(
      "INSERT INTO ejercicio (id, nombre, descripcion, observaciones) " +
        "VALUES ('ej-antiguo', 'Sentadilla', 'Flexionar las rodillas.', '3 series de 10 repeticiones. Mantén la espalda recta.')",
    );
    await motor.aplicarEsquema();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: SqliteConexionService, useValue: motor }] });

    const repositorioMigrado = TestBed.inject(EjercicioRepositorySqlite);
    const ejercicioMigrado = await repositorioMigrado.obtenerPorId('ej-antiguo');
    expect(ejercicioMigrado?.subidoRepositorioComun).toBe(false);
    expect(ejercicioMigrado?.series).toBe(3);
    expect(ejercicioMigrado?.repeticiones).toBe(10);
    expect(ejercicioMigrado?.observaciones).toBe('Mantén la espalda recta');
    await motor.cerrar();
  });
});
