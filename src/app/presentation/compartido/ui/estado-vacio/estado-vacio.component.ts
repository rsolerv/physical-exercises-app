import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Estado vacío compartido (FR-003): icono decorativo + mensaje orientativo +
 * acción opcional proyectada. Componente de presentación puro reutilizado
 * por las vistas funcionales cuando no hay contenido que mostrar.
 */
@Component({
  selector: 'app-estado-vacio',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './estado-vacio.component.html',
  styleUrl: './estado-vacio.component.scss',
})
export class EstadoVacioComponent {
  readonly icono = input.required<string>();
  readonly mensaje = input.required<string>();
}
