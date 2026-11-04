import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { AgregarEjercicioComponent } from '../../../src/app/presentation/planificacion-semanal/constructor/agregar-ejercicio/agregar-ejercicio.component';
import { BuscarEjerciciosUseCase } from '../../../src/app/application/casos-uso/buscar-ejercicios.use-case';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import type { EjercicioResumen } from '../../../src/app/domain/ejercicio/ejercicio.entity';

const ejercicios: EjercicioResumen[] = Array.from({ length: 125 }, (_, indice) => ({
  id: `ej-${indice}`,
  nombre: `Ejercicio ${indice}`,
  descripcion: `Descripción ${indice}`,
  categoriaIds: ['cat-1'],
}));

describe('AgregarEjercicioComponent paginado', () => {
  function configurar(buscarPaginado: ReturnType<typeof vi.fn>, total = 125) {
    const listarTodos = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: BuscarEjerciciosUseCase, useValue: {
          buscarPaginado, contarTotal: vi.fn().mockResolvedValue(total),
          buscar: vi.fn().mockResolvedValue([]),
        } },
        { provide: EjercicioRepositoryPort, useValue: { listarTodos } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
      ],
    });
    return listarTodos;
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(AgregarEjercicioComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function botonCarga(raiz: HTMLElement): HTMLButtonElement | undefined {
    return Array.from(raiz.querySelectorAll('button'))
      .find((boton) => boton.textContent?.includes('Cargar más'));
  }

  it('carga 50, acumula 50 y termina con 25, sin consultar el catálogo completo', async () => {
    const buscarPaginado = vi.fn(async (_texto: string, _categorias: string[], pagina: number) => ({
      resultados: ejercicios.slice(pagina * 50, (pagina + 1) * 50), total: 125,
    }));
    const listarTodos = configurar(buscarPaginado);
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(buscarPaginado).toHaveBeenCalledWith('', [], 0, 50);
    expect(listarTodos).not.toHaveBeenCalled();
    expect(raiz.querySelectorAll('mat-list-option')).toHaveLength(50);
    expect(raiz.textContent).toContain('Mostrando 50 de 125');
    const boton = botonCarga(raiz);
    expect(boton).toBeTruthy();
    boton?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(buscarPaginado).toHaveBeenLastCalledWith('', [], 1, 50);
    expect(raiz.querySelectorAll('mat-list-option')).toHaveLength(100);
    expect(raiz.textContent).toContain('Mostrando 100 de 125');
    botonCarga(raiz)?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(buscarPaginado).toHaveBeenLastCalledWith('', [], 2, 50);
    expect(raiz.querySelectorAll('mat-list-option')).toHaveLength(125);
    expect(raiz.textContent).toContain('Mostrando 125 de 125');
    expect(botonCarga(raiz)).toBeUndefined();
  });

  it.each([0, 49, 50, 51])('con %i ejercicios no ofrece cargar más hasta que realmente quede otro bloque', async (total) => {
    const buscarPaginado = vi.fn(async (_texto: string, _ids: string[], pagina: number) => ({
      resultados: ejercicios.slice(pagina * 50, Math.min((pagina + 1) * 50, total)),
      total,
    }));
    configurar(buscarPaginado, total);
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelectorAll('mat-list-option')).toHaveLength(Math.min(50, total));
    expect(botonCarga(raiz) !== undefined).toBe(total > 50);
    if (total === 0) expect(raiz.textContent).toContain('No hay ejercicios registrados');
    if (total === 51) {
      botonCarga(raiz)?.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(raiz.querySelectorAll('mat-list-option')).toHaveLength(51);
      expect(botonCarga(raiz)).toBeUndefined();
    }
  });

  it('distingue catálogo vacío de búsqueda sin coincidencias', async () => {
    configurar(vi.fn().mockResolvedValue({ resultados: [], total: 0 }), 12);
    const fixture = await crearComponente();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se han encontrado ejercicios');
  });

  it('conserva la selección fuera del bloque y no emite deselecciones al cambiar filtros', async () => {
    const buscarPaginado = vi.fn(async (texto: string, _ids: string[], pagina: number) => ({
      resultados: texto ? [ejercicios[100]] : ejercicios.slice(pagina * 50, (pagina + 1) * 50),
      total: texto ? 1 : 125,
    }));
    configurar(buscarPaginado);
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;
    const emitidos: unknown[] = [];
    fixture.componentInstance.seleccionados.subscribe((valor) => emitidos.push(valor));
    fixture.componentRef.setInput('ejercicioIdsSeleccionados', ['ej-0', 'ej-100']);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz.querySelector('mat-list-option')?.getAttribute('aria-selected')).toBe('true');
    expect(raiz.textContent).toContain('2 ejercicios seleccionados');
    expect(emitidos).toEqual([]);

    fixture.componentInstance.texto.set('100');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(buscarPaginado).toHaveBeenLastCalledWith('100', [], 0, 50);
    expect(raiz.querySelectorAll('mat-list-option')).toHaveLength(1);
    expect(raiz.querySelector('mat-list-option')?.getAttribute('aria-selected')).toBe('true');
    expect(raiz.textContent).toContain('2 ejercicios seleccionados');
    expect(emitidos).toEqual([]);
  });

  it('mantiene el bloque anterior y reintenta la misma página tras error, sin saltar ni duplicar', async () => {
    let intentos = 0;
    const buscarPaginado = vi.fn(async (_texto: string, _ids: string[], pagina: number) => {
      if (pagina === 1 && ++intentos === 1) throw new Error('Fallo de almacenamiento');
      return { resultados: ejercicios.slice(pagina * 50, (pagina + 1) * 50), total: 125 };
    });
    configurar(buscarPaginado);
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('ejercicioIdsSeleccionados', ['ej-0']);
    fixture.detectChanges();
    botonCarga(raiz)?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz.querySelectorAll('mat-list-option')).toHaveLength(50);
    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('Fallo de almacenamiento');
    expect(raiz.textContent).toContain('1 ejercicio seleccionado');
    expect(raiz.textContent).toContain('Reintentar');
    Array.from(raiz.querySelectorAll('button')).find((boton) => boton.textContent?.includes('Reintentar'))?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(buscarPaginado.mock.calls.map((llamada) => llamada[2])).toEqual([0, 1, 1]);
    expect(raiz.querySelectorAll('mat-list-option')).toHaveLength(100);
    expect(raiz.querySelector('[role="alert"]')).toBeNull();
  });

  it('evita solicitudes simultáneas y clics dobles mientras carga el siguiente bloque', async () => {
    let resolver!: (valor: { resultados: EjercicioResumen[]; total: number }) => void;
    const pendiente = new Promise<{ resultados: EjercicioResumen[]; total: number }>((resolve) => {
      resolver = resolve;
    });
    const buscarPaginado = vi.fn((_texto: string, _ids: string[], pagina: number) =>
      pagina === 0 ? Promise.resolve({ resultados: ejercicios.slice(0, 50), total: 125 }) : pendiente);
    configurar(buscarPaginado);
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;
    botonCarga(raiz)?.click();
    fixture.detectChanges();
    expect(raiz.textContent).toContain('Cargando ejercicios');
    expect(raiz.querySelector<HTMLButtonElement>('.agregar-ejercicio__paginacion button')?.disabled).toBe(true);
    void fixture.componentInstance.cargarMas();
    expect(buscarPaginado).toHaveBeenCalledTimes(2);
    resolver({ resultados: ejercicios.slice(50, 100), total: 125 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(raiz.querySelectorAll('mat-list-option')).toHaveLength(100);
  });

  it('descarta respuestas antiguas cuando cambian los filtros durante la carga', async () => {
    let resolverAntigua!: (valor: { resultados: EjercicioResumen[]; total: number }) => void;
    const antigua = new Promise<{ resultados: EjercicioResumen[]; total: number }>((resolve) => {
      resolverAntigua = resolve;
    });
    const buscarPaginado = vi.fn((texto: string) => texto
      ? Promise.resolve({ resultados: [ejercicios[120]], total: 1 })
      : antigua);
    configurar(buscarPaginado);
    const fixture = TestBed.createComponent(AgregarEjercicioComponent);
    fixture.detectChanges();
    fixture.componentInstance.texto.set('Ejercicio 120');
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    resolverAntigua({ resultados: ejercicios.slice(0, 50), total: 125 });
    await fixture.whenStable();
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    expect(buscarPaginado).toHaveBeenLastCalledWith('Ejercicio 120', [], 0, 50);
    expect(raiz.querySelectorAll('mat-list-option')).toHaveLength(1);
    expect(raiz.textContent).toContain('Mostrando 1 de 1');
  });

  it('permite reintentar un error inicial sin consultar listarTodos', async () => {
    const buscarPaginado = vi.fn()
      .mockRejectedValueOnce(new Error('No hay acceso a SQLite'))
      .mockResolvedValue({ resultados: ejercicios.slice(0, 50), total: 125 });
    const listarTodos = configurar(buscarPaginado);
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('No hay acceso a SQLite');
    Array.from(raiz.querySelectorAll('button')).find((boton) => boton.textContent?.includes('Reintentar'))?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(buscarPaginado.mock.calls.map((llamada) => llamada[2])).toEqual([0, 0]);
    expect(raiz.querySelectorAll('mat-list-option')).toHaveLength(50);
    expect(listarTodos).not.toHaveBeenCalled();
  });

  it('anuncia la última incorporación y conserva el foco al desaparecer Cargar más', async () => {
    const buscarPaginado = vi.fn(async (_texto: string, _ids: string[], pagina: number) => ({
      resultados: ejercicios.slice(pagina * 50, Math.min((pagina + 1) * 50, 51)),
      total: 51,
    }));
    configurar(buscarPaginado, 51);
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;
    const boton = botonCarga(raiz);
    boton?.focus();
    boton?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(raiz.querySelector('.agregar-ejercicio__paginacion [aria-live="polite"]')?.textContent)
      .toContain('Se ha incorporado 1 ejercicio');
    expect(raiz.querySelector('.agregar-ejercicio__paginacion [aria-live="polite"]')?.textContent)
      .toContain('Mostrando 51 de 51');
    expect(botonCarga(raiz)).toBeUndefined();
    expect(document.activeElement).toBe(raiz.querySelector('.agregar-ejercicio__paginacion p'));
  });
});
