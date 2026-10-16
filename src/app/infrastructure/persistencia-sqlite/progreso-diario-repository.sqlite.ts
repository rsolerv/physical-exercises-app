import { Injectable, inject } from '@angular/core';
import type { ProgresoDiario } from '../../domain/progreso-diario/progreso-diario.entity';
import { formatearFechaIso } from '../../domain/planificacion/fecha-semana';
import { ProgresoDiarioRepositoryPort } from '../../application/ports/progreso-diario-repository.port';
import { SqliteConexionService } from './sqlite-conexion.service';

interface FilaProgresoDiario {
  fecha: string;
  ejercicio_id: string;
  realizado: number;
}

function aProgresoDiario(fila: FilaProgresoDiario): ProgresoDiario {
  return { fecha: fila.fecha, ejercicioId: fila.ejercicio_id, realizado: fila.realizado === 1 };
}

/** Adaptador SQLite del puerto `ProgresoDiarioRepositoryPort` (contracts/progreso-diario-repository.port.md). */
@Injectable({ providedIn: 'root' })
export class ProgresoDiarioRepositorySqlite implements ProgresoDiarioRepositoryPort {
  private readonly conexion = inject(SqliteConexionService);

  async obtenerPorFecha(fecha: Date): Promise<ProgresoDiario[]> {
    const fechaIso = formatearFechaIso(fecha);
    const filas = await this.conexion.ejecutar<FilaProgresoDiario>(
      'SELECT fecha, ejercicio_id, realizado FROM progreso_diario WHERE fecha = ?',
      [fechaIso]
    );
    return filas.map(aProgresoDiario);
  }

  async marcar(fecha: Date, ejercicioId: string, realizado: boolean): Promise<void> {
    const fechaIso = formatearFechaIso(fecha);
    await this.conexion.ejecutarSinResultado(
      'INSERT INTO progreso_diario (fecha, ejercicio_id, realizado) VALUES (?, ?, ?) ' +
        'ON CONFLICT (fecha, ejercicio_id) DO UPDATE SET realizado = excluded.realizado',
      [fechaIso, ejercicioId, realizado ? 1 : 0]
    );
  }
}
