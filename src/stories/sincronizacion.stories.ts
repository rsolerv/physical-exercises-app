import { provideLocationMocks } from '@angular/common/testing';
import { AfterViewInit, Component, ElementRef, InjectionToken, ViewChild, inject, provideAppInitializer } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { strToU8, zipSync } from 'fflate';
import { AjustesRepositoryPort } from '../app/application/ports/ajustes-repository.port';
import type { AjustesAplicacion } from '../app/application/ports/ajustes-repository.port';
import { GestionarConexionSincronizacionUseCase } from '../app/application/casos-uso/gestionar-conexion-sincronizacion.use-case';
import { routes } from '../app/app.routes';
import { ConfiguracionSincronizacionComponent } from '../app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component';
import { ShellComponent } from '../app/presentation/compartido/shell/shell.component';
import { DEMO_PROVIDERS, ajustesSincronizacionDemo } from './demo-data';

const CUENTA_GOOGLE = 'raquel@example.com';
const REPOSITORIO_GITHUB = 'raquel/ejercicios-privado';
const ULTIMA_SINCRONIZACION = new Date('2026-10-27T17:55:00.000Z');

type EstadoResultado = 'sincronizado' | 'error' | 'conflicto';
type CopiaManualDemostracion = 'confirmar-importacion' | 'fichero-no-valido';

interface DefinicionHistoria {
  ajustes: AjustesAplicacion;
  conectandoGoogle?: boolean;
  sincronizando?: boolean;
  resultado?: EstadoResultado;
  mensajeError?: string;
  requiereReconectar?: boolean;
  confirmarDesconexion?: boolean;
  avisoCambioMetodo?: 'google' | 'github';
  copiaManual?: CopiaManualDemostracion;
}

function ajustes(overrides: Partial<AjustesAplicacion> = {}): AjustesAplicacion {
  return ajustesSincronizacionDemo(overrides);
}

const SIN_METODOS = ajustes();
const SOLO_GOOGLE = ajustes({ metodoSincronizacion: 'google', cuentaGoogle: CUENTA_GOOGLE });
const AMBOS_CONECTADOS = ajustes({
  metodoSincronizacion: 'google',
  cuentaGoogle: CUENTA_GOOGLE,
  tokenGitHub: 'token-de-demostracion',
  repositorioGitHub: REPOSITORIO_GITHUB,
  ultimaSincronizacionCorrecta: ULTIMA_SINCRONIZACION,
});

const DEFINICION_POR_CLAVE = {
  'sin-configurar': { ajustes: SIN_METODOS },
  conectando: { ajustes: SIN_METODOS, conectandoGoogle: true },
  conectado: { ajustes: SOLO_GOOGLE },
  sincronizando: { ajustes: SOLO_GOOGLE, sincronizando: true },
  sincronizado: {
    ajustes: ajustes({ ...SOLO_GOOGLE, ultimaSincronizacionCorrecta: ULTIMA_SINCRONIZACION }),
    resultado: 'sincronizado',
  },
  error: {
    ajustes: SOLO_GOOGLE,
    resultado: 'error',
    mensajeError: 'No hay conexión. Comprueba tu conexión e inténtalo de nuevo.',
  },
  reconectar: { ajustes: SOLO_GOOGLE, requiereReconectar: true, resultado: 'error' },
  'confirmar-desconexion': { ajustes: SOLO_GOOGLE, confirmarDesconexion: true },
  'cancelada-y-ventana-bloqueada': {
    ajustes: SIN_METODOS,
    resultado: 'error',
    mensajeError:
      'La conexión no se ha completado. Tus datos no han cambiado. Puedes volver a intentarlo. ' +
      'Si tu navegador ha bloqueado la ventana de Google, permítela e inténtalo de nuevo.',
  },
  'github-activo': {
    ajustes: ajustes({
      tokenGitHub: 'token-de-demostracion',
      repositorioGitHub: REPOSITORIO_GITHUB,
      metodoSincronizacion: 'github',
      ultimaSincronizacionCorrecta: ULTIMA_SINCRONIZACION,
    }),
  },
  'google-activo-github-conectado': { ajustes: AMBOS_CONECTADOS },
  'github-activo-google-conectado': {
    ajustes: ajustes({ ...AMBOS_CONECTADOS, metodoSincronizacion: 'github' }),
  },
  'cambio-de-metodo': { ajustes: AMBOS_CONECTADOS, avisoCambioMetodo: 'google' },
  'sin-metodo-activo': {
    ajustes: ajustes({ cuentaGoogle: CUENTA_GOOGLE, metodoSincronizacion: null }),
  },
  'confirmar-importacion': { ajustes: SIN_METODOS, copiaManual: 'confirmar-importacion' },
  'fichero-no-valido': { ajustes: SIN_METODOS, copiaManual: 'fichero-no-valido' },
} satisfies Record<string, DefinicionHistoria>;

