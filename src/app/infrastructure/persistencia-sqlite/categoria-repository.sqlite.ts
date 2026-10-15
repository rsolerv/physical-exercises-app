import { Injectable, inject } from '@angular/core';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import { validarCategoria } from '../../domain/categoria/validar-categoria';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import { ErrorNoEncontrado, ErrorOperacionNoPermitida } from '../../domain/errores/errores-dominio';
import { SqliteConexionService } from './sqlite-conexion.service';

interface FilaCategoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  es_generica: number;
}

function aCategoria(fila: FilaCategoria): Categoria {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion ?? undefined,
    esGenerica: fila.es_generica === 1,
  };
}

/** Adaptador SQLite del puerto `CategoriaRepositoryPort` (contracts/categoria-repository.port.md). */
@Injectable({ providedIn: 'root' })
export class CategoriaRepositorySqlite implements CategoriaRepositoryPort {
  private readonly conexion = inject(SqliteConexionService);

  async listarTodas(): Promise<Categoria[]> {
    const filas = await this.conexion.ejecutar<FilaCategoria>('SELECT * FROM categoria ORDER BY nombre');
    return filas.map(aCategoria);
  }

  async obtenerPorId(id: string): Promise<Categoria | null> {
    const filas = await this.conexion.ejecutar<FilaCategoria>('SELECT * FROM categoria WHERE id = ?', [id]);
    return filas.length > 0 ? aCategoria(filas[0]) : null;
  }

  async obtenerGenerica(): Promise<Categoria> {
    const filas = await this.conexion.ejecutar<FilaCategoria>('SELECT * FROM categoria WHERE es_generica = 1 LIMIT 1');
    if (filas.length === 0) {
      throw new ErrorNoEncontrado('No existe la categoría genérica "Sin categoría". ¿Se sembró el catálogo predefinido?');
    }
    return aCategoria(filas[0]);
  }

  async crear(nombre: string, descripcion?: string): Promise<Categoria> {
    const existentes = await this.listarTodas();
    validarCategoria(nombre, existentes);

    const id = crypto.randomUUID();
    await this.conexion.ejecutarSinResultado(
      'INSERT INTO categoria (id, nombre, descripcion, es_generica) VALUES (?, ?, ?, 0)',
      [id, nombre, descripcion ?? null]
    );
    return { id, nombre, descripcion, esGenerica: false };
  }

  async crearGenerica(nombre: string): Promise<Categoria> {
    const id = crypto.randomUUID();
    await this.conexion.ejecutarSinResultado(
      'INSERT INTO categoria (id, nombre, es_generica) VALUES (?, ?, 1)',
      [id, nombre]
    );
    return { id, nombre, esGenerica: true };
  }

  async actualizar(id: string, cambios: { nombre?: string; descripcion?: string }): Promise<Categoria> {
    const actual = await this.obtenerPorId(id);
    if (!actual) throw new ErrorNoEncontrado(`No existe la categoría "${id}".`);

    const nombreNuevo = cambios.nombre ?? actual.nombre;
    if (cambios.nombre !== undefined) {
      const existentes = await this.listarTodas();
      validarCategoria(nombreNuevo, existentes, id);
    }

    const descripcionNueva = cambios.descripcion ?? actual.descripcion;
    await this.conexion.ejecutarSinResultado('UPDATE categoria SET nombre = ?, descripcion = ? WHERE id = ?', [
      nombreNuevo,
      descripcionNueva ?? null,
      id,
    ]);
    return { ...actual, nombre: nombreNuevo, descripcion: descripcionNueva };
  }

  async eliminar(id: string): Promise<void> {
    const categoria = await this.obtenerPorId(id);
    if (categoria?.esGenerica) {
      throw new ErrorOperacionNoPermitida('La categoría "Sin categoría" no se puede eliminar.');
    }
    // No se bloquea aunque tenga ejercicios asociados (FR-011): el caso de uso
    // de Application debe llamar antes a quitarCategoriaDeTodos().
    await this.conexion.ejecutarSinResultado('DELETE FROM categoria WHERE id = ?', [id]);
  }
}
