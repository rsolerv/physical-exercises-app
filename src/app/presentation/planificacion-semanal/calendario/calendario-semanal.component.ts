import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlanificacionRepositoryPort } from '../../../application/ports/planificacion-repository.port';
import { EjercicioRepositoryPort } from '../../../application/ports/ejercicio-repository.port';
import { DIAS_SEMANA_ORDENADOS } from '../../../domain/planificacion/planificacion.entity';
import type { Planificacion } from '../../../domain/planificacion/planificacion.entity';
import { esActiva } from '../../../domain/planificacion/es-activa';
import { CabeceraPaginaComponent } from '../../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../../compartido/ui/estado-vacio/estado-vacio.component';

const ETIQUETAS_DIA: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

/**
 * Calendario semanal (Historia de Usuario 3): lista todas las
 * planificaciones y plantillas y muestra la semana de la seleccionada,
 * marcando visualmente los días con ejercicios asignados (FR-003 de la
 * cuadrícula de días).
 */
@Component({
  selector: 'app-calendario-semanal',
  standalone: true,
  imports: [
    RouterLink,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    CabeceraPaginaComponent,
    EstadoVacioComponent,
  ],
  templateUrl: './calendario-semanal.component.html',
  styleUrl: './calendario-semanal.component.scss',
})
export class CalendarioSemanalComponent {
  private readonly planificacionRepository = inject(PlanificacionRepositoryPort);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);

  protected readonly diasOrdenados = DIAS_SEMANA_ORDENADOS;
  protected readonly etiquetasDia = ETIQUETAS_DIA;

  protected readonly recursoPlanificaciones = resource({
    loader: () => this.planificacionRepository.listarTodas(),
  });

  protected readonly recursoEjercicios = resource({
    loader: () => this.ejercicioRepository.listarTodos(),
  });

  private readonly nombresPorId = computed(() => new Map((this.recursoEjercicios.value() ?? []).map((e) => [e.id, e.nombre])));

  readonly seleccionada = signal<Planificacion | null>(null);

  protected readonly planificacionMostrada = computed(() => {
    const manual = this.seleccionada();
    if (manual) return manual;
    const todas = this.recursoPlanificaciones.value() ?? [];
    return todas.find((p) => esActiva(p, new Date())) ?? todas[0] ?? null;
  });

  seleccionar(planificacion: Planificacion): void {
    this.seleccionada.set(planificacion);
  }

  protected nombreEjercicio(ejercicioId: string): string {
    return this.nombresPorId().get(ejercicioId) ?? ejercicioId;
  }

  protected obtenerDia(planificacion: Planificacion, dia: (typeof DIAS_SEMANA_ORDENADOS)[number]) {
    return planificacion.dias.find((d) => d.diaSemana === dia) ?? null;
  }
}
