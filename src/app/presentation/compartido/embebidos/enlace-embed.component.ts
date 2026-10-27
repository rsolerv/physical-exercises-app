import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

type PlataformaEmbed = 'Instagram' | 'TikTok';

@Component({
  selector: 'app-enlace-embed',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './enlace-embed.component.html',
  styleUrl: './enlace-embed.component.scss',
})
export class EnlaceEmbedComponent {
  private readonly sanitizador = inject(DomSanitizer);

  readonly url = input.required<string>();

  protected readonly titulo = computed(() => {
    try {
      return new URL(this.url()).hostname;
    } catch {
      return 'Enlace web externo';
    }
  });

  private readonly enlaceSocial = computed(() => {
    try {
      const url = new URL(this.url());
      const hostname = url.hostname.toLowerCase();
      const segmentosInstagram = url.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)\/?$/);
      if (
        (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) &&
        segmentosInstagram
      ) {
        return {
          plataforma: 'Instagram' as const,
          url: `https://www.instagram.com/${segmentosInstagram[1]}/${segmentosInstagram[2]}/embed/`,
        };
      }

      const videoTikTok = url.pathname.match(/^\/@[A-Za-z0-9._-]+\/video\/(\d+)\/?$/);
      if (
        (hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com')) &&
        videoTikTok
      ) {
        return {
          plataforma: 'TikTok' as const,
          url: `https://www.tiktok.com/player/v1/${videoTikTok[1]}?music_info=1&description=1`,
        };
      }
    } catch {
      return null;
    }

    return null;
  });

  protected readonly plataformaEmbed = computed<PlataformaEmbed | null>(
    () => this.enlaceSocial()?.plataforma ?? null
  );
  protected readonly urlPrevia = computed(() => {
    const url = this.enlaceSocial()?.url;
    return url ? this.sanitizador.bypassSecurityTrustResourceUrl(url) : null;
  });
}
