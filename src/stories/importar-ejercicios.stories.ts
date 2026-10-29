import { provideLocationMocks } from '@angular/common/testing';
import { AfterViewInit, Component, InjectionToken, ViewChild, inject, provideAppInitializer } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import type { Routes } from '@angular/router';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { routes } from '../app/app.routes';
import { ShellComponent } from '../app/presentation/compartido/shell/shell.component';
import { RepositorioComunPort } from '../app/application/ports/repositorio-comun.port';
import { CategoriaRepositoryPort } from '../app/application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../app/application/ports/ejercicio-repository.port';
import { AjustesRepositoryPort } from '../app/application/ports/ajustes-repository.port';
import type { Categoria } from '../app/domain/categoria/categoria.entity';
import { ProtoImportarEjerciciosComponent } from './prototipos/importar-ejercicios/proto-importar-ejercicios.component';
import { ProtoFichaEjercicioComunComponent } from './prototipos/importar-ejercicios/proto-ficha-ejercicio-comun.component';
import {
  CATEGORIAS_PROPIAS_PARCIALES_DEMO,
  CATEGORIAS_PROPIAS_COMPLETAS_DEMO,
  type ComportamientoBusquedaComunDemo,
  type ComportamientoVistaPreviaDemo,
  crearAjustesRepositoryDemo,
  crearCategoriaRepositoryDemo,
  crearEjercicioRepositoryDemo,
  crearRepositorioComunDemo,
} from './prototipos/importar-ejercicios/datos-demo';

/**
 * Prototipo de Storybook de la pantalla "Importar ejercicios" (Historia de
 * Usuario 1, specs/003-importar-exportar-ejercicios). Se muestra dentro del
 * marco real de la aplicación (cabecera, navegación y márgenes del `Shell`)
 * navegando a las rutas previstas `/ejercicios/importar` y
 * `/ejercicios/importar/:id`. Es un prototipo para revisión y no representa
 * una aprobación ni sustituye la presentación real de la aplicación.
 */

interface DefinicionHistoriaImportar {
  comportamientoBusqueda?: ComportamientoBusquedaComunDemo;
  textoInicial?: string;
  categoriaFiltroInicial?: string | null;
  /** Si es `true`, la historia ejecuta `buscar()` automáticamente al cargar. */
  autoBuscarAlCargar?: boolean;
  /** Nombres de ejercicios a preseleccionar tras la búsqueda automática. */
  seleccionInicialNombres?: string[];
  /** Si es `true`, tras preseleccionar invoca `importar()` (abre el diálogo o el bloqueo correspondiente). */
  intentarImportarAlCargar?: boolean;
  /** Categorías propias del usuario para esta historia (por defecto, las parciales). */
  categoriasPropias?: Categoria[];
}

const HISTORIA_DEMOSTRACION_IMPORTAR = new InjectionToken<DefinicionHistoriaImportar>(
  'HISTORIA_DEMOSTRACION_IMPORTAR_EJERCICIOS'
);

const DEFINICION_POR_CLAVE = {
  inicial: {},
  resultados: {
    autoBuscarAlCargar: true,
    seleccionInicialNombres: ['Sentadilla búlgara', 'Elevación lateral de hombro'],
    categoriasPropias: CATEGORIAS_PROPIAS_PARCIALES_DEMO,
  },
  vacio: {
    autoBuscarAlCargar: true,
    comportamientoBusqueda: 'vacio',
    textoInicial: 'yoga aéreo',
  },
  cargando: {
    autoBuscarAlCargar: true,
    comportamientoBusqueda: 'pendiente',
  },
  error: {
    autoBuscarAlCargar: true,
    comportamientoBusqueda: 'error',
  },
  'dialogo-asignar-categoria': {
    autoBuscarAlCargar: true,
    seleccionInicialNombres: ['Almeja', 'Plancha lateral'],
    intentarImportarAlCargar: true,
    categoriasPropias: CATEGORIAS_PROPIAS_PARCIALES_DEMO,
  },
  'bloqueo-sin-categorias': {
    autoBuscarAlCargar: true,
    seleccionInicialNombres: ['Almeja'],
    intentarImportarAlCargar: true,
    categoriasPropias: [],
  },
} satisfies Record<string, DefinicionHistoriaImportar>;

