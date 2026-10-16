import { Component } from '@angular/core';
import { CabeceraPaginaComponent } from '../ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../ui/estado-vacio/estado-vacio.component';

/**
 * Página de reserva para las rutas de una historia de usuario que todavía no
 * se ha implementado. Cada historia la sustituye por su propio componente al
 * integrar sus rutas en el shell (p. ej. T048, T061, T082, T108). Usa los
 * mismos componentes de presentación compartidos (FR-013) para que el
 * "próximamente" tenga el mismo acabado visual que el resto de la app.
 */
@Component({
  selector: 'app-pagina-en-construccion',
  standalone: true,
  imports: [CabeceraPaginaComponent, EstadoVacioComponent],
  template: `
    <app-cabecera-pagina titulo="Próximamente" />
    <app-estado-vacio icono="construction" mensaje="Esta sección todavía no está disponible." />
  `,
})
export class PaginaEnConstruccionComponent {}

