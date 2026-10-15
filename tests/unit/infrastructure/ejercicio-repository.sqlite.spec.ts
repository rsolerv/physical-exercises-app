import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SqliteConexionService } from '../../../src/app/infrastructure/persistencia-sqlite/sqlite-conexion.service';
import { EjercicioRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/ejercicio-repository.sqlite';
import { ErrorValidacion, ErrorNoEncontrado } from '../../../src/app/domain/errores/errores-dominio';
import type { DatosNuevoEjercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

describe('EjercicioRepositorySqlite', () => {
  let conexion: SqliteConexionService;
  let repositorio: EjercicioRepositorySqlite;

  beforeEach(async () => {
    conexion = new SqliteConexionService();
    await conexion.inicializar({ forzarEnMemoria: true });
    await conexion.ejecutarSinResultado("INSERT INTO categoria (id, nombre, es_generica) VALUES ('cat-rodilla', 'Rodilla', 0)");
    await conexion.ejecutarSinResultado("INSERT INTO categoria (id, nombre, es_generica) VALUES ('cat-generica', 'Sin categoría', 1)");

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
    await conexion.ejecutarSinResultado("INSERT INTO categoria (id, nombre, es_generica) VALUES ('cat-cadera', 'Cadera', 0)");

    await repositorio.crear(datos({ nombre: 'Ejercicio rodilla', categoriaIds: ['cat-rodilla'] }));
    await repositorio.crear(datos({ nombre: 'Ejercicio cadera', categoriaIds: ['cat-cadera'] }));

    const resultado = await repositorio.buscarPorCategorias(['cat-cadera']);
    expect(resultado.map((e) => e.nombre)).toEqual(['Ejercicio cadera']);
  });

  it('quitarCategoriaDeTodos retira la categoría y asigna la genérica si no queda ninguna (FR-011)', async () => {
    await conexion.ejecutarSinResultado("INSERT INTO categoria (id, nombre, es_generica) VALUES ('cat-cadera', 'Cadera', 0)");

    const conDosCategorias = await repositorio.crear(datos({ categoriaIds: ['cat-rodilla', 'cat-cadera'] }));
    const conUnaCategoria = await repositorio.crear(datos({ nombre: 'Otro', categoriaIds: ['cat-rodilla'] }));

    await repositorio.quitarCategoriaDeTodos('cat-rodilla', 'cat-generica');

    const ej1 = await repositorio.obtenerPorId(conDosCategorias.id);
    const ej2 = await repositorio.obtenerPorId(conUnaCategoria.id);
    expect(ej1?.categoriaIds).toEqual(['cat-cadera']);
    expect(ej2?.categoriaIds).toEqual(['cat-generica']);
  });
});
