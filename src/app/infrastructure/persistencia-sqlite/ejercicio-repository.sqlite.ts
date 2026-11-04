import { Injectable, inject } from '@angular/core';
import type {
  DatosNuevoEjercicio,
  Ejercicio,
  EnlaceEjercicio,
  ImagenEjercicio,
} from '../../domain/ejercicio/ejercicio.entity';
import { validarEjercicio } from '../../domain/ejercicio/validar-ejercicio';
import { EjercicioRepositoryPort } from '../../application/ports/ejercicio-repository.port';
import type { CriteriosBusquedaEjercicios, PaginaEjercicios } from '../../application/models/busqueda-ejercicios';
import { ErrorNoEncontrado, ErrorValidacion } from '../../domain/errores/errores-dominio';
import { SqliteConexionService } from './sqlite-conexion.service';

interface FilaEjercicio {
  id: string;
  nombre: string;
  descripcion: string;
  series: number | null;
  repeticiones: number | null;
  observaciones: string | null;
  subido_repositorio_comun: number;
}

/** Adaptador SQLite del puerto `EjercicioRepositoryPort` (contracts/ejercicio-repository.port.md). */
@Injectable({ providedIn: 'root' })
export class EjercicioRepositorySqlite implements EjercicioRepositoryPort {
  private readonly conexion = inject(SqliteConexionService);

  async obtenerPorId(id: string): Promise<Ejercicio | null> {
    const filas = await this.conexion.ejecutar<FilaEjercicio>('SELECT * FROM ejercicio WHERE id = ?', [id]);
    if (filas.length === 0) return null;
    return this.hidratar(filas[0]);
  }

  async listarTodos(): Promise<Ejercicio[]> {
    const filas = await this.conexion.ejecutar<FilaEjercicio>('SELECT * FROM ejercicio ORDER BY nombre');
    return Promise.all(filas.map((fila) => this.hidratar(fila)));
  }

  async contarTodos(): Promise<number> {
    const filas = await this.conexion.ejecutar<{ total: number }>('SELECT COUNT(*) AS total FROM ejercicio');
    return filas[0].total;
  }

  async buscarPaginado(criterios: CriteriosBusquedaEjercicios): Promise<PaginaEjercicios> {
    const { texto, categoriaIds, pagina, tamanoPagina } = criterios;
    if (!Number.isSafeInteger(pagina) || pagina < 0 ||
      !Number.isSafeInteger(tamanoPagina) || tamanoPagina < 1 || tamanoPagina > 100 ||
      !Number.isSafeInteger(pagina * tamanoPagina)) {
      throw new ErrorValidacion('La página o el tamaño de página no son válidos.');
    }
    const condiciones: string[] = [];
    const parametros: (string | number)[] = [];
    if (texto) {
      condiciones.push('(LOWER(e.nombre) LIKE ? OR LOWER(e.descripcion) LIKE ?)');
      const patron = `%${texto.toLowerCase()}%`;
      parametros.push(patron, patron);
    }
    if (categoriaIds.length) {
      condiciones.push(
        `EXISTS (SELECT 1 FROM ejercicio_categoria ec WHERE ec.ejercicio_id = e.id ` +
        `AND ec.categoria_id IN (${categoriaIds.map(() => '?').join(', ')}))`
      );
      parametros.push(...categoriaIds);
    }
    const filtro = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
    const [conteo] = await this.conexion.ejecutar<{ total: number }>(
      `SELECT COUNT(*) AS total FROM ejercicio e${filtro}`, parametros
    );
    const filas = await this.conexion.ejecutar<Pick<FilaEjercicio, 'id' | 'nombre' | 'descripcion'>>(
      `SELECT e.id, e.nombre, e.descripcion FROM ejercicio e${filtro} ` +
      'ORDER BY e.nombre, e.id LIMIT ? OFFSET ?',
      [...parametros, tamanoPagina, pagina * tamanoPagina]
    );
    const categorias = filas.length ? await this.conexion.ejecutar<{
      ejercicio_id: string; categoria_id: string;
    }>(
      `SELECT ejercicio_id, categoria_id FROM ejercicio_categoria ` +
      `WHERE ejercicio_id IN (${filas.map(() => '?').join(', ')}) ORDER BY ejercicio_id, rowid`,
      filas.map((fila) => fila.id)
    ) : [];
    const categoriasPorEjercicio = new Map<string, string[]>();
    for (const categoria of categorias) {
      const ids = categoriasPorEjercicio.get(categoria.ejercicio_id) ?? [];
      ids.push(categoria.categoria_id);
      categoriasPorEjercicio.set(categoria.ejercicio_id, ids);
    }
    return {
      resultados: filas.map((fila) => ({
        ...fila, categoriaIds: categoriasPorEjercicio.get(fila.id) ?? [],
      })),
      total: conteo.total,
    };
  }

