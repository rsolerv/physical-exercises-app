import { provideLocationMocks } from '@angular/common/testing';
import { AfterViewInit, Component, ViewChild, inject, provideAppInitializer } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import type { Routes } from '@angular/router';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { routes } from '../app/app.routes';
import { ShellComponent } from '../app/presentation/compartido/shell/shell.component';
import { DEMO_PROVIDERS } from './demo-data';
import {
  ProtoPaginacionEjerciciosComponent,
  type EscenarioPaginacion,
} from './prototipos/paginacion-ejercicios/proto-paginacion-ejercicios.component';

/**
 * PROTOTIPO SOLO STORYBOOK. /buscar conserva su URL; la ruta contextual
 * /planificacion/:id/agregar/:dia existe únicamente en este router de historias
 * para aislar Agregar ejercicios; el constructor real NO se sustituye.
 * No representa la pantalla implementada ni una aprobación de su diseño.
 */
@Component({
  selector: 'app-story-buscar-paginado',
  standalone: true,
  imports: [ProtoPaginacionEjerciciosComponent],
  template: '<app-proto-paginacion-ejercicios [escenario]="escenario" />',
})
class PantallaPaginadaStory implements AfterViewInit {
  @ViewChild(ProtoPaginacionEjerciciosComponent) private prototipo!: ProtoPaginacionEjerciciosComponent;
  protected get escenario(): EscenarioPaginacion { return escenarioActivo; }
  ngAfterViewInit(): void { this.prototipo.configurar(); }
}

let escenarioActivo: EscenarioPaginacion = { modo: 'buscar', total: 125 };

const rutasPrototipo: Routes = [
  { path: 'buscar', component: PantallaPaginadaStory, title: 'Buscar ejercicios' },
  { path: 'planificacion/:id/agregar/:dia', component: PantallaPaginadaStory, title: 'Agregar ejercicio' },
  ...routes,
];

const meta: Meta = {
  title: 'Physical Exercises/Paginación de ejercicios (prototipo)',
  decorators: [
    moduleMetadata({ imports: [ShellComponent, PantallaPaginadaStory] }),
    applicationConfig({ providers: [provideLocationMocks(), ...DEMO_PROVIDERS] }),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: { description: { component: 'Exploración visual aislada del paginador de Buscar y la carga acumulativa del selector. No modifica la aplicación real. Los tamaños 390, 834 y 1280 px usan el shell existente.' } },
  },
};
export default meta;
type Story = StoryObj;
type Dispositivo = 'movil' | 'tablet' | 'escritorio';

function pantalla(escenario: EscenarioPaginacion, dispositivo: Dispositivo): Story {
  const ruta = escenario.modo === 'buscar' ? '/buscar' : `/planificacion/plan-semanal/agregar/${escenario.dia ?? 'lunes'}`;
  return {
    globals: { viewport: { value: dispositivo, isRotated: false } },
    decorators: [applicationConfig({ providers: [
      provideRouter(rutasPrototipo),
      provideAppInitializer(() => inject(Router).navigateByUrl(ruta)),
    ] })],
    render: () => {
      escenarioActivo = escenario;
      return { template: '<app-shell />' };
    },
  };
}

// Buscar: rango, tamaños, límites, navegación y estados de carga.
export const Buscar125Escritorio = pantalla({ modo: 'buscar', total: 125 }, 'escritorio');
export const Buscar125Tablet = pantalla({ modo: 'buscar', total: 125 }, 'tablet');
export const Buscar125Movil = pantalla({ modo: 'buscar', total: 125 }, 'movil');
export const BuscarPaginaIntermedia = pantalla({ modo: 'buscar', total: 125, pagina: 1 }, 'escritorio');
export const BuscarUltimaPagina = pantalla({ modo: 'buscar', total: 125, pagina: 2 }, 'escritorio');
export const Buscar25PorPagina = pantalla({ modo: 'buscar', total: 125, tamano: 25, pagina: 1 }, 'tablet');
export const Buscar100PorPagina = pantalla({ modo: 'buscar', total: 125, tamano: 100 }, 'escritorio');
export const BuscarSinEjercicios = pantalla({ modo: 'buscar', total: 0 }, 'movil');
export const Buscar49 = pantalla({ modo: 'buscar', total: 49 }, 'escritorio');
export const Buscar50 = pantalla({ modo: 'buscar', total: 50 }, 'tablet');
export const Buscar51 = pantalla({ modo: 'buscar', total: 51 }, 'movil');
export const BuscarCargaInicial = pantalla({ modo: 'buscar', total: 125, estado: 'carga-inicial' }, 'movil');
export const BuscarCargandoPagina = pantalla({ modo: 'buscar', total: 125, estado: 'carga-adicional' }, 'escritorio');
export const BuscarErrorYReintento = pantalla({ modo: 'buscar', total: 125, estado: 'error-adicional' }, 'tablet');
export const BuscarErrorInicial = pantalla({ modo: 'buscar', total: 125, estado: 'error-inicial' }, 'movil');

// Solo Agregar ejercicios: el resto de planificación se mantiene sin cambios.
export const Selector125Escritorio = pantalla({ modo: 'selector', total: 125, dia: 'lunes', asignados: [0, 62] }, 'escritorio');
export const Selector125Tablet = pantalla({ modo: 'selector', total: 125, dia: 'lunes', asignados: [0, 62] }, 'tablet');
export const Selector125Movil = pantalla({ modo: 'selector', total: 125, dia: 'lunes', asignados: [0, 62] }, 'movil');
export const SelectorBloqueIntermedio = pantalla({ modo: 'selector', total: 125, bloques: 2, asignados: [0, 62] }, 'tablet');
export const SelectorUltimoBloque = pantalla({ modo: 'selector', total: 125, bloques: 3, asignados: [0, 62] }, 'escritorio');
export const SelectorMartes = pantalla({ modo: 'selector', total: 125, dia: 'martes', asignados: [4] }, 'movil');
export const SelectorSinEjercicios = pantalla({ modo: 'selector', total: 0, asignados: [100] }, 'movil');
export const Selector49 = pantalla({ modo: 'selector', total: 49 }, 'tablet');
export const Selector50 = pantalla({ modo: 'selector', total: 50 }, 'escritorio');
export const Selector51 = pantalla({ modo: 'selector', total: 51 }, 'movil');
export const SelectorCargaInicial = pantalla({ modo: 'selector', total: 125, estado: 'carga-inicial' }, 'tablet');
export const SelectorCargandoMas = pantalla({ modo: 'selector', total: 125, estado: 'carga-adicional', asignados: [0, 62] }, 'movil');
export const SelectorErrorYReintento = pantalla({ modo: 'selector', total: 125, estado: 'error-adicional', asignados: [0, 62] }, 'movil');
export const SelectorExito = pantalla({ modo: 'selector', total: 125, bloques: 2, estado: 'exito', asignados: [0, 62] }, 'escritorio');
