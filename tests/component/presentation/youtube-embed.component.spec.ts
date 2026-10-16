import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { YoutubeEmbedComponent } from '../../../src/app/presentation/compartido/embebidos/youtube-embed.component';

describe('YoutubeEmbedComponent', () => {
  function configurar() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  }

  async function crearComponente(url: string) {
    configurar();
    const fixture = TestBed.createComponent(YoutubeEmbedComponent);
    fixture.componentRef.setInput('url', url);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el iframe de youtube-nocookie.com/embed/<id> para una URL de YouTube válida (FR-015)', async () => {
    const fixture = await crearComponente('https://www.youtube.com/watch?v=abc123');

    const iframe = (fixture.nativeElement as HTMLElement).querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute('src')).toContain('youtube-nocookie.com/embed/abc123');
  });

  it('muestra "vídeo no disponible" si la URL no corresponde a un vídeo de YouTube válido (CL5, FR-033)', async () => {
    const fixture = await crearComponente('https://example.com/no-es-youtube');

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('vídeo no disponible');
    expect((fixture.nativeElement as HTMLElement).querySelector('iframe')).toBeNull();
  });
});
