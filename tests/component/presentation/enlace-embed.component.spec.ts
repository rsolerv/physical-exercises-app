import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { EnlaceEmbedComponent } from '../../../src/app/presentation/compartido/embebidos/enlace-embed.component';

describe('EnlaceEmbedComponent', () => {
  async function crearComponente(url: string) {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(EnlaceEmbedComponent);
    fixture.componentRef.setInput('url', url);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el nombre del sitio y no crea una vista previa', async () => {
    const fixture = await crearComponente('https://example.com/rutina');
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('.enlace-embed__titulo')?.textContent).toContain('example.com');
    expect(raiz.querySelector('iframe')).toBeNull();
  });

  it.each([
    ['Instagram', 'https://www.instagram.com/reel/ABC123xyz/', 'https://www.instagram.com/reel/ABC123xyz/embed/'],
    ['TikTok', 'https://www.tiktok.com/@usuario/video/1234567890123456789', 'https://www.tiktok.com/player/v1/1234567890123456789?music_info=1&description=1'],
  ])('muestra la vista previa compatible de %s', async (_plataforma, url, urlPrevia) => {
    const fixture = await crearComponente(url);
    const iframe = (fixture.nativeElement as HTMLElement).querySelector<HTMLIFrameElement>('iframe');

    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute('src')).toBe(urlPrevia);
    expect(iframe?.getAttribute('loading')).toBe('lazy');
  });

  it('no intenta embeber enlaces de Instagram que no sean publicaciones', async () => {
    const fixture = await crearComponente('https://www.instagram.com/usuario/');
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('iframe')).toBeNull();
    expect(raiz.querySelector<HTMLAnchorElement>('.enlace-embed__fallback')?.href).toBe('https://www.instagram.com/usuario/');
  });

  it('permite abrir la URL original en una pestaña nueva', async () => {
    const fixture = await crearComponente('https://example.com/rutina');
    const raiz = fixture.nativeElement as HTMLElement;
    const enlace = raiz.querySelector<HTMLAnchorElement>('.enlace-embed__fallback');

    expect(enlace?.getAttribute('href')).toBe('https://example.com/rutina');
    expect(enlace?.getAttribute('target')).toBe('_blank');
    expect(enlace?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
