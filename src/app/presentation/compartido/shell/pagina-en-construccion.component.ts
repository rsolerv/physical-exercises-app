import { Component } from '@angular/core';

/**
 * Página de reserva para las rutas de una historia de usuario que todavía no
 * se ha implementado. Cada historia la sustituye por su propio componente al
 * integrar sus rutas en el shell (p. ej. T048, T061, T082, T108).
 */
@Component({
  selector: 'app-pagina-en-construccion',
  standalone: true,
  template: `<p class="pagina-en-construccion">Esta sección todavía no está disponible.</p>`,
})
export class PaginaEnConstruccionComponent {}
