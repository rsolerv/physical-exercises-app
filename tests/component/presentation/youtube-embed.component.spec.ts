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
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('iframe')).toBeNull();
    raiz.querySelector<HTMLButtonElement>('[aria-label="Reproducir vídeo de YouTube"]')?.click();
    fixture.detectChanges();
    const iframe = raiz.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute('src')).toContain('youtube-nocookie.com/embed/abc123');
    expect(raiz.querySelector<HTMLAnchorElement>('.youtube-embed__enlace-original')?.href)
      .toBe('https://www.youtube.com/watch?v=abc123');
  });

  it('muestra la URL original como enlace cuando la URL no corresponde a un vídeo de YouTube válido (CL5, FR-033)', async () => {
    const url = 'https://example.com/no-es-youtube';
    const fixture = await crearComponente(url);

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    const enlace = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.youtube-embed__enlace-original');
    expect(texto.toLowerCase()).toContain('vídeo no disponible');
    expect((fixture.nativeElement as HTMLElement).querySelector('iframe')).toBeNull();
    expect(enlace?.textContent?.trim()).toBe(url);
    expect(enlace?.href).toBe(url);
    expect(enlace?.target).toBe('_blank');
    expect(enlace?.rel).toContain('noopener');
  });

  it('muestra la URL original como enlace cuando no se puede cargar la miniatura', async () => {
    const url = 'https://www.youtube.com/watch?v=abc123';
    const fixture = await crearComponente(url);
    const raiz = fixture.nativeElement as HTMLElement;

    raiz.querySelector<HTMLImageElement>('.youtube-embed__miniatura')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(raiz.querySelector('.youtube-embed__vista-previa')).toBeNull();
    expect(raiz.querySelector<HTMLAnchorElement>('.youtube-embed__enlace-original')?.href).toBe(url);
    expect(raiz.querySelector<HTMLButtonElement>('[aria-label="Reproducir vídeo de YouTube"]')).toBeNull();
  });

  it('muestra título, miniatura y atribución, y no crea el reproductor hasta solicitar la reproducción', async () => {
    const fixture = await crearComponente('https://www.youtube.com/watch?v=abc123');
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('.youtube-embed__titulo')?.textContent).toContain('Vídeo de YouTube');
    expect(raiz.querySelector<HTMLImageElement>('.youtube-embed__miniatura')?.src).toContain('abc123');
    expect(getComputedStyle(raiz.querySelector('.youtube-embed__vista-previa') as Element).aspectRatio).toBe('16/9');
    expect(raiz.textContent).toContain('YouTube');
    expect(raiz.querySelector('iframe')).toBeNull();

    raiz.querySelector<HTMLButtonElement>('[aria-label="Reproducir vídeo de YouTube"]')?.click();
    fixture.detectChanges();

    expect(raiz.querySelector('iframe')?.getAttribute('src')).toContain('autoplay=1');
  });
});
