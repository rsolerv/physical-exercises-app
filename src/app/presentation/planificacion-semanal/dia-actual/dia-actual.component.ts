import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConsultarPlanificacionUseCase } from '../../../application/casos-uso/consultar-planificacion.use-case';
import { EjercicioRepositoryPort } from '../../../application/ports/ejercicio-repository.port';
import type { Ejercicio } from '../../../domain/ejercicio/ejercicio.entity';
import { diaSemanaDeFecha } from '../../../domain/planificacion/fecha-semana';
import { CabeceraPaginaComponent } from '../../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../../compartido/ui/estado-vacio/estado-vacio.component';
import { ProgresoDiarioComponent } from '../../progreso-diario/progreso-diario.component';

/**
 * Vista "hoy" (Historia de Usuario 3): pantalla de inicio de la aplicación
 * (FR-008, SC-003). Muestra los ejercicios planificados para el día actual o
 * un mensaje cuando no hay ninguno, tanto si no existe planificación activa
 * como si la hay pero el día de hoy está vacío (FR-030). El progreso del día
 * (FR-024, FR-025) se marca sin salir de esta pantalla (Historia de Usuario 4).
 */
@Component({
  selector: 'app-dia-actual',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, CabeceraPaginaComponent, EstadoVacioComponent, ProgresoDiarioComponent],
  templateUrl: './dia-actual.component.html',
  styleUrl: './dia-actual.component.scss',
})
export class DiaActualComponent {
  private readonly consultarPlanificacion = inject(ConsultarPlanificacionUseCase);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);

  protected readonly hoy = new Date();
  protected readonly diaSemanaHoy = diaSemanaDeFecha(this.hoy);

  protected readonly recursoPlanificacionHoy = resource({
    loader: () => this.consultarPlanificacion.obtenerDeHoy(),
  });

  protected readonly recursoEjercicios = resource({
    loader: () => this.ejercicioRepository.listarTodos(),
  });

  protected readonly ejercicioIdsDeHoy = computed(() => {
    const planificacion = this.recursoPlanificacionHoy.value();
    if (!planificacion) return [];
    return planificacion.dias.find((dia) => dia.diaSemana === this.diaSemanaHoy)?.ejercicioIds ?? [];
  });

  protected readonly ejerciciosDeHoy = computed(() => {
    const nombresPorId = new Map((this.recursoEjercicios.value() ?? []).map((e) => [e.id, e]));
    return this.ejercicioIdsDeHoy()
      .map((id) => nombresPorId.get(id))
      .filter((ejercicio): ejercicio is Ejercicio => ejercicio !== undefined);
  });

  protected readonly cargando = computed(
    () => this.recursoPlanificacionHoy.isLoading() || this.recursoEjercicios.isLoading()
  );
}
