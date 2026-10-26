import { provideLocationMocks } from '@angular/common/testing';
import { AfterViewInit, Component, InjectionToken, ViewChild, inject, provideAppInitializer } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { AjustesRepositoryPort } from '../app/application/ports/ajustes-repository.port';
import type { AjustesAplicacion } from '../app/application/ports/ajustes-repository.port';
import { routes } from '../app/app.routes';
import { ConfiguracionSincronizacionComponent } from '../app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component';
import { CopiaManualComponent } from '../app/presentation/sincronizacion/copia-manual/copia-manual.component';
import { ShellComponent } from '../app/presentation/compartido/shell/shell.component';
import {
  AJUSTES_SINCRONIZACION_DEMO,
  DEMO_PROVIDERS,
  ajustesSincronizacionDemo,
} from './demo-data';

type EstadoDemostracion =
  | 'sin-configurar'
  | 'conectando'
  | 'conectado'
  | 'sincronizando'
  | 'sincronizado'
  | 'error'
  | 'reconectar'
  | 'confirmar-desconexion'
  | 'cancelada-y-ventana-bloqueada'
  | 'github-activo'
  | 'confirmar-importacion'
  | 'fichero-no-valido';

const ESTADO_DEMOSTRACION = new InjectionToken<EstadoDemostracion>('ESTADO_DEMOSTRACION_SINCRONIZACION');

@Component({
  selector: 'app-story-sincronizacion',
  standalone: true,
  imports: [ConfiguracionSincronizacionComponent],
  template: '<app-configuracion-sincronizacion />',
})
class PantallaSincronizacionStoryComponent implements AfterViewInit {
  @ViewChild(ConfiguracionSincronizacionComponent) private readonly pantalla!: ConfiguracionSincronizacionComponent;
  @ViewChild(CopiaManualComponent) private readonly copiaManual!: CopiaManualComponent;
  private readonly estado = inject(ESTADO_DEMOSTRACION, { optional: true }) ?? 'sin-configurar';

  ngAfterViewInit(): void {
    switch (this.estado) {
      case 'conectando':
        this.pantalla.conectando.set(true);
        break;
      case 'conectado':
        break;
      case 'sincronizando':
        this.pantalla.sincronizando.set(true);
        break;
      case 'sincronizado':
        this.pantalla.resultadoSincronizacion.set('sincronizado');
        break;
      case 'error':
        this.pantalla.resultadoSincronizacion.set('error');
        this.pantalla.mensajeError.set('No hay conexión. Comprueba tu conexión e inténtalo de nuevo.');
        break;
      case 'reconectar':
        this.pantalla.requiereReconectar.set(true);
        this.pantalla.resultadoSincronizacion.set('error');
        break;
      case 'confirmar-desconexion':
        this.pantalla.confirmandoDesconexion.set(true);
        break;
      case 'cancelada-y-ventana-bloqueada':
        this.pantalla.resultadoSincronizacion.set('error');
        this.pantalla.mensajeError.set('La conexión no se ha completado. Si la ventana no se abrió, permite las ventanas emergentes del navegador.');
        break;
      case 'confirmar-importacion':
        this.copiaManual.confirmacionImportacion.set(true);
        break;
      case 'fichero-no-valido':
        this.copiaManual.error.set('El fichero no es una copia de seguridad válida.');
        break;
      case 'github-activo':
      case 'sin-configurar':
        break;
    }
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
        component: 'Historias de la pantalla real de sincronización dentro de la navegación de la aplicación.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;
type Dispositivo = 'movil' | 'tablet' | 'escritorio';

function ajustesDemo(estado: EstadoDemostracion): AjustesAplicacion {
  if (estado === 'github-activo') {
    return ajustesSincronizacionDemo({
      tokenGitHub: 'demo-token-oculto',
      repositorioGitHub: 'raquel/ejercicios-privado',
      metodoSincronizacion: 'github',
    });
  }
  if (['conectado', 'sincronizando', 'sincronizado', 'error', 'reconectar', 'confirmar-desconexion'].includes(estado)) {
    return ajustesSincronizacionDemo({
      metodoSincronizacion: 'google',
      cuentaGoogle: 'raquel@example.com',
      ultimaSincronizacionCorrecta: estado === 'sincronizado' ? new Date('2026-10-26T10:30:00.000Z') : null,
    });
  }
  return AJUSTES_SINCRONIZACION_DEMO;
}

function pantalla(estado: EstadoDemostracion, nombre: string, dispositivo: Dispositivo = 'escritorio'): Story {
  const url = estado === 'error' ? '/sincronizacion' : '/sincronizacion';
  return {
    name: `Sincronización: ${nombre}`,
    globals: { viewport: { value: dispositivo, isRotated: false } },
    decorators: [
      applicationConfig({
        providers: [
          { provide: ESTADO_DEMOSTRACION, useValue: estado },
          {
            provide: AjustesRepositoryPort,
            useValue: repositorioAjustes(ajustesDemo(estado)),
          },
          provideAppInitializer(() => inject(Router).navigateByUrl(url)),
        ],
      }),
    ],
    render: () => ({ template: '<app-shell />' }),
  };
}

function repositorioAjustes(ajustes: AjustesAplicacion) {
  return {
    obtener: async () => ajustes,
    guardarCredencialesGitHub: async () => undefined,
    olvidarCredencialesGitHub: async () => undefined,
    conectarGoogle: async () => undefined,
    desconectarGoogle: async () => undefined,
    actualizarUltimaVersionSincronizada: async () => undefined,
    registrarDestinoSincronizado: async () => undefined,
    registrarSincronizacionCorrecta: async () => undefined,
    marcarCambiosLocalesPendientes: async () => undefined,
    estaCatalogoPredefinidoCargado: async () => true,
    marcarCatalogoPredefinidoCargado: async () => undefined,
  };
}

export const SinConfigurar = pantalla('sin-configurar', 'sin configurar', 'movil');
export const Conectando = pantalla('conectando', 'conectando');
export const GoogleConectado = pantalla('conectado', 'Google conectado');
export const Sincronizando = pantalla('sincronizando', 'sincronizando');
export const Sincronizado = pantalla('sincronizado', 'sincronizado');
export const ErrorDeConexion = pantalla('error', 'error de conexión');
export const VolverAConectar = pantalla('reconectar', 'volver a conectar');
export const ConfirmarDesconexion = pantalla('confirmar-desconexion', 'confirmar desconexión');
export const ConexionCanceladaYVentanaBloqueada = pantalla(
  'cancelada-y-ventana-bloqueada',
  'conexión cancelada y ventana bloqueada',
);
export const GitHubComoMetodoActivo = pantalla('github-activo', 'GitHub como método activo');
export const ConfirmarImportacion = pantalla('confirmar-importacion', 'confirmar importación');
export const FicheroNoValido = pantalla('fichero-no-valido', 'fichero no válido');
export const Conflicto = {
  ...pantalla('conectado', 'conflicto'),
  decorators: [
    applicationConfig({
      providers: [
        { provide: AjustesRepositoryPort, useValue: repositorioAjustes(ajustesSincronizacionDemo({ metodoSincronizacion: 'google', cuentaGoogle: 'raquel@example.com' })) },
        provideAppInitializer(() => inject(Router).navigateByUrl('/sincronizacion/conflicto')),
      ],
    }),
  ],
};
