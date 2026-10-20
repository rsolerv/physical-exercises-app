import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PlanificacionRepositoryPort } from '../../../application/ports/planificacion-repository.port';
import { EjercicioRepositoryPort } from '../../../application/ports/ejercicio-repository.port';
import { DIAS_SEMANA_ORDENADOS } from '../../../domain/planificacion/planificacion.entity';
import type { Planificacion } from '../../../domain/planificacion/planificacion.entity';
import type { DiaSemana } from '../../../domain/planificacion/planificacion.entity';
import { esActiva } from '../../../domain/planificacion/es-activa';
import { CabeceraPaginaComponent } from '../../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../../compartido/ui/estado-vacio/estado-vacio.component';
import { EstadoCargaComponent } from '../../compartido/ui/estado-carga/estado-carga.component';

const ETIQUETAS_DIA: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};
const DIAS_POR_NUMERO: DiaSemana[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

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
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    CabeceraPaginaComponent,
    EstadoVacioComponent,
    EstadoCargaComponent,
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

  protected readonly errorCarga = computed(() => {
    const error = this.recursoPlanificaciones.error() ?? this.recursoEjercicios.error();
    if (!error) return null;
    return error instanceof Error ? error.message : 'No se ha podido cargar la planificación.';
  });
  protected readonly cargando = computed(
    () => this.recursoPlanificaciones.value() === undefined || this.recursoEjercicios.value() === undefined
  );

  readonly seleccionada = signal<Planificacion | null>(null);
  readonly diaSeleccionado = signal<DiaSemana>(DIAS_POR_NUMERO[new Date().getDay()]);

  protected readonly planificacionMostrada = computed(() => {
    const manual = this.seleccionada();
    if (manual) return manual;
    const todas = this.recursoPlanificaciones.value() ?? [];
    return todas.find((p) => esActiva(p, new Date())) ?? todas[0] ?? null;
  });

  seleccionar(planificacion: Planificacion): void {
    this.seleccionada.set(planificacion);
  }

  seleccionarPorId(id: string): void {
    const planificacion = this.recursoPlanificaciones.value()?.find((item) => item.id === id);
    if (planificacion) this.seleccionar(planificacion);
  }

  seleccionarDia(dia: DiaSemana): void {
    this.diaSeleccionado.set(dia);
  }

  etiquetaTipoPlan(planificacion: Planificacion): string {
    if (!planificacion.fechaInicio) return 'Plantilla';
    return esActiva(planificacion, new Date()) ? 'Activa' : 'Planificada';
  }

  formatearSemana(planificacion: Planificacion): string {
    if (!planificacion.fechaInicio) return 'Sin fecha de inicio';
    const fecha = new Date(`${planificacion.fechaInicio}T00:00:00Z`);
    return `Semana del ${new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(fecha)}`;
  }

  esHoy(dia: DiaSemana): boolean {
    return DIAS_POR_NUMERO[new Date().getDay()] === dia;
  }

  protected nombreEjercicio(ejercicioId: string): string {
    return this.nombresPorId().get(ejercicioId) ?? 'Ejercicio no disponible';
  }

  protected obtenerDia(planificacion: Planificacion, dia: (typeof DIAS_SEMANA_ORDENADOS)[number]) {
    return planificacion.dias.find((d) => d.diaSemana === dia) ?? null;
  }
}
