import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CabeceraPaginaComponent } from '../../../../../src/app/presentation/compartido/ui/cabecera-pagina/cabecera-pagina.component';

@Component({
  standalone: true,
  imports: [CabeceraPaginaComponent],
  template: `
    <app-cabecera-pagina [titulo]="titulo" [descripcion]="descripcion">
      <button acciones type="button">Nueva acción</button>
    </app-cabecera-pagina>
  `,
})
class AnfitrionComponent {
  titulo = 'Mis ejercicios';
  descripcion: string | undefined;
}

describe('CabeceraPaginaComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('renderiza el título obligatorio como encabezado semántico', () => {
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.detectChanges();

    const encabezados = (fixture.nativeElement as HTMLElement).querySelectorAll('h1');
    expect(encabezados).toHaveLength(1);
    expect(encabezados[0].textContent).toContain('Mis ejercicios');
  });

  it('no muestra ninguna descripción si no se proporciona', () => {
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).not.toContain('undefined');
  });

  it('muestra la descripción opcional cuando se proporciona', () => {
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.componentInstance.descripcion = '3 ejercicios registrados';
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('3 ejercicios registrados');
  });

  it('renderiza el contenido proyectado en [acciones]', () => {
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.detectChanges();

    const boton = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(boton?.textContent).toContain('Nueva acción');
  });
});
