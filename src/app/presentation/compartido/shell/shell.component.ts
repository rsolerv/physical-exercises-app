import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MENU_PRINCIPAL } from './menu-principal';

/**
 * Shell de navegación compartido por toda la aplicación: barra superior,
 * menú lateral responsive (se oculta en pantallas pequeñas, FR-010/FR-011,
 * Principio IV) y `router-outlet` donde se renderiza cada historia de
 * usuario.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly entradasMenu = MENU_PRINCIPAL;

  /**
   * Estado de apertura del menú lateral: abierto por defecto en escritorio,
   * cerrado por defecto en móvil (FR-010). Se calcula una sola vez al
   * construir el componente a partir del ancho de viewport; los cambios
   * posteriores (toggle manual) los gestiona el propio `mat-sidenav`.
   */
  readonly menuAbierto = signal(this.calcularAberturaInicial());

  private calcularAberturaInicial(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return true;
    }
    return window.matchMedia('(min-width: 768px)').matches;
  }
}

