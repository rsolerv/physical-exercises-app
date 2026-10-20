import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const TIEMPO_ESPERA_CARGA_MS = 4000;

/**
 * Previsualización de un enlace web externo dentro de un `<iframe>`
 * sandboxed (FR-016). Si el sitio de destino no permite ser embebido (p. ej.
 * cabeceras `X-Frame-Options`/CSP), no se dispara el evento `load`; tras un
 * tiempo de espera se ofrece como alternativa abrir el enlace en una pestaña
 * nueva (research.md § 8).
 */
@Component({
  selector: 'app-enlace-embed',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './enlace-embed.component.html',
  styleUrl: './enlace-embed.component.scss',
})
export class EnlaceEmbedComponent {
  private readonly sanitizador = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  readonly url = input.required<string>();

  protected readonly cargado = signal(false);
  protected readonly noEmbebible = signal(false);

  protected readonly urlSegura = computed(() => this.sanitizador.bypassSecurityTrustResourceUrl(this.url()));
  protected readonly titulo = computed(() => {
    try {
      return new URL(this.url()).hostname;
    } catch {
      return 'Enlace web externo';
    }
  });

  constructor() {
    const temporizador = setTimeout(() => {
      if (!this.cargado()) {
        this.noEmbebible.set(true);
      }
    }, TIEMPO_ESPERA_CARGA_MS);
    this.destroyRef.onDestroy(() => clearTimeout(temporizador));
  }

  protected onCargado(): void {
    this.cargado.set(true);
    this.noEmbebible.set(false);
  }

  protected onError(): void {
    this.noEmbebible.set(true);
  }
}