  async crear(datos: DatosNuevoEjercicio): Promise<Ejercicio> {
    validarEjercicio(datos);
    const id = crypto.randomUUID();
    await this.guardarEjercicio(id, datos);
    return { id, ...datos, subidoRepositorioComun: false };
  }

  async restaurar(ejercicio: Ejercicio): Promise<void> {
    const { id, subidoRepositorioComun, ...datos } = ejercicio;
    validarEjercicio(datos);
    await this.guardarEjercicio(id, datos, subidoRepositorioComun);
  }

  private async guardarEjercicio(id: string, datos: DatosNuevoEjercicio, subidoRepositorioComun = false): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'INSERT INTO ejercicio (id, nombre, descripcion, series, repeticiones, observaciones, subido_repositorio_comun) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        datos.nombre,
        datos.descripcion,
        datos.series ?? null,
        datos.repeticiones ?? null,
        datos.observaciones ?? null,
        subidoRepositorioComun ? 1 : 0,
      ]
    );
    await this.guardarRelaciones(id, datos);
  }

  async actualizar(id: string, cambios: Partial<DatosNuevoEjercicio>): Promise<Ejercicio> {
    const actual = await this.obtenerPorId(id);
    if (!actual) throw new ErrorNoEncontrado(`No existe el ejercicio "${id}".`);

    const fusionado: DatosNuevoEjercicio = {
      nombre: cambios.nombre ?? actual.nombre,
      descripcion: cambios.descripcion ?? actual.descripcion,
      categoriaIds: cambios.categoriaIds ?? actual.categoriaIds,
      enlaces: cambios.enlaces ?? actual.enlaces,
      imagenes: cambios.imagenes ?? actual.imagenes,
      series: 'series' in cambios ? cambios.series : actual.series,
      repeticiones: 'repeticiones' in cambios ? cambios.repeticiones : actual.repeticiones,
      observaciones: cambios.observaciones ?? actual.observaciones,
    };
    validarEjercicio(fusionado);

    await this.conexion.ejecutarSinResultado(
      'UPDATE ejercicio SET nombre = ?, descripcion = ?, series = ?, repeticiones = ?, observaciones = ? WHERE id = ?',
      [
        fusionado.nombre,
        fusionado.descripcion,
        fusionado.series ?? null,
        fusionado.repeticiones ?? null,
        fusionado.observaciones ?? null,
        id,
      ]
    );
    await this.borrarRelaciones(id);
    await this.guardarRelaciones(id, fusionado);
    return { id, ...fusionado, subidoRepositorioComun: actual.subidoRepositorioComun };
  }

  async marcarSubidoRepositorioComun(id: string): Promise<void> {
    await this.conexion.ejecutarSinResultado('UPDATE ejercicio SET subido_repositorio_comun = 1 WHERE id = ?', [id]);
  }

  async quitarMarcaSubidoRepositorioComun(id: string): Promise<void> {
    await this.conexion.ejecutarSinResultado('UPDATE ejercicio SET subido_repositorio_comun = 0 WHERE id = ?', [id]);
  }

  async eliminar(id: string): Promise<void> {
    // ON DELETE CASCADE en el esquema propaga el borrado a categorías,
    // enlaces, imágenes, días de planificación y progreso diario (FR-028).
    await this.conexion.ejecutarSinResultado('DELETE FROM ejercicio WHERE id = ?', [id]);
  }

  async quitarCategoriaDeTodos(categoriaId: string): Promise<void> {
    await this.conexion.ejecutarSinResultado('DELETE FROM ejercicio_categoria WHERE categoria_id = ?', [categoriaId]);
  }

  private async hidratar(fila: FilaEjercicio): Promise<Ejercicio> {
    const categorias = await this.conexion.ejecutar<{ categoria_id: string }>(
      'SELECT categoria_id FROM ejercicio_categoria WHERE ejercicio_id = ?',
      [fila.id]
    );
    const enlaces = await this.conexion.ejecutar<{ tipo: 'web' | 'youtube'; url: string }>(
      'SELECT tipo, url FROM ejercicio_enlace WHERE ejercicio_id = ?',
      [fila.id]
    );
    const imagenes = await this.conexion.ejecutar<{
      id: string;
      tipo: 'url' | 'archivo';
      valor_url: string | null;
      contenido_base64: string | null;
      tipo_mime: string | null;
      nombre_archivo: string | null;
    }>('SELECT id, tipo, valor_url, contenido_base64, tipo_mime, nombre_archivo FROM ejercicio_imagen WHERE ejercicio_id = ?', [
      fila.id,
    ]);

    return {
      id: fila.id,
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      series: fila.series ?? undefined,
      repeticiones: fila.repeticiones ?? undefined,
      observaciones: fila.observaciones ?? undefined,
      categoriaIds: categorias.map((c) => c.categoria_id),
      enlaces: enlaces.map((e): EnlaceEjercicio => ({ tipo: e.tipo, url: e.url })),
      imagenes: imagenes.map(
        (i): ImagenEjercicio => ({
          id: i.id,
          tipo: i.tipo,
          valorUrl: i.valor_url ?? undefined,
          contenidoBase64: i.contenido_base64 ?? undefined,
          tipoMime: i.tipo_mime ?? undefined,
          nombreArchivo: i.nombre_archivo ?? undefined,
        })
      ),
      subidoRepositorioComun: fila.subido_repositorio_comun === 1,
    };
  }

  private async guardarRelaciones(ejercicioId: string, datos: DatosNuevoEjercicio): Promise<void> {
    for (const categoriaId of datos.categoriaIds) {
      await this.conexion.ejecutarSinResultado(
        'INSERT INTO ejercicio_categoria (ejercicio_id, categoria_id) VALUES (?, ?)',
        [ejercicioId, categoriaId]
      );
    }
    for (const enlace of datos.enlaces) {
      await this.conexion.ejecutarSinResultado(
        'INSERT INTO ejercicio_enlace (id, ejercicio_id, tipo, url) VALUES (?, ?, ?, ?)',
        [crypto.randomUUID(), ejercicioId, enlace.tipo, enlace.url]
      );
    }
    for (const imagen of datos.imagenes) {
      await this.conexion.ejecutarSinResultado(
        'INSERT INTO ejercicio_imagen (id, ejercicio_id, tipo, valor_url, contenido_base64, tipo_mime, nombre_archivo) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          imagen.id,
          ejercicioId,
          imagen.tipo,
          imagen.valorUrl ?? null,
          imagen.contenidoBase64 ?? null,
          imagen.tipoMime ?? null,
          imagen.nombreArchivo ?? null,
        ]
      );
    }
  }

  private async borrarRelaciones(ejercicioId: string): Promise<void> {
    await this.conexion.ejecutarSinResultado('DELETE FROM ejercicio_categoria WHERE ejercicio_id = ?', [ejercicioId]);
    await this.conexion.ejecutarSinResultado('DELETE FROM ejercicio_enlace WHERE ejercicio_id = ?', [ejercicioId]);
    await this.conexion.ejecutarSinResultado('DELETE FROM ejercicio_imagen WHERE ejercicio_id = ?', [ejercicioId]);
  }
}
