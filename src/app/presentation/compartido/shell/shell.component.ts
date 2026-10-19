import { Component, HostListener, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
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
  readonly menuLateral = viewChild<MatSidenav>('menuLateral');
  readonly esMovil = signal(this.calcularSiEsMovil());
  readonly menuAbierto = signal(!this.esMovil());

  private calcularSiEsMovil(): boolean {
    if (typeof window === 'undefined') return false;
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(max-width: 599px)').matches;
    }
    return window.innerWidth <= 599;
  }

  @HostListener('window:resize')
  actualizarModoResponsive(): void {
    const esMovil = this.calcularSiEsMovil();
    if (esMovil === this.esMovil()) return;
    this.esMovil.set(esMovil);
    const abierto = !esMovil;
    this.menuAbierto.set(abierto);
    if (abierto) {
      void this.menuLateral()?.open();
    } else {
      void this.menuLateral()?.close();
    }
  }

  cerrarMenuMovil(): void {
    if (this.esMovil()) {
      this.menuAbierto.set(false);
      void this.menuLateral()?.close();
    }
  }
}
