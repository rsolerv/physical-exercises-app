import { Component, computed, inject, resource, signal } from '@angular/core';
import { form, required, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GestionarPlanificacionUseCase } from '../../../application/casos-uso/gestionar-planificacion.use-case';
import { PlanificacionRepositoryPort } from '../../../application/ports/planificacion-repository.port';
import { EjercicioRepositoryPort } from '../../../application/ports/ejercicio-repository.port';
import type { Ejercicio } from '../../../domain/ejercicio/ejercicio.entity';
import { DIAS_SEMANA_ORDENADOS } from '../../../domain/planificacion/planificacion.entity';
import type { DiaSemana, Planificacion } from '../../../domain/planificacion/planificacion.entity';
import { diaSemanaDeFechaIso } from '../../../domain/planificacion/fecha-semana';
import { CabeceraPaginaComponent } from '../../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { MensajeFeedbackService } from '../../compartido/ui/mensaje-feedback.service';
import { EstadoCargaComponent } from '../../compartido/ui/estado-carga/estado-carga.component';
import { esActiva } from '../../../domain/planificacion/es-activa';

const ETIQUETAS_DIA: Record<DiaSemana, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

interface ModeloFormularioPlanificacion {
  nombre: string;
}

type EjerciciosPorDia = Record<DiaSemana, string[]>;

function diasVaciosRegistro(): EjerciciosPorDia {
  return Object.fromEntries(DIAS_SEMANA_ORDENADOS.map((dia) => [dia, []])) as unknown as EjerciciosPorDia;
}

/**
 * Constructor de planificación (Historia de Usuario 3): da de alta una
 * planificación concreta o plantilla, o edita una existente según la ruta
 * (`planificacion/nueva` o `planificacion/:id`). El selector de fecha solo
 * admite lunes (FR-017) y la asignación de ejercicios por día impide
 * duplicados (FR-021).
 */
