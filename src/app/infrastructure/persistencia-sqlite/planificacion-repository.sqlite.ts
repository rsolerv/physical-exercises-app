import { Injectable, inject } from '@angular/core';
import type { DatosNuevaPlanificacion, DiaSemana, Planificacion } from '../../domain/planificacion/planificacion.entity';
import { DIAS_SEMANA_ORDENADOS } from '../../domain/planificacion/planificacion.entity';
import { esActiva } from '../../domain/planificacion/es-activa';
import { validarFechaInicio } from '../../domain/planificacion/validar-fecha-inicio';
import { validarAsignacionDia } from '../../domain/planificacion/validar-asignacion-dia';
import { duplicarPlanificacion } from '../../domain/planificacion/duplicar-planificacion';
import { PlanificacionRepositoryPort } from '../../application/ports/planificacion-repository.port';
import { ErrorNoEncontrado } from '../../domain/errores/errores-dominio';
import { SqliteConexionService } from './sqlite-conexion.service';

interface FilaPlanificacion {
  id: string;
  nombre: string;
  fecha_inicio: string | null;
}

interface FilaDiaPlanificacion {
  id: string;
  dia_semana: DiaSemana;
}

/** Adaptador SQLite del puerto `PlanificacionRepositoryPort` (contracts/planificacion-repository.port.md). */
@Injectable({ providedIn: 'root' })
export class PlanificacionRepositorySqlite implements PlanificacionRepositoryPort {
  private readonly conexion = inject(SqliteConexionService);

  async obtenerPorId(id: string): Promise<Planificacion | null> {
    const filas = await this.conexion.ejecutar<FilaPlanificacion>('SELECT * FROM planificacion WHERE id = ?', [id]);
    if (filas.length === 0) return null;
    return this.hidratar(filas[0]);
  }

  async listarTodas(): Promise<Planificacion[]> {
    const filas = await this.conexion.ejecutar<FilaPlanificacion>('SELECT * FROM planificacion ORDER BY nombre');
    return Promise.all(filas.map((fila) => this.hidratar(fila)));
  }

  async obtenerActiva(fechaReferencia: Date): Promise<Planificacion | null> {
    const filas = await this.conexion.ejecutar<FilaPlanificacion>(
      'SELECT * FROM planificacion WHERE fecha_inicio IS NOT NULL'
    );
    for (const fila of filas) {
      const planificacion = await this.hidratar(fila);
      if (esActiva(planificacion, fechaReferencia)) return planificacion;
    }
    return null;
  }

  async crear(datos: DatosNuevaPlanificacion): Promise<Planificacion> {
    if (datos.fechaInicio) {
      const existentes = await this.conexion.ejecutar<{ fecha_inicio: string }>(
        'SELECT fecha_inicio FROM planificacion WHERE fecha_inicio IS NOT NULL'
      );
      validarFechaInicio(
        datos.fechaInicio,
        existentes.map((f) => f.fecha_inicio)
      );
    }

    const id = crypto.randomUUID();
    await this.conexion.ejecutarSinResultado('INSERT INTO planificacion (id, nombre, fecha_inicio) VALUES (?, ?, ?)', [
      id,
      datos.nombre,
      datos.fechaInicio ?? null,
    ]);

    for (const diaSemana of DIAS_SEMANA_ORDENADOS) {
      const diaId = crypto.randomUUID();
      await this.conexion.ejecutarSinResultado(
        'INSERT INTO dia_planificacion (id, planificacion_id, dia_semana) VALUES (?, ?, ?)',
        [diaId, id, diaSemana]
      );
      const dia = datos.dias.find((d) => d.diaSemana === diaSemana);
      for (const ejercicioId of dia?.ejercicioIds ?? []) {
        await this.conexion.ejecutarSinResultado(
          'INSERT INTO dia_planificacion_ejercicio (dia_planificacion_id, ejercicio_id) VALUES (?, ?)',
          [diaId, ejercicioId]
        );
      }
    }

    return { id, nombre: datos.nombre, fechaInicio: datos.fechaInicio, dias: datos.dias };
  }

  async actualizar(id: string, cambios: Partial<DatosNuevaPlanificacion>): Promise<Planificacion> {
    const actual = await this.obtenerPorId(id);
    if (!actual) throw new ErrorNoEncontrado(`No existe la planificación "${id}".`);

    if (cambios.fechaInicio !== undefined && cambios.fechaInicio !== actual.fechaInicio) {
      const existentes = await this.conexion.ejecutar<{ fecha_inicio: string }>(
        'SELECT fecha_inicio FROM planificacion WHERE fecha_inicio IS NOT NULL AND id != ?',
        [id]
      );
      validarFechaInicio(
        cambios.fechaInicio,
        existentes.map((f) => f.fecha_inicio)
      );
    }

    const nombreNuevo = cambios.nombre ?? actual.nombre;
    const fechaInicioNueva = cambios.fechaInicio !== undefined ? cambios.fechaInicio : actual.fechaInicio;
    await this.conexion.ejecutarSinResultado('UPDATE planificacion SET nombre = ?, fecha_inicio = ? WHERE id = ?', [
      nombreNuevo,
      fechaInicioNueva ?? null,
      id,
    ]);

    return { ...actual, nombre: nombreNuevo, fechaInicio: fechaInicioNueva };
  }

