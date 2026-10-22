import { Injectable, inject } from '@angular/core';
import type {
  DatosNuevoEjercicio,
  Ejercicio,
  EnlaceEjercicio,
  ImagenEjercicio,
} from '../../domain/ejercicio/ejercicio.entity';
import { validarEjercicio } from '../../domain/ejercicio/validar-ejercicio';
import { EjercicioRepositoryPort } from '../../application/ports/ejercicio-repository.port';
import { ErrorNoEncontrado } from '../../domain/errores/errores-dominio';
import { SqliteConexionService } from './sqlite-conexion.service';

interface FilaEjercicio {
  id: string;
  nombre: string;
  descripcion: string;
  observaciones: string | null;
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

  async buscarPorTexto(texto: string): Promise<Ejercicio[]> {
    const patron = `%${texto.toLowerCase()}%`;
    const filas = await this.conexion.ejecutar<FilaEjercicio>(
      'SELECT * FROM ejercicio WHERE LOWER(nombre) LIKE ? OR LOWER(descripcion) LIKE ? ORDER BY nombre',
      [patron, patron]
    );
    return Promise.all(filas.map((fila) => this.hidratar(fila)));
  }

  async buscarPorCategorias(categoriaIds: string[]): Promise<Ejercicio[]> {
    if (categoriaIds.length === 0) return [];
    const marcadores = categoriaIds.map(() => '?').join(', ');
    const filas = await this.conexion.ejecutar<FilaEjercicio>(
      `SELECT DISTINCT e.* FROM ejercicio e ` +
        `JOIN ejercicio_categoria ec ON ec.ejercicio_id = e.id ` +
        `WHERE ec.categoria_id IN (${marcadores}) ORDER BY e.nombre`,
      categoriaIds
    );
    return Promise.all(filas.map((fila) => this.hidratar(fila)));
  }

  async crear(datos: DatosNuevoEjercicio): Promise<Ejercicio> {
    validarEjercicio(datos);
    const id = crypto.randomUUID();
    await this.guardarEjercicio(id, datos);
    return { id, ...datos };
  }

  async restaurar(ejercicio: Ejercicio): Promise<void> {
    const { id, ...datos } = ejercicio;
    validarEjercicio(datos);
    await this.guardarEjercicio(id, datos);
  }

  private async guardarEjercicio(id: string, datos: DatosNuevoEjercicio): Promise<void> {
    await this.conexion.ejecutarSinResultado(
      'INSERT INTO ejercicio (id, nombre, descripcion, observaciones) VALUES (?, ?, ?, ?)',
      [id, datos.nombre, datos.descripcion, datos.observaciones ?? null]
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
      observaciones: cambios.observaciones ?? actual.observaciones,
    };
    validarEjercicio(fusionado);

    await this.conexion.ejecutarSinResultado(
      'UPDATE ejercicio SET nombre = ?, descripcion = ?, observaciones = ? WHERE id = ?',
      [fusionado.nombre, fusionado.descripcion, fusionado.observaciones ?? null, id]
    );
    await this.borrarRelaciones(id);
    await this.guardarRelaciones(id, fusionado);
    return { id, ...fusionado };
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
