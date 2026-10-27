import { provideRouter } from '@angular/router';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MatButtonModule } from '@angular/material/button';
import { CabeceraPaginaComponent } from '../app/presentation/compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoCargaComponent } from '../app/presentation/compartido/ui/estado-carga/estado-carga.component';
import { EstadoVacioComponent } from '../app/presentation/compartido/ui/estado-vacio/estado-vacio.component';
import { ShellComponent } from '../app/presentation/compartido/shell/shell.component';
import { ProgresoDiarioComponent } from '../app/presentation/progreso-diario/progreso-diario.component';
import { EnlaceEmbedComponent } from '../app/presentation/compartido/embebidos/enlace-embed.component';
import { YoutubeEmbedComponent } from '../app/presentation/compartido/embebidos/youtube-embed.component';
import { DiaActualComponent } from '../app/presentation/planificacion-semanal/dia-actual/dia-actual.component';
import { DEMO_PROVIDERS, EJERCICIOS_DEMO } from './demo-data';

const meta: Meta = {
  title: 'Physical Exercises/Componentes',
  decorators: [
    moduleMetadata({
      imports: [
        MatButtonModule,
        CabeceraPaginaComponent,
        EstadoCargaComponent,
        EstadoVacioComponent,
        ShellComponent,
        DiaActualComponent,
        ProgresoDiarioComponent,
        EnlaceEmbedComponent,
        YoutubeEmbedComponent,
      ],
    }),
    applicationConfig({
      providers: [
        provideRouter([{ path: '**', component: DiaActualComponent }]),
        ...DEMO_PROVIDERS,
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Shell = story('<app-shell />');

export const CabeceraPagina = story(`
  <main style="padding: 24px">
    <app-cabecera-pagina titulo="Planificación semanal" descripcion="Consulta y organiza tus planificaciones y plantillas.">
      <a acciones mat-stroked-button href="/planificacion/nueva">Nueva planificación</a>
    </app-cabecera-pagina>
  </main>
`);

export const EstadoDeCarga = story(`
  <main style="max-width: 640px; margin: 0 auto; padding: 24px">
    <app-estado-carga mensaje="Cargando ejercicios" [cantidad]="4" />
  </main>
`);

export const EstadoVacio = story(`
  <main style="max-width: 640px; margin: 0 auto; padding: 24px">
    <app-estado-vacio icono="search_off" mensaje="No se han encontrado ejercicios con los criterios seleccionados." />
  </main>
`);

export const ProgresoDiario: Story = {
  render: () => ({
    template: '<main style="max-width: 760px; margin: 0 auto; padding: 24px"><app-progreso-diario [fecha]="fecha" [ejercicios]="ejercicios" /></main>',
    props: { fecha: new Date(), ejercicios: EJERCICIOS_DEMO.slice(0, 2) },
  }),
};

export const VideoDeYouTube = story('<main style="max-width: 760px; margin: 0 auto; padding: 24px"><app-youtube-embed url="https://www.youtube.com/watch?v=invalid" titulo="Vídeo no disponible" /></main>');

export const EnlaceWebExterno = story('<main style="max-width: 760px; margin: 0 auto; padding: 24px"><app-enlace-embed url="https://example.com" /></main>');

function story(template: string): Story {
  return { render: () => ({ template }) };
}
