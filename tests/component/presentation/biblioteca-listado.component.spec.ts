import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BibliotecaListadoComponent } from '../../../src/app/presentation/biblioteca-ejercicios/biblioteca-listado.component';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

function ejercicio(nombre: string): Ejercicio {
  return { id: nombre, nombre, descripcion: 'desc', categoriaIds: ['cat-1'], enlaces: [], imagenes: [] };
}

describe('BibliotecaListadoComponent', () => {
  function configurar(ejercicios: Ejercicio[]) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue(ejercicios) } },
      ],
    });
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(BibliotecaListadoComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el listado de ejercicios (incluido el catálogo predefinido)', async () => {
    configurar([ejercicio('Sentadilla'), ejercicio('Plancha')]);
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sentadilla');
    expect(texto).toContain('Plancha');
  });

  it('muestra un mensaje cuando no hay ningún ejercicio registrado (FR-029, CL1)', async () => {
    configurar([]);
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No hay ejercicios');
  });

  it('renderiza app-cabecera-pagina con el título "Mis ejercicios" (FR-001)', async () => {
    configurar([ejercicio('Sentadilla')]);
    const fixture = await crearComponente();

    const cabecera = (fixture.nativeElement as HTMLElement).querySelector('app-cabecera-pagina');
    expect(cabecera).toBeTruthy();
    expect(cabecera?.textContent).toContain('Mis ejercicios');
  });

  it('renderiza app-estado-vacio cuando la lista está vacía (FR-003)', async () => {
    configurar([]);
    const fixture = await crearComponente();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-estado-vacio')).toBeTruthy();
  });

  it('no renderiza app-estado-vacio cuando hay ejercicios', async () => {
    configurar([ejercicio('Sentadilla')]);
    const fixture = await crearComponente();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-estado-vacio')).toBeNull();
  });

  it('renderiza cada ejercicio como elemento de lista diferenciado (FR-002)', async () => {
    configurar([ejercicio('Sentadilla'), ejercicio('Plancha')]);
    const fixture = await crearComponente();

    const tarjetas = (fixture.nativeElement as HTMLElement).querySelectorAll('.biblioteca-listado__tarjeta');
    expect(tarjetas.length).toBe(2);
  });
});
