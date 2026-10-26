import { provideLocationMocks } from '@angular/common/testing';
import { inject, provideAppInitializer } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { routes } from '../app/app.routes';
import { ShellComponent } from '../app/presentation/compartido/shell/shell.component';
import { ConflictoSincronizacionEstadoService } from '../app/presentation/sincronizacion/conflicto-sincronizacion-estado.service';
import { EjercicioRepositoryPort } from '../app/application/ports/ejercicio-repository.port';
import { PlanificacionRepositoryPort } from '../app/application/ports/planificacion-repository.port';
import { BuscarEjerciciosUseCase } from '../app/application/casos-uso/buscar-ejercicios.use-case';
import { DEMO_PROVIDERS, EJERCICIOS_DEMO, estadoSinConflicto } from './demo-data';

/**
 * Cada historia muestra la pantalla dentro del marco real de la aplicación (menú, márgenes y
 * navegación) y con las rutas reales, de modo que los enlaces entre pantallas funcionan.
 */
const meta: Meta = {
  title: 'Physical Exercises/Pantallas',
  decorators: [
    moduleMetadata({ imports: [ShellComponent] }),
    applicationConfig({ providers: [provideRouter(routes), provideLocationMocks(), ...DEMO_PROVIDERS] }),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

type Dispositivo = 'movil' | 'tablet' | 'escritorio';

function pantalla(url: string, dispositivo: Dispositivo = 'escritorio', proveedores: unknown[] = []): Story {
  return {
    globals: { viewport: { value: dispositivo, isRotated: false } },
    decorators: [
      applicationConfig({
        providers: [...(proveedores as never[]), provideAppInitializer(() => inject(Router).navigateByUrl(url))],
      }),
    ],
    render: () => ({ template: '<app-shell />' }),
  };
}

export const Hoy = pantalla('/inicio');
export const HoyMovil = pantalla('/inicio', 'movil');
export const HoyTablet = pantalla('/inicio', 'tablet');

export const BuscarEjercicios = pantalla('/buscar');
export const BuscarEjerciciosMovil = pantalla('/buscar', 'movil');

export const PlanificacionSemanal = pantalla('/planificacion');
export const PlanificacionSemanalMovil = pantalla('/planificacion', 'movil');
export const NuevaPlanificacion = pantalla('/planificacion/nueva');
export const NuevaPlanificacionMovil = pantalla('/planificacion/nueva', 'movil');

export const Categorias = pantalla('/ejercicios/categorias');

export const NuevoEjercicio = pantalla('/ejercicios/nuevo');
export const NuevoEjercicioMovil = pantalla('/ejercicios/nuevo', 'movil');
export const EditarEjercicio = pantalla('/ejercicios/sentadilla/editar');
export const FichaDeEjercicio = pantalla('/ejercicios/sentadilla');
export const FichaDeEjercicioMovil = pantalla('/ejercicios/sentadilla', 'movil');

export const ConfiguracionDeSincronizacion = pantalla('/sincronizacion');
export const ConfiguracionDeSincronizacionMovil = pantalla('/sincronizacion', 'movil');
export const ConflictoDeSincronizacion = pantalla('/sincronizacion/conflicto');
export const SinConflictoPendiente = pantalla('/sincronizacion/conflicto', 'escritorio', [
  { provide: ConflictoSincronizacionEstadoService, useValue: estadoSinConflicto() },
]);

export const BibliotecaVacia = pantalla('/buscar', 'escritorio', [
  { provide: EjercicioRepositoryPort, useValue: { listarTodos: async () => [], buscarPorTexto: async () => [], buscarPorCategorias: async () => [] } },
  { provide: BuscarEjerciciosUseCase, useValue: { buscar: async () => [] } },
]);

export const CalendarioSinPlanificaciones = pantalla('/planificacion', 'escritorio', [
  { provide: PlanificacionRepositoryPort, useValue: { listarTodas: async () => [] } },
  { provide: EjercicioRepositoryPort, useValue: { listarTodos: async () => EJERCICIOS_DEMO } },
]);

const NOMBRES: [Story, string][] = [
  [HoyMovil, 'Hoy (móvil)'],
  [HoyTablet, 'Hoy (tablet)'],
  [BuscarEjercicios, 'Buscar ejercicios'],
  [BuscarEjerciciosMovil, 'Buscar ejercicios (móvil)'],
  [PlanificacionSemanal, 'Planificación semanal'],
  [PlanificacionSemanalMovil, 'Planificación semanal (móvil)'],
  [NuevaPlanificacion, 'Nueva planificación'],
  [NuevaPlanificacionMovil, 'Nueva planificación (móvil)'],
  [Categorias, 'Categorías'],
  [NuevoEjercicio, 'Nuevo ejercicio'],
  [NuevoEjercicioMovil, 'Nuevo ejercicio (móvil)'],
  [EditarEjercicio, 'Editar ejercicio'],
  [FichaDeEjercicio, 'Ficha de ejercicio'],
  [FichaDeEjercicioMovil, 'Ficha de ejercicio (móvil)'],
  [ConfiguracionDeSincronizacion, 'Configuración de sincronización'],
  [ConfiguracionDeSincronizacionMovil, 'Configuración de sincronización (móvil)'],
  [ConflictoDeSincronizacion, 'Conflicto de sincronización'],
  [SinConflictoPendiente, 'Sin conflicto pendiente'],
  [BibliotecaVacia, 'Biblioteca vacía'],
  [CalendarioSinPlanificaciones, 'Calendario sin planificaciones'],
];
NOMBRES.forEach(([historia, nombre]) => (historia.name = nombre));
