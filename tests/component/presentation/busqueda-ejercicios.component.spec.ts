import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
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
  return { id, nombre };
}

describe('BusquedaEjerciciosComponent', () => {
  function configurar(opciones: { ejercicios: Ejercicio[]; categorias: Categoria[]; buscar?: ReturnType<typeof vi.fn> }) {
    const buscar = opciones.buscar ?? vi.fn().mockResolvedValue(opciones.ejercicios);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'ejercicios/:id', children: [] }]),
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

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('mat-chip-option:not([data-todas-categorias])')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscar).toHaveBeenCalledWith('', ['cat-1']);
  });

  it('la opción Todas limpia las categorías seleccionadas', async () => {
    const buscar = configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [categoria('cat-1', 'Piernas')] });
    const fixture = await crearComponente();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('mat-chip-option:not([data-todas-categorias])')?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-todas-categorias]')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.categoriaIdsSeleccionadas()).toEqual([]);
    expect(buscar).toHaveBeenLastCalledWith('', []);
  });

  it('filtra por texto libre (FR-013)', async () => {
    const buscar = configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [] });
    const fixture = await crearComponente();

    const entrada = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input');
    if (!entrada) throw new Error('Debe mostrarse el campo de búsqueda.');
    entrada.value = 'senta';
    entrada.dispatchEvent(new Event('input', { bubbles: true }));
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

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('mat-chip-option:not([data-todas-categorias])')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No se han encontrado ejercicios');
  });

  it('muestra todos los ejercicios disponibles cuando no hay filtros', async () => {
    const buscar = configurar({
      ejercicios: [ejercicio('1', 'Sentadilla'), ejercicio('2', 'Plancha')],
      categorias: [],
    });
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sentadilla');
    expect(texto).toContain('Plancha');
    expect(buscar).toHaveBeenCalledWith('', []);
  });

  it('muestra categorías en los resultados y fija los filtros al recorrer la lista', async () => {
    configurar({
      ejercicios: [ejercicio('ej-media', 'Peso muerto')],
      categorias: [categoria('cat-1', 'Fuerza')],
    });
    const fixture = await crearComponente();

    const raiz = fixture.nativeElement as HTMLElement;
    const filtros = raiz.querySelector<HTMLElement>('.busqueda-ejercicios__filtros--fijados');
    expect(filtros).toBeTruthy();
    expect(filtros && getComputedStyle(filtros).position).toBe('fixed');
    expect(raiz.querySelector('.busqueda-ejercicios__tarjeta')?.textContent).toContain('Fuerza');
  });

  it('mantiene los filtros de categoría en una sola fila desplazable horizontalmente', async () => {
    configurar({
      ejercicios: [ejercicio('1', 'Sentadilla')],
      categorias: [
        categoria('cat-1', 'Abdomen'),
        categoria('cat-2', 'Cadera'),
        categoria('cat-3', 'Cervicales'),
        categoria('cat-4', 'Glúteo'),
        categoria('cat-5', 'Isquiotibiales'),
        categoria('cat-6', 'Lumbar'),
        categoria('cat-7', 'Rodilla'),
        categoria('cat-8', 'Hombros'),
      ],
    });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;
    const filtros = raiz.querySelector<HTMLElement>('.busqueda-ejercicios__categorias');
    const estilos = Array.from(document.querySelectorAll('style'), (estilo) => estilo.textContent ?? '').join('\n');

    expect(filtros).toBeTruthy();
    expect(filtros && getComputedStyle(filtros).overflowX).toBe('auto');
    expect(
      estilos.includes('.mdc-evolution-chip-set__chips') && estilos.includes('flex-wrap: nowrap')
    ).toBe(true);
    expect(estilos.includes('.busqueda-ejercicios__categorias mat-chip-option') && estilos.includes('min-height: 48px')).toBe(
      true
    );
  });

  it('incluye la opción Todas y permite abrir una ficha desde los resultados en escritorio', async () => {
    const buscar = configurar({
      ejercicios: [ejercicio('1', 'Sentadilla')],
      categorias: [categoria('cat-1', 'Piernas')],
    });
    const fixture = await crearComponente();
    const componente = fixture.componentInstance;
    componente.categoriaIdsSeleccionadas.set(['cat-1']);
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-todas-categorias]')).toBeTruthy();
    const enlace = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '.busqueda-ejercicios__tarjeta'
    );
    expect(enlace?.getAttribute('href')).toBe('/ejercicios/1');
    enlace?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/ejercicios/1');
    expect(TestBed.inject(Location).getState()).toMatchObject({ returnUrl: '/buscar' });
    expect(componente.categoriaIdsSeleccionadas()).toEqual(['cat-1']);
    expect(buscar).toHaveBeenCalledWith('', ['cat-1']);
  });

  it('expone un estado accesible mientras carga resultados', () => {
    let resolver: (ejercicios: Ejercicio[]) => void = () => undefined;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'ejercicios/:id', children: [] }]),
        provideNoopAnimations(),
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: () => new Promise<Ejercicio[]>((resolve) => (resolver = resolve)) } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
        { provide: BuscarEjerciciosUseCase, useValue: { buscar: vi.fn().mockResolvedValue([]) } },
      ],
    });
    const fixture = TestBed.createComponent(BusquedaEjerciciosComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeTruthy();
    resolver([]);
  });
});
