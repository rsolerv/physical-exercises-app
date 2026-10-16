import { describe, it, expect, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { EnlaceEmbedComponent } from '../../../src/app/presentation/compartido/embebidos/enlace-embed.component';

describe('EnlaceEmbedComponent', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  async function crearComponente(url: string) {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(EnlaceEmbedComponent);
    fixture.componentRef.setInput('url', url);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra un iframe sandboxed apuntando a la URL (FR-016)', async () => {
    const fixture = await crearComponente('https://example.com/rutina');

    const iframe = (fixture.nativeElement as HTMLElement).querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute('src')).toBe('https://example.com/rutina');
    expect(iframe?.hasAttribute('sandbox')).toBe(true);
  });

  it('ofrece "abrir en una pestaña nueva" cuando el sitio no se puede embeber (FR-016)', async () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(EnlaceEmbedComponent);
    fixture.componentRef.setInput('url', 'https://example.com/no-embebible');
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(5000);
    fixture.detectChanges();

    const enlace = (fixture.nativeElement as HTMLElement).querySelector('a.enlace-embed__fallback');
    expect(enlace).toBeTruthy();
    expect(enlace?.getAttribute('href')).toBe('https://example.com/no-embebible');
    expect(enlace?.getAttribute('target')).toBe('_blank');
  });

  it('no muestra el enlace de apertura externa mientras el iframe carga a tiempo', async () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(EnlaceEmbedComponent);
    fixture.componentRef.setInput('url', 'https://example.com/rutina');
    fixture.detectChanges();

    const iframe = (fixture.nativeElement as HTMLElement).querySelector('iframe') as HTMLIFrameElement;
    iframe.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('a.enlace-embed__fallback')).toBeNull();
  });
});
