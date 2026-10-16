import { Component, input } from '@angular/core';

/**
 * Cabecera de página compartida por toda la aplicación (FR-001): título
 * visible más una zona de acciones principales proyectada por cada pantalla.
 * Componente de presentación puro, sin lógica de negocio.
 */
@Component({
  selector: 'app-cabecera-pagina',
  standalone: true,
  templateUrl: './cabecera-pagina.component.html',
  styleUrl: './cabecera-pagina.component.scss',
})
export class CabeceraPaginaComponent {
  readonly titulo = input.required<string>();
  readonly descripcion = input<string>();
}
