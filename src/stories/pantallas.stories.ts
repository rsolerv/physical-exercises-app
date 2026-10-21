import { ActivatedRoute, provideRouter } from '@angular/router';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { BusquedaEjerciciosComponent } from '../app/presentation/busqueda-ejercicios/busqueda-ejercicios.component';
import { CategoriaGestionComponent } from '../app/presentation/biblioteca-ejercicios/categorias/categoria-gestion.component';
import { EjercicioFichaComponent } from '../app/presentation/biblioteca-ejercicios/ejercicio-ficha.component';
import { EjercicioFormularioComponent } from '../app/presentation/biblioteca-ejercicios/ejercicio-formulario.component';
import { DiaActualComponent } from '../app/presentation/planificacion-semanal/dia-actual/dia-actual.component';
import { CalendarioSemanalComponent } from '../app/presentation/planificacion-semanal/calendario/calendario-semanal.component';
import { PlanificacionConstructorComponent } from '../app/presentation/planificacion-semanal/constructor/planificacion-constructor.component';
import { ConfiguracionSincronizacionComponent } from '../app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component';
import { ResolucionConflictoComponent } from '../app/presentation/sincronizacion/conflicto/resolucion-conflicto.component';
import { ConflictoSincronizacionEstadoService } from '../app/presentation/sincronizacion/conflicto-sincronizacion-estado.service';
import { EjercicioRepositoryPort } from '../app/application/ports/ejercicio-repository.port';
import { PlanificacionRepositoryPort } from '../app/application/ports/planificacion-repository.port';
import { BuscarEjerciciosUseCase } from '../app/application/casos-uso/buscar-ejercicios.use-case';
import { DEMO_PROVIDERS, EJERCICIOS_DEMO, estadoSinConflicto } from './demo-data';

const meta: Meta = {
  title: 'Physical Exercises/Pantallas',
  decorators: [
    moduleMetadata({
      imports: [
        DiaActualComponent,
        BusquedaEjerciciosComponent,
        CalendarioSemanalComponent,
        PlanificacionConstructorComponent,
        CategoriaGestionComponent,
        EjercicioFormularioComponent,
        EjercicioFichaComponent,
        ConfiguracionSincronizacionComponent,
        ResolucionConflictoComponent,
      ],
    }),
    applicationConfig({ providers: [provideRouter([{ path: '**', component: DiaActualComponent }]), ...DEMO_PROVIDERS] }),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

function pantalla(template: string): Story {
  return { render: () => ({ template }) };
}

function rutaConId(id: string | null) {
  return {
    provide: ActivatedRoute,
    useValue: { snapshot: { paramMap: { get: (nombre: string) => (nombre === 'id' ? id : null) } } },
  };
}

export const Hoy = pantalla('<app-dia-actual />');
export const BuscarEjercicios = pantalla('<app-busqueda-ejercicios />');
export const PlanificacionSemanal = pantalla('<app-calendario-semanal />');
export const NuevaPlanificacion = pantalla('<app-planificacion-constructor />');
export const Categorias = pantalla('<app-categoria-gestion />');
export const NuevoEjercicio = pantalla('<app-ejercicio-formulario />');

export const FichaDeEjercicio: Story = {
  ...pantalla('<app-ejercicio-ficha />'),
  decorators: [applicationConfig({ providers: [rutaConId('sentadilla')] })],
};

export const EditarEjercicio: Story = {
  ...pantalla('<app-ejercicio-formulario />'),
  decorators: [applicationConfig({ providers: [rutaConId('sentadilla')] })],
};

export const ConfiguracionDeSincronizacion = pantalla('<app-configuracion-sincronizacion />');

export const ConflictoDeSincronizacion: Story = pantalla('<app-resolucion-conflicto />');

export const SinConflictoPendiente: Story = {
  ...pantalla('<app-resolucion-conflicto />'),
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ConflictoSincronizacionEstadoService,
          useValue: estadoSinConflicto(),
        },
      ],
    }),
  ],
};

export const BibliotecaVacia: Story = {
  ...pantalla('<app-busqueda-ejercicios />'),
  decorators: [
    applicationConfig({
      providers: [
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: async () => [], buscarPorTexto: async () => [], buscarPorCategorias: async () => [] } },
        { provide: BuscarEjerciciosUseCase, useValue: { buscar: async () => [] } },
      ],
    }),
  ],
};

export const CalendarioSinPlanificaciones: Story = {
  ...pantalla('<app-calendario-semanal />'),
  decorators: [
    applicationConfig({
      providers: [
        { provide: PlanificacionRepositoryPort, useValue: { listarTodas: async () => [] } },
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: async () => EJERCICIOS_DEMO } },
      ],
    }),
  ],
};