type ClaveHistoriaImportar = keyof typeof DEFINICION_POR_CLAVE;

@Component({
  selector: 'app-story-importar-ejercicios',
  standalone: true,
  imports: [ProtoImportarEjerciciosComponent],
  template: '<proto-importar-ejercicios />',
})
class PantallaImportarEjerciciosStoryComponent implements AfterViewInit {
  @ViewChild(ProtoImportarEjerciciosComponent) private readonly pantalla!: ProtoImportarEjerciciosComponent;
  protected readonly definicion = inject(HISTORIA_DEMOSTRACION_IMPORTAR);

  async ngAfterViewInit(): Promise<void> {
    const definicion = this.definicion;
    if (definicion.textoInicial) this.pantalla.texto.set(definicion.textoInicial);
    if (definicion.categoriaFiltroInicial !== undefined) this.pantalla.categoriaId.set(definicion.categoriaFiltroInicial);
    if (!definicion.autoBuscarAlCargar) return;

    await this.pantalla.buscar();

    if (definicion.seleccionInicialNombres?.length) {
      const idPorNombre = new Map(this.pantalla.resultados().map((ejercicio) => [ejercicio.nombre, ejercicio.id]));
      const ids = definicion.seleccionInicialNombres
        .map((nombre) => idPorNombre.get(nombre))
        .filter((id): id is string => id !== undefined);
      this.pantalla.seleccionadosIds.set(new Set(ids));
    }

    if (definicion.intentarImportarAlCargar) {
      await this.pantalla.importar();
    }
  }
}

@Component({
  selector: 'app-story-ficha-ejercicio-comun',
  standalone: true,
  imports: [ProtoFichaEjercicioComunComponent],
  template: '<proto-ficha-ejercicio-comun />',
})
class PantallaFichaEjercicioComunStoryComponent {}

// Se antepone a `routes` (en vez de añadirse al final) porque `ejercicios/:id` ya existe y,
// al ir antes en el array, capturaría `/ejercicios/importar` como si "importar" fuese un `id`.
const rutasStorybook: Routes = [
  {
    path: 'ejercicios/importar/:id',
    component: PantallaFichaEjercicioComunStoryComponent,
    title: 'Previsualizar ejercicio',
    pathMatch: 'full',
  },
  {
    path: 'ejercicios/importar',
    component: PantallaImportarEjerciciosStoryComponent,
    title: 'Importar ejercicios',
    pathMatch: 'full',
  },
  ...routes,
];

