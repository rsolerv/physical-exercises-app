import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MENU_PRINCIPAL } from './menu-principal';

/**
 * Shell de navegación compartido por toda la aplicación: barra superior,
 * menú lateral responsive (se oculta en pantallas pequeñas, FR-026/Principio
 * IV) y `router-outlet` donde se renderiza cada historia de usuario.
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
}
