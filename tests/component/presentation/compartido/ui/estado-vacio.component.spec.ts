import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { EstadoVacioComponent } from '../../../../../src/app/presentation/compartido/ui/estado-vacio/estado-vacio.component';

@Component({
  standalone: true,
  imports: [EstadoVacioComponent],
  template: `
    <app-estado-vacio [icono]="icono" [mensaje]="mensaje">
      @if (conAccion) {
        <button accion type="button">Crear mi primer ejercicio</button>
      }
    </app-estado-vacio>
  `,
})
class AnfitrionComponent {
  icono = 'fitness_center';
  mensaje = 'No hay ejercicios registrados todavía.';
  conAccion = false;
}

describe('EstadoVacioComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('renderiza el icono obligatorio marcado como decorativo (aria-hidden)', () => {
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.detectChanges();

    const icono = (fixture.nativeElement as HTMLElement).querySelector('mat-icon, [class*="icon"]');
    expect(icono?.getAttribute('aria-hidden')).toBe('true');
    expect(icono?.textContent).toContain('fitness_center');
  });

  it('muestra el mensaje obligatorio como texto visible', () => {
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No hay ejercicios registrados todavía.');
  });

  it('no muestra ninguna acción si no se proyecta contenido en [accion]', () => {
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.detectChanges();

    const boton = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(boton).toBeNull();
  });

  it('muestra la acción proyectada cuando se proporciona', () => {
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.componentInstance.conAccion = true;
    fixture.detectChanges();

    const boton = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(boton?.textContent).toContain('Crear mi primer ejercicio');
  });
});
