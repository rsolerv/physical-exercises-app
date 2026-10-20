import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-estado-carga',
  standalone: true,
  templateUrl: './estado-carga.component.html',
  styleUrl: './estado-carga.component.scss',
})
export class EstadoCargaComponent {
  readonly mensaje = input('Cargando contenido');
  readonly cantidad = input(3);
  readonly elementos = computed(() => Array.from({ length: this.cantidad() }, (_, indice) => indice));
}
