import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { MatPaginator } from '@angular/material/paginator';
import { BusquedaEjerciciosComponent } from '../../../src/app/presentation/busqueda-ejercicios/busqueda-ejercicios.component';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { BuscarEjerciciosUseCase } from '../../../src/app/application/casos-uso/buscar-ejercicios.use-case';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';

function ejercicio(id: string, nombre: string): Ejercicio {
  return {
    id,
    nombre,
    descripcion: `Descripción de ${nombre}`,
    categoriaIds: ['cat-1'],
    enlaces: [],
    imagenes: [],
    subidoRepositorioComun: false,
  };
}

function categoria(id: string, nombre: string): Categoria {
  return { id, nombre };
}

describe('BusquedaEjerciciosComponent', () => {
  function configurar(opciones: {
    ejercicios: Ejercicio[];
    categorias: Categoria[];
    buscar?: ReturnType<typeof vi.fn>;
    buscarPaginado?: ReturnType<typeof vi.fn>;
    contarTotal?: ReturnType<typeof vi.fn>;
    listarTodos?: ReturnType<typeof vi.fn>;
  }) {
    const buscar = opciones.buscarPaginado ?? opciones.buscar ?? vi.fn().mockResolvedValue({
      resultados: opciones.ejercicios, total: opciones.ejercicios.length,
    });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'ejercicios/:id', children: [] }]),
        provideNoopAnimations(),
        { provide: EjercicioRepositoryPort, useValue: {
          listarTodos: opciones.listarTodos ?? vi.fn().mockResolvedValue(opciones.ejercicios),
        } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue(opciones.categorias) } },
        { provide: BuscarEjerciciosUseCase, useValue: {
          buscar,
          buscarPaginado: buscar,
          contarTotal: opciones.contarTotal ?? vi.fn().mockResolvedValue(opciones.ejercicios.length),
        } },
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

  it('consulta solo la página SQL inicial de 50 y ofrece paginar sin listarTodos', async () => {
    const ejercicios = Array.from({ length: 50 }, (_, indice) => ejercicio(String(indice), `Ejercicio ${indice}`));
    const buscarPaginado = vi.fn().mockResolvedValue({ resultados: ejercicios, total: 125 });
    const contarTotal = vi.fn().mockResolvedValue(125);
    const listarTodos = vi.fn();
    configurar({ ejercicios, categorias: [], buscarPaginado, contarTotal, listarTodos });
    const fixture = await crearComponente();
    expect(buscarPaginado).toHaveBeenCalledWith('', [], 0, 50);
    expect(contarTotal).toHaveBeenCalledOnce();
    expect(listarTodos).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('mat-paginator')).toBeTruthy();
  });

  it('sustituye la página al avanzar y vuelve a la primera al cambiar tamaño o filtro', async () => {
    const buscarPaginado = vi.fn(async (_texto: string, _ids: string[], pagina: number, tamano: number) => ({
      resultados: [ejercicio(`${pagina}-${tamano}`, `Ejercicio ${pagina}`)], total: 125,
    }));
    configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [], buscarPaginado });
    const fixture = await crearComponente();
    const paginador = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('mat-paginator');
    paginador?.querySelector<HTMLButtonElement>('.mat-mdc-paginator-navigation-next')?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(buscarPaginado).toHaveBeenLastCalledWith('', [], 1, 50);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('51–100 de 125');
    expect((fixture.nativeElement as HTMLElement).querySelector('.busqueda-ejercicios__anuncio')?.textContent)
      .toContain('Mostrando 51–100 de 125 ejercicios');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.busqueda-ejercicios__tarjeta')).toHaveLength(1);

    fixture.componentInstance.actualizarTexto('plancha');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(buscarPaginado).toHaveBeenLastCalledWith('plancha', [], 0, 50);
  });

  it.each([49, 50, 51, 125])('solo ofrece avanzar si hay más de 50 coincidencias (%i)', async (total) => {
    const buscarPaginado = vi.fn(async (_texto: string, _ids: string[], pagina: number) => ({
      resultados: Array.from({ length: Math.min(Math.max(total - pagina * 50, 0), 50) },
        (_, indice) => ejercicio(`${pagina}-${indice}`, `Ejercicio ${pagina}-${indice}`)),
      total,
    }));
    configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [], buscarPaginado });
    const fixture = await crearComponente();
    const siguiente = () => (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.mat-mdc-paginator-navigation-next');
    const paginador = () => fixture.debugElement.query(By.directive(MatPaginator))?.componentInstance as
      MatPaginator | undefined;
    if (total > 50) {
      expect(paginador()?.hasNextPage()).toBe(true);
      siguiente()?.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(buscarPaginado).toHaveBeenLastCalledWith('', [], 1, 50);
      if (total === 125) {
        siguiente()?.click();
        await fixture.whenStable();
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('101–125 de 125');
        expect(paginador()?.hasNextPage()).toBe(false);
      }
    } else {
      expect((fixture.nativeElement as HTMLElement).querySelector('mat-paginator')).toBeFalsy();
    }
  });

  it('cambia a 25 o 100 sin conservar el índice de página anterior', async () => {
    const buscarPaginado = vi.fn().mockResolvedValue({
      resultados: [ejercicio('1', 'Sentadilla')], total: 125,
    });
    configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [], buscarPaginado });
    const fixture = await crearComponente();
    fixture.componentInstance.cambiarPagina({ pageIndex: 1, pageSize: 50, length: 125 });
    await fixture.whenStable();
    fixture.componentInstance.cambiarPagina({ pageIndex: 0, pageSize: 25, length: 125 });
    await fixture.whenStable();
    expect(buscarPaginado).toHaveBeenLastCalledWith('', [], 0, 25);
    fixture.componentInstance.cambiarPagina({ pageIndex: 1, pageSize: 100, length: 125 });
    await fixture.whenStable();
    expect(buscarPaginado).toHaveBeenLastCalledWith('', [], 0, 100);
  });

  it('conserva el contexto de búsqueda tras desmontar y regresar de la ficha', async () => {
    const buscarPaginado = vi.fn().mockResolvedValue({
      resultados: [ejercicio('1', 'Sentadilla')], total: 125,
    });
    configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [], buscarPaginado });
    const primera = await crearComponente();
    primera.componentInstance.actualizarTexto('sentadilla');
    primera.componentInstance.cambiarPagina({ pageIndex: 2, pageSize: 50, length: 125 });
    await primera.whenStable();
    primera.destroy();
    const segunda = await crearComponente();
    expect(segunda.componentInstance.texto()).toBe('sentadilla');
    expect(segunda.componentInstance.pagina()).toBe(2);
    expect(buscarPaginado).toHaveBeenLastCalledWith('sentadilla', [], 2, 50);
  });

  it('mantiene el error visible y permite reintentar sin presentar cero coincidencias', async () => {
    const buscarPaginado = vi.fn()
      .mockRejectedValueOnce(new Error('Fallo temporal de lectura'))
      .mockResolvedValue({ resultados: [ejercicio('1', 'Sentadilla')], total: 1 });
    configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [], buscarPaginado });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('Fallo temporal');
    expect(raiz.textContent).not.toContain('No se han encontrado');
    Array.from(raiz.querySelectorAll('button')).find((boton) => boton.textContent?.includes('Reintentar'))?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(buscarPaginado).toHaveBeenCalledTimes(2);
    expect(raiz.textContent).toContain('Sentadilla');
  });

  it('descarta respuestas anteriores al cambiar filtros', async () => {
    let resolverAnterior!: (pagina: { resultados: Ejercicio[]; total: number }) => void;
    const buscarPaginado = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolverAnterior = resolve; }))
      .mockResolvedValue({ resultados: [ejercicio('nuevo', 'Plancha actual')], total: 1 });
    configurar({ ejercicios: [ejercicio('nuevo', 'Plancha actual')], categorias: [], buscarPaginado });
    const fixture = TestBed.createComponent(BusquedaEjerciciosComponent);
    fixture.detectChanges();
    fixture.componentInstance.actualizarTexto('plancha');
    await fixture.whenStable();
    fixture.detectChanges();
    resolverAnterior({ resultados: [ejercicio('antiguo', 'Sentadilla antigua')], total: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Plancha actual');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Sentadilla antigua');
  });

  it('ajusta la última página desaparecida tras borrar un ejercicio y regresar', async () => {
    const buscarPaginado = vi.fn()
      .mockResolvedValueOnce({ resultados: [ejercicio('1', 'Sentadilla')], total: 51 })
      .mockResolvedValueOnce({ resultados: [], total: 50 })
      .mockResolvedValue({ resultados: [ejercicio('2', 'Plancha')], total: 50 });
    configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [], buscarPaginado });
    const primera = await crearComponente();
    primera.componentInstance.cambiarPagina({ pageIndex: 1, pageSize: 50, length: 51 });
    await primera.whenStable();
    primera.detectChanges();
    expect(primera.componentInstance.pagina()).toBe(0);
    primera.destroy();
    const segunda = await crearComponente();
    expect(buscarPaginado).toHaveBeenLastCalledWith('', [], 0, 50);
    expect((segunda.nativeElement as HTMLElement).textContent).toContain('Plancha');
  });

  it('filtra por categoría seleccionada (FR-012)', async () => {
    const buscar = configurar({ ejercicios: [ejercicio('1', 'Sentadilla')], categorias: [categoria('cat-1', 'Piernas')] });
    const fixture = await crearComponente();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('mat-chip-option:not([data-todas-categorias])')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(buscar).toHaveBeenCalledWith('', ['cat-1'], 0, 50);
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
    expect(buscar).toHaveBeenLastCalledWith('', [], 0, 50);
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

    expect(buscar).toHaveBeenCalledWith('senta', [], 0, 50);
  });

  it('muestra un mensaje cuando no hay ningún ejercicio registrado (CL1)', async () => {
    configurar({ ejercicios: [], categorias: [] });
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No hay ejercicios');
  });

  it('muestra una lista vacía con mensaje cuando la categoría no tiene ejercicios (FR-031)', async () => {
    const buscar = vi.fn().mockResolvedValue({ resultados: [], total: 0 });
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
    expect(buscar).toHaveBeenCalledWith('', [], 0, 50);
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
    expect(buscar).toHaveBeenCalledWith('', ['cat-1'], 0, 50);
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
        { provide: BuscarEjerciciosUseCase, useValue: {
          contarTotal: () => new Promise<number>((resolve) => { resolver = () => resolve(0); }),
          buscarPaginado: vi.fn().mockResolvedValue({ resultados: [], total: 0 }),
        } },
      ],
    });
    const fixture = TestBed.createComponent(BusquedaEjerciciosComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeTruthy();
    resolver([]);
  });
});
