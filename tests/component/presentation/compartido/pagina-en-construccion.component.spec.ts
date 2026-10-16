import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PaginaEnConstruccionComponent } from '../../../../src/app/presentation/compartido/shell/pagina-en-construccion.component';

describe('PaginaEnConstruccionComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  function crearComponente() {
    const fixture = TestBed.createComponent(PaginaEnConstruccionComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza app-cabecera-pagina en vez de un <p> plano', () => {
    const fixture = crearComponente();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-cabecera-pagina')).toBeTruthy();
  });

  it('renderiza app-estado-vacio con icono="construction" y el mensaje "Esta sección todavía no está disponible."', () => {
    const fixture = crearComponente();

    const estadoVacio = (fixture.nativeElement as HTMLElement).querySelector('app-estado-vacio');
    expect(estadoVacio).toBeTruthy();
    expect(estadoVacio?.textContent).toContain('Esta sección todavía no está disponible.');
    const icono = estadoVacio?.querySelector('mat-icon');
    expect(icono?.textContent).toContain('construction');
  });

  it('no renderiza ningún párrafo de texto plano para el mensaje de próximamente', () => {
    const fixture = crearComponente();

    expect((fixture.nativeElement as HTMLElement).querySelector('p.pagina-en-construccion')).toBeNull();
  });
});
