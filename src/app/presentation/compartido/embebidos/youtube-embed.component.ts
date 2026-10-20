import { Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { extraerIdYoutube } from '../../../domain/ejercicio/extraer-id-youtube';

/**
 * Reproductor de YouTube embebido (Historia de Usuario 2, FR-015). Usa
 * `youtube-nocookie.com` para no depender de cookies de terceros. Si la URL
 * no corresponde a un vídeo de YouTube reconocible, muestra un aviso en vez
 * del reproductor, igual que cuando el vídeo deja de estar disponible
 * (CL5, FR-033).
 */
@Component({
  selector: 'app-youtube-embed',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './youtube-embed.component.html',
  styleUrl: './youtube-embed.component.scss',
})
export class YoutubeEmbedComponent {
  private readonly sanitizador = inject(DomSanitizer);

  readonly url = input.required<string>();
  readonly titulo = input('Vídeo de YouTube');
  readonly reproduciendo = signal(false);
  readonly miniaturaConError = signal(false);

  protected readonly idVideo = computed(() => extraerIdYoutube(this.url()));
  protected readonly urlMiniatura = computed(() => {
    const id = this.idVideo();
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  });

  protected readonly urlSegura = computed(() => {
    const id = this.idVideo();
    if (!id) return null;
    return this.sanitizador.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`
    );
  });
}
