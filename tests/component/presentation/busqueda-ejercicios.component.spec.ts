import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BusquedaEjerciciosComponent } from '../../../src/app/presentation/busqueda-ejercicios/busqueda-ejercicios.component';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { BuscarEjerciciosUseCase } from '../../../src/app/application/casos-uso/buscar-ejercicios.use-case';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';

function ejercicio(id: string, nombre: string): Ejercicio {
  return { id, nombre, descripcion: `Descripción de ${nombre}`, categoriaIds: ['cat-1'], enlaces: [], imagenes: [] };
}

function categoria(id: string, nombre: string): Categoria {
  return { id, nombre, esGenerica: false };
}

describe('BusquedaEjerciciosComponent', () => {
  function configurar(opciones: { ejercicios: Ejercicio[]; categorias: Categoria[]; buscar?: ReturnType<typeof vi.fn> }) {
    const buscar = opciones.buscar ?? vi.fn().mockResolvedValue(opciones.ejercicios);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue(opciones.ejercicios) } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue(opciones.categorias) } },
        { provide: BuscarEjerciciosUseCase, useValue: { buscar } },
      ],
    });
    return buscar;
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(BusquedaEjerciciosComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('filtra por categoría seleccionada (FR-012)', async () => {
    const buscar = configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [categoria('cat-1', 'Piernas')] });
    const fixture = await crearComponente();

    fixture.componentInstance.alternarCategoria('cat-1');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscar).toHaveBeenCalledWith('', ['cat-1']);
  });

  it('filtra por texto libre (FR-013)', async () => {
    const buscar = configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [] });
    const fixture = await crearComponente();

    fixture.componentInstance.texto.set('senta');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscar).toHaveBeenCalledWith('senta', []);
  });

  it('muestra un mensaje cuando no hay ningún ejercicio registrado (CL1)', async () => {
    configurar({ ejercicios: [], categorias: [] });
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No hay ejercicios');
  });

  it('muestra una lista vacía con mensaje cuando la categoría no tiene ejercicios (FR-031)', async () => {
    const buscar = vi.fn().mockResolvedValue([]);
    configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [categoria('cat-2', 'Espalda')], buscar });
    const fixture = await crearComponente();

    fixture.componentInstance.alternarCategoria('cat-2');
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No se han encontrado ejercicios');
  });

  it('muestra los resultados encontrados', async () => {
    configurar({ ejercicios: [ejercicio('1', 'Sentadilla'), ejercicio('2', 'Plancha')], categorias: [] });
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sentadilla');
    expect(texto).toContain('Plancha');
  });
});