type ClaveHistoria = keyof typeof DEFINICION_POR_CLAVE;

const HISTORIA_DEMOSTRACION = new InjectionToken<DefinicionHistoria>('HISTORIA_DEMOSTRACION_SINCRONIZACION');

function crearRepositorioAjustes(estadoInicial: AjustesAplicacion) {
  let estado = estadoInicial;
  return {
    obtener: async () => estado,
    guardarCredencialesGitHub: async (token: string, repositorio: string) => {
      const activarGitHub = !estado.tokenGitHub || !estado.repositorioGitHub || !estado.metodoSincronizacion;
      estado = {
        ...estado,
        tokenGitHub: token,
        repositorioGitHub: repositorio,
        metodoSincronizacion: activarGitHub ? 'github' : estado.metodoSincronizacion,
      };
    },
    olvidarCredencialesGitHub: async () => {
      estado = {
        ...estado,
        tokenGitHub: null,
        repositorioGitHub: null,
        metodoSincronizacion: estado.metodoSincronizacion === 'github' ? null : estado.metodoSincronizacion,
      };
    },
    conectarGoogle: async (correo: string) => {
      estado = { ...estado, metodoSincronizacion: 'google', cuentaGoogle: correo };
    },
    desconectarGoogle: async () => {
      estado = {
        ...estado,
        cuentaGoogle: null,
        metodoSincronizacion: estado.metodoSincronizacion === 'google' ? null : estado.metodoSincronizacion,
      };
    },
    activarMetodo: async (metodo: 'github' | 'google') => {
      estado = { ...estado, metodoSincronizacion: metodo };
    },
    registrarSincronizacionCompletada: async () => undefined,
    marcarCambiosLocalesPendientes: async () => undefined,
    estaCatalogoPredefinidoCargado: async () => true,
    marcarCatalogoPredefinidoCargado: async () => undefined,
  };
}

@Component({
  selector: 'app-story-sincronizacion',
  standalone: true,
  imports: [ConfiguracionSincronizacionComponent],
  template: '<app-configuracion-sincronizacion />',
})
class PantallaSincronizacionStoryComponent implements AfterViewInit {
  @ViewChild(ConfiguracionSincronizacionComponent) private readonly pantalla!: ConfiguracionSincronizacionComponent;

  private readonly elemento = inject(ElementRef<HTMLElement>);
  protected readonly definicion = inject(HISTORIA_DEMOSTRACION);

  ngAfterViewInit(): void {
    const estado = this.definicion;
    if (estado.conectandoGoogle) this.pantalla.conectando.set(true);
    if (estado.sincronizando) this.pantalla.sincronizando.set(true);
    if (estado.resultado) this.pantalla.resultadoSincronizacion.set(estado.resultado);
    if (estado.mensajeError) this.pantalla.mensajeError.set(estado.mensajeError);
    if (estado.requiereReconectar) this.pantalla.requiereReconectar.set(true);
    if (estado.confirmarDesconexion) this.pantalla.confirmandoDesconexion.set(true);
    if (estado.avisoCambioMetodo) {
      this.pantalla.mensajeCambioMetodo.set(
        `Ahora sincronizas con ${estado.avisoCambioMetodo === 'google' ? 'Google' : 'GitHub'}.`,
      );
    }
    if (estado.copiaManual) void this.prepararCopiaManual(estado.copiaManual);
  }

  private async prepararCopiaManual(estado: CopiaManualDemostracion): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const candidato = this.elemento.nativeElement.querySelector('app-copia-manual input[type="file"]');
    if (!(candidato instanceof HTMLInputElement)) return;
    const selector = candidato;

    const archivos =
      estado === 'confirmar-importacion'
        ? zipSync({
            'datos.json': strToU8(
              JSON.stringify({ version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] }),
            ),
          })
        : strToU8('fichero no válido');
    const fichero = new File([archivos], 'copia-demo.zip', { type: 'application/zip' });
    const transferencia = new DataTransfer();
    transferencia.items.add(fichero);
    selector.files = transferencia.files;
    selector.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

const rutasStorybook = routes.map((ruta) =>
  ruta.path === 'sincronizacion' ? { ...ruta, component: PantallaSincronizacionStoryComponent } : ruta,
);

