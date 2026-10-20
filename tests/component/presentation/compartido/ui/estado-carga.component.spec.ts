import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { EstadoCargaComponent } from '../../../../../src/app/presentation/compartido/ui/estado-carga/estado-carga.component';

@Component({
  standalone: true,
  imports: [EstadoCargaComponent],
  template: '<app-estado-carga mensaje="Cargando ejercicios" [cantidad]="3" />',
})
class AnfitrionComponent {}

describe('EstadoCargaComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('anuncia la carga mediante un estado accesible y anticipa la forma de una lista', () => {
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.detectChanges();

    const estado = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(estado?.getAttribute('aria-live')).toBe('polite');
    expect(estado?.textContent).toContain('Cargando ejercicios');
    expect(estado?.querySelectorAll('.estado-carga__elemento')).toHaveLength(3);
    expect(estado?.querySelector('.estado-carga__lista')?.getAttribute('aria-hidden')).toBe('true');
  });
});