const meta: Meta = {
  title: 'Physical Exercises/Importar ejercicios',
  decorators: [
    moduleMetadata({
      imports: [ShellComponent, PantallaImportarEjerciciosStoryComponent, PantallaFichaEjercicioComunStoryComponent],
    }),
    applicationConfig({ providers: [provideRouter(rutasStorybook), provideLocationMocks()] }),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Prototipo para revisión de "Importar ejercicios" y su ficha remota de solo lectura ' +
          '(contracts/interfaz-usuario.md). Usa la barra de viewports para ver móvil (390 px), ' +
          'tablet (834 px) y escritorio (1280 px).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;
type Dispositivo = 'movil' | 'tablet' | 'escritorio';

function pantalla(clave: ClaveHistoriaImportar, nombre: string, descripcion: string, dispositivo: Dispositivo): Story {
  const definicion: DefinicionHistoriaImportar = {
    categoriasPropias: CATEGORIAS_PROPIAS_PARCIALES_DEMO,
    ...DEFINICION_POR_CLAVE[clave],
  };
  return {
    name: `Importar ejercicios: ${nombre}`,
    globals: { viewport: { value: dispositivo, isRotated: false } },
    parameters: { docs: { description: { story: descripcion } } },
    decorators: [
      applicationConfig({
        providers: [
          { provide: HISTORIA_DEMOSTRACION_IMPORTAR, useValue: definicion },
          { provide: RepositorioComunPort, useValue: crearRepositorioComunDemo(definicion.comportamientoBusqueda ?? 'normal') },
          { provide: CategoriaRepositoryPort, useValue: crearCategoriaRepositoryDemo(definicion.categoriasPropias ?? []) },
          { provide: EjercicioRepositoryPort, useValue: crearEjercicioRepositoryDemo() },
          { provide: AjustesRepositoryPort, useValue: crearAjustesRepositoryDemo() },
          provideAppInitializer(() => inject(Router).navigateByUrl('/ejercicios/importar')),
        ],
      }),
    ],
    render: () => ({ template: '<app-shell />' }),
  };
}

const DESCRIPCION_INICIAL =
  'Estado antes de la primera búsqueda de la sesión (FR-002/FR-003): buscador de texto, categorías ' +
  'comunes en selección única sin opción "Todas", botón "Buscar" explícito y una zona de resultados ' +
  'neutra que invita a buscar (no es el estado "sin resultados").';
const DESCRIPCION_RESULTADOS =
  'Resultados tras pulsar "Buscar" (FR-004/FR-005): cada fila muestra nombre, descripción y categorías ' +
  'comunes con una casilla independiente de la acción "Ver ficha". Con selección activa aparece, sin necesidad ' +
  'de desplazamiento, la barra de acciones con el botón "Importar" y el recuento (FR-006).';
const DESCRIPCION_VACIO = 'Sin resultados para el texto/categoría indicados, con mensaje orientativo.';
const DESCRIPCION_CARGANDO = 'Mientras se realiza la búsqueda en el repositorio común (FR-040 de 001).';
const DESCRIPCION_ERROR =
  'Repositorio común no disponible o sin conexión (FR-023), con mensaje y acción "Reintentar".';
const DESCRIPCION_DIALOGO =
  'Diálogo "Asignar categoría" (FR-009): una fila por cada categoría común no reconocida entre los ' +
  'ejercicios seleccionados (no una fila por ejercicio), con un selector de categorías propias por fila. ' +
  '"Continuar" permanece deshabilitado hasta resolver todas las filas.';
const DESCRIPCION_BLOQUEO =
  'Si el usuario no tiene ninguna categoría propia creada (FR-010), no se abre el diálogo de mapeo: se ' +
  'muestra un mensaje bloqueante con acceso directo a "Gestionar categorías".';

export const Inicial = pantalla('inicial', 'estado inicial (escritorio)', DESCRIPCION_INICIAL, 'escritorio');
export const InicialTablet = pantalla('inicial', 'estado inicial (tablet)', DESCRIPCION_INICIAL, 'tablet');
export const InicialMovil = pantalla('inicial', 'estado inicial (móvil)', DESCRIPCION_INICIAL, 'movil');

export const ConResultados = pantalla('resultados', 'con resultados y selección (escritorio)', DESCRIPCION_RESULTADOS, 'escritorio');
export const ConResultadosTablet = pantalla('resultados', 'con resultados y selección (tablet)', DESCRIPCION_RESULTADOS, 'tablet');
export const ConResultadosMovil = pantalla('resultados', 'con resultados y selección (móvil)', DESCRIPCION_RESULTADOS, 'movil');

ConResultados.play = async ({ canvas }) => {
  const seleccionAlmeja = canvas.getByRole('checkbox', { name: 'Seleccionar Almeja' });
  await expect(seleccionAlmeja).not.toBeChecked();
  await canvas.getByRole('button', { name: 'Ver ficha de Almeja' }).click();
  await waitFor(() => expect(canvas.getByRole('heading', { name: 'Almeja' })).toBeVisible());
  await expect(seleccionAlmeja).not.toBeChecked();
};

export const Vacio = pantalla('vacio', 'sin resultados (escritorio)', DESCRIPCION_VACIO, 'escritorio');
export const VacioTablet = pantalla('vacio', 'sin resultados (tablet)', DESCRIPCION_VACIO, 'tablet');
export const VacioMovil = pantalla('vacio', 'sin resultados (móvil)', DESCRIPCION_VACIO, 'movil');

export const Cargando = pantalla('cargando', 'cargando (escritorio)', DESCRIPCION_CARGANDO, 'escritorio');
export const CargandoTablet = pantalla('cargando', 'cargando (tablet)', DESCRIPCION_CARGANDO, 'tablet');
export const CargandoMovil = pantalla('cargando', 'cargando (móvil)', DESCRIPCION_CARGANDO, 'movil');

export const ErrorConexion = pantalla('error', 'error de conexión (escritorio)', DESCRIPCION_ERROR, 'escritorio');
export const ErrorConexionTablet = pantalla('error', 'error de conexión (tablet)', DESCRIPCION_ERROR, 'tablet');
export const ErrorConexionMovil = pantalla('error', 'error de conexión (móvil)', DESCRIPCION_ERROR, 'movil');

export const DialogoAsignarCategoria = pantalla(
  'dialogo-asignar-categoria',
  'diálogo Asignar categoría (escritorio)',
  DESCRIPCION_DIALOGO,
  'escritorio'
);
export const DialogoAsignarCategoriaTablet = pantalla(
  'dialogo-asignar-categoria',
  'diálogo Asignar categoría (tablet)',
  DESCRIPCION_DIALOGO,
  'tablet'
);
export const DialogoAsignarCategoriaMovil = pantalla(
  'dialogo-asignar-categoria',
  'diálogo Asignar categoría (móvil)',
  DESCRIPCION_DIALOGO,
  'movil'
);

export const BloqueoSinCategorias = pantalla(
  'bloqueo-sin-categorias',
  'bloqueo sin categorías propias (escritorio)',
  DESCRIPCION_BLOQUEO,
  'escritorio'
);
export const BloqueoSinCategoriasTablet = pantalla(
  'bloqueo-sin-categorias',
  'bloqueo sin categorías propias (tablet)',
  DESCRIPCION_BLOQUEO,
  'tablet'
);
export const BloqueoSinCategoriasMovil = pantalla(
  'bloqueo-sin-categorias',
  'bloqueo sin categorías propias (móvil)',
  DESCRIPCION_BLOQUEO,
  'movil'
);

function fichaRemota(
  dispositivo: Dispositivo,
  comportamiento: ComportamientoVistaPreviaDemo = 'normal',
  nombre = 'ficha remota'
): Story {
  const id = 'almeja';
  return {
    name: `${nombre} (${dispositivo})`,
    globals: { viewport: { value: dispositivo, isRotated: false } },
    parameters: {
      docs: {
        description: {
          story:
            'Ficha remota de solo lectura conforme a contracts/interfaz-usuario.md: presenta descripción, ' +
            'categorías, multimedia y la acción para importar; no contiene campos de edición ni datos de observaciones.',
        },
      },
    },
    decorators: [
      applicationConfig({
        providers: [
          { provide: RepositorioComunPort, useValue: crearRepositorioComunDemo('normal', comportamiento) },
          {
            provide: HISTORIA_DEMOSTRACION_IMPORTAR,
            useValue: { categoriasPropias: CATEGORIAS_PROPIAS_COMPLETAS_DEMO },
          },
          { provide: CategoriaRepositoryPort, useValue: crearCategoriaRepositoryDemo(CATEGORIAS_PROPIAS_COMPLETAS_DEMO) },
          { provide: EjercicioRepositoryPort, useValue: crearEjercicioRepositoryDemo() },
          { provide: AjustesRepositoryPort, useValue: crearAjustesRepositoryDemo() },
          provideAppInitializer(() => inject(Router).navigateByUrl(`/ejercicios/importar/${id}`)),
        ],
      }),
    ],
    render: () => ({ template: '<app-shell />' }),
  };
}

export const FichaRemota = fichaRemota('escritorio');
export const FichaRemotaTablet = fichaRemota('tablet');
export const FichaRemotaMovil = fichaRemota('movil');
export const FichaRemotaCargando = fichaRemota('escritorio', 'cargando', 'ficha remota cargando');
export const FichaRemotaNoEncontrado = fichaRemota('escritorio', 'no-encontrado', 'ficha remota no encontrada');
export const FichaRemotaErrorConexion = fichaRemota('escritorio', 'error', 'ficha remota error de conexión');
export const FichaRemotaImagenOmitida = fichaRemota('escritorio', 'imagen-invalida', 'ficha remota con imagen omitida');
export const FichaRemotaErrorAlCargarImagen = fichaRemota(
  'escritorio',
  'error-imagen',
  'ficha remota error al cargar imagen'
);

FichaRemota.play = async ({ canvas }) => {
  await waitFor(() => expect(canvas.getByRole('heading', { name: 'Almeja' })).toBeVisible());
  await canvas.getByRole('button', { name: 'Importar ejercicio Almeja' }).click();
  await waitFor(() => expect(canvas.getByRole('heading', { name: 'Importar ejercicios' })).toBeVisible());
};