const meta: Meta = {
  title: 'Physical Exercises/Sincronización',
  decorators: [
    moduleMetadata({ imports: [ShellComponent, PantallaSincronizacionStoryComponent] }),
    applicationConfig({
      providers: [
        provideRouter(rutasStorybook),
        provideLocationMocks(),
        ...DEMO_PROVIDERS,
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Pantalla real de sincronización dentro de la navegación de la aplicación. ' +
          'Usa la barra de viewports para ver móvil (390 px), tablet (834 px) y escritorio (1280 px).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;
type Dispositivo = 'movil' | 'tablet' | 'escritorio';

function pantalla(clave: ClaveHistoria, nombre: string, descripcion: string, dispositivo: Dispositivo = 'escritorio'): Story {
  const definicion = DEFINICION_POR_CLAVE[clave];
  const repositorio = crearRepositorioAjustes(definicion.ajustes);
  return {
    name: `Sincronización: ${nombre}`,
    globals: { viewport: { value: dispositivo, isRotated: false } },
    parameters: { docs: { description: { story: descripcion } } },
    decorators: [
      applicationConfig({
        providers: [
          { provide: HISTORIA_DEMOSTRACION, useValue: definicion },
          {
            provide: AjustesRepositoryPort,
            useValue: repositorio,
          },
          {
            provide: GestionarConexionSincronizacionUseCase,
            useValue: {
              conectarGoogle: async () => {
                await repositorio.conectarGoogle(CUENTA_GOOGLE);
                return { correo: CUENTA_GOOGLE, nombre: 'Raquel' };
              },
              activarMetodo: repositorio.activarMetodo,
              desconectar: repositorio.desconectarGoogle,
            },
          },
          provideAppInitializer(() => inject(Router).navigateByUrl('/sincronizacion')),
        ],
      }),
    ],
    render: () => ({ template: '<app-shell />' }),
  };
}

export const SinConfigurar = pantalla(
  'sin-configurar',
  'sin configurar',
  'Ningún método conectado: ambos muestran «Sin configurar» y no aparece la acción común.',
  'movil',
);
export const Conectando = pantalla('conectando', 'conectando', 'Conexión con Google en curso: indicador de progreso y botón deshabilitado.');
export const GoogleConectado = pantalla(
  'conectado',
  'Google conectado',
  'Google conectado y activo; muestra la cuenta, el estado y la acción común de sincronización.',
);
export const Sincronizando = pantalla('sincronizando', 'sincronizando', 'Sincronización en curso: estado «Sincronizando…» y acciones deshabilitadas.');
export const Sincronizado = pantalla('sincronizado', 'sincronizado', 'Sincronización correcta: estado «Sincronizado», fecha y confirmación visible.');
export const ErrorDeConexion = pantalla('error', 'error de conexión', 'Error de conexión junto a la acción común, que pasa a «Reintentar».');
export const VolverAConectar = pantalla('reconectar', 'volver a conectar', 'Conexión caducada con Google como método activo: aviso y «Volver a conectar».');
export const ConfirmarDesconexion = pantalla('confirmar-desconexion', 'confirmar desconexión', 'Confirmación en línea antes de desconectar la cuenta.');
export const ConexionCanceladaYVentanaBloqueada = pantalla(
  'cancelada-y-ventana-bloqueada',
  'conexión cancelada y ventana bloqueada',
  'Mensajes de conexión cancelada y de ventana bloqueada junto a «Reintentar».',
);
export const GitHubComoMetodoActivo = pantalla(
  'github-activo',
  'GitHub como método activo',
  'GitHub es el método activo, las opciones avanzadas aparecen desplegadas y «Conectar con Google» sigue disponible.',
);
export const GoogleActivoYGitHubConectado = pantalla(
  'google-activo-github-conectado',
  'Google activo y GitHub conectado',
  'Google muestra «Método activo» y GitHub «Conectado», con la acción para cambiar de método.',
);
export const GitHubActivoYGoogleConectado = pantalla(
  'github-activo-google-conectado',
  'GitHub activo y Google conectado',
  'Etiquetas invertidas; no se muestra aviso de reconexión de Google con GitHub activo.',
);
export const CambioDeMetodo = pantalla(
  'cambio-de-metodo',
  'cambio de método',
  'Aviso accesible «Ahora sincronizas con Google.» tras cambiar el método.',
);
export const SinMetodoActivoConUnoConectado = pantalla(
  'sin-metodo-activo',
  'sin método activo con uno conectado',
  'Aviso para elegir método, sin acción de sincronizar y con «Usar este método».',
);
export const ConfirmarImportacion = pantalla(
  'confirmar-importacion',
  'confirmar importación',
  'La copia de seguridad muestra una confirmación antes de reemplazar datos.',
);
export const FicheroNoValido = pantalla(
  'fichero-no-valido',
  'fichero no válido',
  'La copia de seguridad muestra un error junto al control cuando el ZIP no es válido.',
);
export const Conflicto = {
  name: 'Sincronización: conflicto',
  globals: { viewport: { value: 'escritorio', isRotated: false } },
  parameters: {
    docs: { description: { story: 'Pantalla real de resolución de conflicto con «Usar los datos de Google».' } },
  },
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AjustesRepositoryPort,
          useValue: crearRepositorioAjustes(ajustes({ metodoSincronizacion: 'google', cuentaGoogle: CUENTA_GOOGLE })),
        },
        provideAppInitializer(() => inject(Router).navigateByUrl('/sincronizacion/conflicto')),
      ],
    }),
  ],
  render: () => ({ template: '<app-shell />' }),
} satisfies Story;