  async duplicar(id: string, nuevoNombre: string): Promise<Planificacion> {
    const original = await this.obtenerPorId(id);
    if (!original) throw new ErrorNoEncontrado(`No existe la planificación "${id}".`);
    const datos = duplicarPlanificacion(original, nuevoNombre);
    return this.crear(datos);
  }

  async asignarEjercicioADia(planificacionId: string, dia: DiaSemana, ejercicioId: string): Promise<void> {
    const diaId = await this.obtenerIdDia(planificacionId, dia);
    const filas = await this.conexion.ejecutar<{ ejercicio_id: string }>(
      'SELECT ejercicio_id FROM dia_planificacion_ejercicio WHERE dia_planificacion_id = ?',
      [diaId]
    );
    validarAsignacionDia(
      filas.map((f) => f.ejercicio_id),
      ejercicioId
    );
    await this.conexion.ejecutarSinResultado(
      'INSERT INTO dia_planificacion_ejercicio (dia_planificacion_id, ejercicio_id) VALUES (?, ?)',
      [diaId, ejercicioId]
    );
  }

  async quitarEjercicioDeDia(planificacionId: string, dia: DiaSemana, ejercicioId: string): Promise<void> {
    const diaId = await this.obtenerIdDia(planificacionId, dia);
    await this.conexion.ejecutarSinResultado(
      'DELETE FROM dia_planificacion_ejercicio WHERE dia_planificacion_id = ? AND ejercicio_id = ?',
      [diaId, ejercicioId]
    );
  }

  async listarPorEjercicio(ejercicioId: string): Promise<Planificacion[]> {
    const filas = await this.conexion.ejecutar<FilaPlanificacion>(
      'SELECT DISTINCT p.* FROM planificacion p ' +
        'JOIN dia_planificacion dp ON dp.planificacion_id = p.id ' +
        'JOIN dia_planificacion_ejercicio dpe ON dpe.dia_planificacion_id = dp.id ' +
        'WHERE dpe.ejercicio_id = ? ORDER BY p.nombre',
      [ejercicioId]
    );
    return Promise.all(filas.map((fila) => this.hidratar(fila)));
  }

  async eliminar(id: string): Promise<void> {
    // ON DELETE CASCADE en el esquema propaga el borrado a los días y a sus ejercicios asignados.
    await this.conexion.ejecutarSinResultado('DELETE FROM planificacion WHERE id = ?', [id]);
  }

  private async obtenerIdDia(planificacionId: string, dia: DiaSemana): Promise<string> {
    const filas = await this.conexion.ejecutar<{ id: string }>(
      'SELECT id FROM dia_planificacion WHERE planificacion_id = ? AND dia_semana = ?',
      [planificacionId, dia]
    );
    if (filas.length === 0) {
      throw new ErrorNoEncontrado(`No existe el día "${dia}" en la planificación "${planificacionId}".`);
    }
    return filas[0].id;
  }

  private async hidratar(fila: FilaPlanificacion): Promise<Planificacion> {
    const diasFilas = await this.conexion.ejecutar<FilaDiaPlanificacion>(
      'SELECT id, dia_semana FROM dia_planificacion WHERE planificacion_id = ?',
      [fila.id]
    );
    const diasPorSemana = new Map(diasFilas.map((d) => [d.dia_semana, d.id]));

    const dias = await Promise.all(
      DIAS_SEMANA_ORDENADOS.map(async (diaSemana) => {
        const diaId = diasPorSemana.get(diaSemana);
        if (!diaId) return { diaSemana, ejercicioIds: [] };
        const ejerciciosFilas = await this.conexion.ejecutar<{ ejercicio_id: string }>(
          'SELECT ejercicio_id FROM dia_planificacion_ejercicio WHERE dia_planificacion_id = ?',
          [diaId]
        );
        return { diaSemana, ejercicioIds: ejerciciosFilas.map((e) => e.ejercicio_id) };
      })
    );

    return {
      id: fila.id,
      nombre: fila.nombre,
      fechaInicio: fila.fecha_inicio ?? undefined,
      dias,
    };
  }
}
