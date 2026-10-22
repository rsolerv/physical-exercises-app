import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ACCESO_NUEVO_EJERCICIO,
  MENU_MOVIL,
  MENU_PRINCIPAL,
  SECCIONES_MENU,
} from './menu-principal';

const VERSION_APLICACION = '0.0.0';

@Component({
  selector: 'app-panel-mas',
  standalone: true,
  imports: [RouterLink, MatBottomSheetModule, MatButtonModule, MatIconModule],
  template: `
    <section class="panel-mas" aria-labelledby="panel-mas-titulo">
      <header class="panel-mas__cabecera">
        <h2 id="panel-mas-titulo">Más opciones</h2>
        <button mat-icon-button aria-label="Cerrar Más" (click)="cerrar()">
          <mat-icon>close</mat-icon>
        </button>
      </header>
      <a mat-button routerLink="/ejercicios/categorias" matBottomSheetClose (click)="cerrar()">
        <mat-icon aria-hidden="true">category</mat-icon>
        Gestionar categorías
      </a>
      <a mat-button routerLink="/sincronizacion" matBottomSheetClose (click)="cerrar()">
        <mat-icon aria-hidden="true">sync</mat-icon>
        Sincronización
      </a>
      <p class="panel-mas__version">Versión {{ version }}</p>
    </section>
  `,
  styles: [
    `
      .panel-mas {
        display: grid;
        gap: 8px;
        padding: 8px 16px calc(16px + env(safe-area-inset-bottom));
      }

      .panel-mas__cabecera {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .panel-mas__cabecera h2 {
        margin: 0;
        font: var(--tipo-seccion);
      }

      .panel-mas__version {
        margin: 8px 0 0;
        color: var(--mat-sys-on-surface-variant);
        font: var(--tipo-metadato);
      }
    `,
  ],
})
class PanelMasComponent {
  private readonly referencia = inject(MatBottomSheetRef<PanelMasComponent>);
  readonly version = VERSION_APLICACION;

  cerrar(): void {
    this.referencia.dismiss();
  }
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatBottomSheetModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly bottomSheet = inject(MatBottomSheet);

  protected readonly entradasMenu = MENU_PRINCIPAL;
  protected readonly entradasMovil = MENU_MOVIL;
  protected readonly seccionesMenu = SECCIONES_MENU;
  protected readonly accesoNuevoEjercicio = ACCESO_NUEVO_EJERCICIO;
  readonly anchoViewport = signal(this.calcularAnchoViewport());
  readonly esMovil = computed(() => this.anchoViewport() <= 599);
  readonly esRiel = computed(() => this.anchoViewport() > 599 && this.anchoViewport() < 1280);
  readonly masAbierto = signal(false);

  private calcularAnchoViewport(): number {
    return typeof window === 'undefined' ? 1280 : window.innerWidth;
  }

  @HostListener('window:resize')
  actualizarModoResponsive(): void {
    this.anchoViewport.set(this.calcularAnchoViewport());
    if (!this.esMovil() && this.masAbierto()) {
      this.bottomSheet.dismiss();
    }
  }

  abrirMas(): void {
    if (!this.esMovil() || this.masAbierto()) return;

    const referencia = this.bottomSheet.open(PanelMasComponent, {
      ariaLabel: 'Más opciones',
      panelClass: 'shell__panel-mas',
    });
    this.masAbierto.set(true);
    referencia.afterDismissed().subscribe(() => this.masAbierto.set(false));
  }
}
