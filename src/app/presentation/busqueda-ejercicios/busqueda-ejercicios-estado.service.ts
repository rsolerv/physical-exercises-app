import { Injectable, signal } from '@angular/core';

/** Conserva los criterios al abrir una ficha y regresar a Buscar en la misma sesión. */
@Injectable({ providedIn: 'root' })
export class BusquedaEjerciciosEstadoService {
  readonly texto = signal('');
  readonly categoriaIds = signal<string[]>([]);
  readonly pagina = signal(0);
  readonly tamanoPagina = signal(50);
}
