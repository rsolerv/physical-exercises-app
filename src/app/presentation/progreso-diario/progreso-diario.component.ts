import { Component, computed, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProgresoDiarioRepositoryPort } from '../../application/ports/progreso-diario-repository.port';
import { GestionarProgresoDiarioUseCase } from '../../application/casos-uso/gestionar-progreso-diario.use-case';
import { calcularPorcentajeDia } from '../../domain/progreso-diario/calcular-porcentaje-dia';
import { MensajeFeedbackService } from '../compartido/ui/mensaje-feedback.service';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import type { Ejercicio } from '../../domain/ejercicio/ejercicio.entity';
import type { CambioProgreso } from '../../application/casos-uso/gestionar-progreso-diario.use-case';

/**
 * Progreso diario (Historia de Usuario 4): una casilla por ejercicio
 * planificado para la fecha indicada y el porcentaje de progreso del día
 * (FR-024, FR-025). El cálculo del porcentaje lo hace siempre el dominio
 * puro `calcular-porcentaje-dia`.
 */
@Component({
  selector: 'app-progreso-diario',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCheckboxModule, MatProgressBarModule],
  templateUrl: './progreso-diario.component.html',
  styleUrl: './progreso-diario.component.scss',
})
export class ProgresoDiarioComponent {
  private readonly progresoDiarioRepository = inject(ProgresoDiarioRepositoryPort);
  private readonly gestionarProgresoDiario = inject(GestionarProgresoDiarioUseCase);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);

  readonly fecha = input.required<Date>();
  readonly ejercicios = input.required<Ejercicio[]>();
  readonly categorias = input<Categoria[]>([]);

  protected readonly recursoRegistros = resource({
    params: () => ({ fecha: this.fecha() }),
    loader: ({ params }) => this.progresoDiarioRepository.obtenerPorFecha(params.fecha),
  });

  protected readonly idsRealizados = computed(
    () => new Set((this.recursoRegistros.value() ?? []).filter((registro) => registro.realizado).map((registro) => registro.ejercicioId))
  );

  protected readonly resultado = computed(() =>
    calcularPorcentajeDia(
      this.ejercicios().map((ejercicio) => ejercicio.id),
      this.recursoRegistros.value() ?? []
    )
  );
  protected readonly mensajeEstado = computed(() => {
    const porcentaje = this.resultado().porcentaje;
    if (porcentaje === null) return '';
    if (porcentaje === 0) return 'Aún no has marcado ejercicios';
    if (porcentaje === 100) return 'Día completado';
    return 'Buen progreso';
  });

  protected nombresCategorias(ejercicio: Ejercicio): string[] {
    const nombresPorId = new Map(this.categorias().map((categoria) => [categoria.id, categoria.nombre]));
    return ejercicio.categoriaIds
      .map((id) => nombresPorId.get(id))
      .filter((nombre): nombre is string => nombre !== undefined);
  }

  protected estaRealizado(ejercicioId: string): boolean {
    return this.idsRealizados().has(ejercicioId);
  }

  async alternar(ejercicioId: string): Promise<void> {
    const nuevoEstado = !this.estaRealizado(ejercicioId);
    try {
      const cambio = await this.gestionarProgresoDiario.marcar(this.fecha(), ejercicioId, nuevoEstado);
      this.mensajeFeedback.mostrarExitoConAccion('Progreso actualizado.', 'Deshacer', () => {
        void this.deshacer(cambio);
      });
      this.recursoRegistros.reload();
    } catch (error) {
      this.mensajeFeedback.mostrarError(this.mensajeDeError(error));
    }
  }

  private async deshacer(cambio: CambioProgreso): Promise<void> {
    try {
      await this.gestionarProgresoDiario.restaurarCambio(cambio);
      this.recursoRegistros.reload();
    } catch (error) {
      this.mensajeFeedback.mostrarError(this.mensajeDeError(error));
    }
  }

  private mensajeDeError(error: unknown): string {
    return error instanceof Error && error.message
      ? `No se pudo actualizar el progreso: ${error.message}`
      : 'No se pudo actualizar el progreso. Inténtalo de nuevo.';
  }
}