@Component({
  selector: 'app-planificacion-constructor',
  standalone: true,
  imports: [
    RouterLink,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    CabeceraPaginaComponent,
    EstadoCargaComponent,
  ],
  templateUrl: './planificacion-constructor.component.html',
  styleUrl: './planificacion-constructor.component.scss',
})
export class PlanificacionConstructorComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly planificacionRepository = inject(PlanificacionRepositoryPort);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
  private readonly gestionarPlanificacion = inject(GestionarPlanificacionUseCase);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);

  protected readonly diasOrdenados = DIAS_SEMANA_ORDENADOS;
  protected readonly etiquetasDia = ETIQUETAS_DIA;

  protected readonly planificacionId = this.ruta.snapshot.paramMap.get('id');
  protected readonly modoEdicion = this.planificacionId !== null;
  protected readonly titulo = this.modoEdicion ? 'Editar planificación' : 'Nueva planificación';

  readonly modelo = signal<ModeloFormularioPlanificacion>({ nombre: '' });
  readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.nombre, { message: 'El nombre de la planificación no puede estar vacío.' });
  });

  readonly fechaInicio = signal<string | undefined>(undefined);
  readonly errorFecha = signal<string | null>(null);

  readonly ejerciciosPorDia = signal<EjerciciosPorDia>(diasVaciosRegistro());
  readonly errorDia = signal<string | null>(null);
  readonly busquedaEjercicios = signal<Record<DiaSemana, string>>(busquedasVacias());
  readonly cargandoPlanificacion = signal(false);
  readonly errorCargaPlanificacion = signal<string | null>(null);

  readonly guardando = signal(false);
  readonly errorAlGuardar = signal<string | null>(null);

  protected readonly recursoEjercicios = resource({
    loader: () => this.ejercicioRepository.listarTodos(),
  });

  readonly ejercicios = computed(() =>
    this.recursoEjercicios.hasValue() ? this.recursoEjercicios.value() : ([] as Ejercicio[])
  );

  protected readonly nombresEjercicios = computed(() => new Map(this.ejercicios().map((e) => [e.id, e.nombre])));

  constructor() {
    if (this.planificacionId) {
      this.cargandoPlanificacion.set(true);
      void this.cargarParaEdicion(this.planificacionId);
    }
  }

  private async cargarParaEdicion(id: string): Promise<void> {
    this.errorCargaPlanificacion.set(null);
    try {
      const planificacion = await this.planificacionRepository.obtenerPorId(id);
      if (!planificacion) {
        this.errorCargaPlanificacion.set('No se ha encontrado la planificación que quieres editar.');
        return;
      }
      this.modelo.set({ nombre: planificacion.nombre });
      this.fechaInicio.set(planificacion.fechaInicio);
      const registro = diasVaciosRegistro();
      for (const dia of planificacion.dias) {
        registro[dia.diaSemana] = [...dia.ejercicioIds];
      }
      this.ejerciciosPorDia.set(registro);
    } catch (error) {
      this.errorCargaPlanificacion.set(error instanceof Error ? error.message : 'No se ha podido cargar la planificación.');
    } finally {
      this.cargandoPlanificacion.set(false);
    }
  }

  etiquetaTipoPlan(): string {
    const fechaInicio = this.fechaInicio();
    if (!fechaInicio) return 'Plantilla';
    const provisional: Planificacion = {
      id: this.planificacionId ?? '',
      nombre: this.modelo().nombre,
      fechaInicio,
      dias: [],
    };
    return esActiva(provisional, new Date()) ? 'Activa' : 'Planificación';
  }

  establecerBusquedaEjercicio(dia: DiaSemana, busqueda: string): void {
    this.busquedaEjercicios.update((actuales) => ({ ...actuales, [dia]: busqueda }));
  }

  ejerciciosDisponiblesParaDia(dia: DiaSemana): Ejercicio[] {
    const consulta = this.busquedaEjercicios()[dia].trim().toLocaleLowerCase('es');
    return this.ejercicios().filter(
      (ejercicio) =>
        !this.ejerciciosPorDia()[dia].includes(ejercicio.id) &&
        (!consulta ||
          ejercicio.nombre.toLocaleLowerCase('es').includes(consulta) ||
          ejercicio.descripcion.toLocaleLowerCase('es').includes(consulta))
    );
  }

  establecerFechaInicio(valor: string): void {
    if (!valor) {
      this.fechaInicio.set(undefined);
      this.errorFecha.set(null);
      return;
    }
    if (diaSemanaDeFechaIso(valor) !== 'lunes') {
      this.errorFecha.set('La fecha de inicio debe ser un lunes.');
      return;
    }
    this.errorFecha.set(null);
    this.fechaInicio.set(valor);
  }

  async anadirEjercicioADia(dia: DiaSemana, ejercicioId: string): Promise<void> {
    if (!ejercicioId) return;
    this.errorDia.set(null);
    const actuales = this.ejerciciosPorDia()[dia];
    if (actuales.includes(ejercicioId)) {
      this.errorDia.set('Este ejercicio ya está asignado a ese día.');
      return;
    }
    this.ejerciciosPorDia.update((registro) => ({ ...registro, [dia]: [...registro[dia], ejercicioId] }));
    if (this.modoEdicion && this.planificacionId) {
      try {
        await this.gestionarPlanificacion.asignarEjercicioADia(this.planificacionId, dia, ejercicioId);
      } catch (error) {
        this.ejerciciosPorDia.update((registro) => ({
          ...registro,
          [dia]: registro[dia].filter((id) => id !== ejercicioId),
        }));
        this.errorDia.set(error instanceof Error ? error.message : 'No se ha podido asignar el ejercicio.');
      }
    }
  }

  async quitarEjercicioDeDia(dia: DiaSemana, ejercicioId: string): Promise<void> {
    if (this.modoEdicion && this.planificacionId) {
      try {
        await this.gestionarPlanificacion.quitarEjercicioDeDia(this.planificacionId, dia, ejercicioId);
      } catch (error) {
        this.errorDia.set(error instanceof Error ? error.message : 'No se ha podido quitar el ejercicio.');
        return;
      }
    }
    this.ejerciciosPorDia.update((registro) => ({
      ...registro,
      [dia]: registro[dia].filter((id) => id !== ejercicioId),
    }));
  }

  async guardar(): Promise<void> {
    if (!this.formulario().valid() || this.errorFecha()) return;

    this.guardando.set(true);
    this.errorAlGuardar.set(null);
    try {
      const dias = DIAS_SEMANA_ORDENADOS.map((diaSemana) => ({ diaSemana, ejercicioIds: this.ejerciciosPorDia()[diaSemana] }));
      if (this.modoEdicion && this.planificacionId) {
        await this.gestionarPlanificacion.actualizar(this.planificacionId, {
          nombre: this.modelo().nombre,
          fechaInicio: this.fechaInicio(),
        });
      } else {
        const creada = await this.gestionarPlanificacion.crear({
          nombre: this.modelo().nombre,
          fechaInicio: this.fechaInicio(),
          dias,
        });
        await this.router.navigate(['/planificacion', creada.id]);
      }
      this.mensajeFeedback.mostrarExito('Planificación guardada.');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se ha podido guardar la planificación.';
      this.errorAlGuardar.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
    } finally {
      this.guardando.set(false);
    }
  }

  async duplicar(): Promise<void> {
    if (!this.planificacionId) return;
    try {
      const copia = await this.gestionarPlanificacion.duplicar(this.planificacionId, `${this.modelo().nombre} (copia)`);
      this.mensajeFeedback.mostrarExito('Planificación duplicada.');
      await this.router.navigate(['/planificacion', copia.id]);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se ha podido duplicar la planificación.';
      this.errorAlGuardar.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
    }
  }
}

function busquedasVacias(): Record<DiaSemana, string> {
  return Object.fromEntries(DIAS_SEMANA_ORDENADOS.map((dia) => [dia, ''])) as Record<DiaSemana, string>;
}
