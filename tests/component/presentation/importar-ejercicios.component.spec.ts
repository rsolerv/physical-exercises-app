import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ImportarEjerciciosComponent } from '../../../src/app/presentation/importar-ejercicios/importar-ejercicios.component';
import { BuscarEjerciciosComunesUseCase } from '../../../src/app/application/casos-uso/buscar-ejercicios-comunes.use-case';
import { ImportarEjerciciosComunesUseCase } from '../../../src/app/application/casos-uso/importar-ejercicios-comunes.use-case';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import { BloqueoCategoriasPropiasDialogComponent } from '../../../src/app/presentation/importar-ejercicios/bloqueo-categorias-propias-dialog.component';
import type { EjercicioComunArchivo } from '../../../src/app/application/ports/repositorio-comun.port';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';

function ejercicioComun(sobrescribir: Partial<EjercicioComunArchivo> = {}): EjercicioComunArchivo {
  return {
    id: 'comun-1',
    nombre: 'Almeja',
    descripcion: 'Tumbada de lado.',
    categoriaIds: ['cat-comun-1'],
    enlaces: [],
    imagenes: [],
    ...sobrescribir,
  };
}

describe('ImportarEjerciciosComponent', () => {
  function configurar(opciones: {
    buscar?: ReturnType<typeof vi.fn>;
    listarCategoriasComunes?: ReturnType<typeof vi.fn>;
    categoriasLocales?: Categoria[];
    obtenerCategoriasPendientes?: ReturnType<typeof vi.fn>;
    importar?: ReturnType<typeof vi.fn>;
    dialogOpen?: ReturnType<typeof vi.fn>;
    mostrarExito?: ReturnType<typeof vi.fn>;
    mostrarError?: ReturnType<typeof vi.fn>;
  }) {
    const buscar = opciones.buscar ?? vi.fn().mockResolvedValue([]);
    const listarCategorias =
      opciones.listarCategoriasComunes ??
      vi.fn().mockResolvedValue([{ id: 'cat-comun-1', nombre: 'Movilidad' }]);
    const obtenerCategoriasPendientes = opciones.obtenerCategoriasPendientes ?? vi.fn().mockResolvedValue([]);
    const importar = opciones.importar ?? vi.fn().mockResolvedValue({ creados: 0, imagenesOmitidas: 0 });
    const mostrarExito = opciones.mostrarExito ?? vi.fn();
    const mostrarError = opciones.mostrarError ?? vi.fn();
    const dialogOpen = opciones.dialogOpen;

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: BuscarEjerciciosComunesUseCase, useValue: { buscar, listarCategorias } },
        { provide: ImportarEjerciciosComunesUseCase, useValue: { obtenerCategoriasPendientes, importar } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue(opciones.categoriasLocales ?? [{ id: 'cat-local-1', nombre: 'Rodilla' }]) } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarError } },
        { provide: MatDialog, useValue: { open: dialogOpen ?? vi.fn() } },
      ],
    });
    return { buscar, listarCategorias, obtenerCategoriasPendientes, importar, mostrarExito, mostrarError };
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(ImportarEjerciciosComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra un estado inicial neutro antes de la primera búsqueda, sin botón Importar', async () => {
    configurar({});
    const fixture = await crearComponente();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto.toLowerCase()).toContain('buscar');
    expect(fixture.nativeElement.querySelector('[data-testid="boton-importar"]')).toBeNull();
  });

  it('fija los filtros y reserva espacio para que el listado no quede oculto', async () => {
    configurar({
      buscar: vi.fn().mockResolvedValue([ejercicioComun()]),
      listarCategoriasComunes: vi.fn().mockResolvedValue([{ id: 'cat-comun-1', nombre: 'Movilidad' }]),
    });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;
    const filtros = raiz.querySelector<HTMLElement>('.importar-ejercicios__filtros');
    const cuerpo = raiz.querySelector<HTMLElement>('.importar-ejercicios__cuerpo');

    expect(filtros).toBeTruthy();
    expect(cuerpo).toBeTruthy();
    if (!filtros || !cuerpo) return;

    expect(getComputedStyle(filtros).position).toBe('fixed');
    expect(Number.parseFloat(getComputedStyle(cuerpo).paddingTop)).toBeGreaterThanOrEqual(
      filtros.getBoundingClientRect().height
    );

    await fixture.componentInstance.buscar();
    fixture.detectChanges();

    expect(raiz.querySelector('.importar-ejercicios__item')?.textContent).toContain('Almeja');
  });

  it('no busca automáticamente al escribir texto o elegir categoría: solo al pulsar Buscar (FR-003)', async () => {
    const { buscar } = configurar({});
    await crearComponente();

    expect(buscar).not.toHaveBeenCalled();
  });

  it('selecciona la primera categoría al entrar y habilita Buscar con una categoría', async () => {
    const { buscar } = configurar({ buscar: vi.fn().mockResolvedValue([ejercicioComun()]) });
    const fixture = await crearComponente();
    const botonBuscar = fixture.nativeElement.querySelector(
      '.importar-ejercicios__boton-buscar'
    ) as HTMLButtonElement;

    fixture.detectChanges();

    expect(fixture.componentInstance.categoriaId()).toBe('cat-comun-1');
    expect(botonBuscar.disabled).toBe(false);
    expect(buscar).not.toHaveBeenCalled();
  });

  it('deshabilita Buscar al desmarcar todas las categorías y no ejecuta la búsqueda', async () => {
    const { buscar } = configurar({
      listarCategoriasComunes: vi.fn().mockResolvedValue([
        { id: 'cat-comun-1', nombre: 'Movilidad' },
        { id: 'cat-comun-2', nombre: 'Fuerza' },
      ]),
    });
    const fixture = await crearComponente();
    const botonBuscar = fixture.nativeElement.querySelector(
      '.importar-ejercicios__boton-buscar'
    ) as HTMLButtonElement;

    fixture.componentInstance.alternarCategoriaFiltro('cat-comun-1');
    fixture.detectChanges();

    expect(fixture.componentInstance.categoriaId()).toBeNull();
    expect(botonBuscar.disabled).toBe(true);

    await fixture.componentInstance.buscar();
    expect(buscar).not.toHaveBeenCalled();

    fixture.componentInstance.alternarCategoriaFiltro('cat-comun-2');
    fixture.detectChanges();
    expect(botonBuscar.disabled).toBe(false);

    await fixture.componentInstance.buscar();
    expect(buscar).toHaveBeenCalledWith('', 'cat-comun-2');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Almeja');
  });

  it('muestra un estado vacío cuando la búsqueda no tiene resultados (CA4)', async () => {
    configurar({ buscar: vi.fn().mockResolvedValue([]) });
    const fixture = await crearComponente();

    await fixture.componentInstance.buscar();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent?.toLowerCase()).toContain('no se han encontrado');
  });

  it('informa de un error si falla la búsqueda, sin perder datos locales (FR-023)', async () => {
    configurar({ buscar: vi.fn().mockRejectedValue(new Error('Sin conexión.')) });
    const fixture = await crearComponente();

    await fixture.componentInstance.buscar();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin conexión.');
  });

  it('no muestra el botón Importar sin ninguna selección y lo muestra con el recuento al seleccionar (CA5)', async () => {
    configurar({ buscar: vi.fn().mockResolvedValue([ejercicioComun(), ejercicioComun({ id: 'comun-2', nombre: 'Sentadilla' })]) });
    const fixture = await crearComponente();
    await fixture.componentInstance.buscar();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="boton-importar"]')).toBeNull();

    fixture.componentInstance.alternarSeleccion('comun-1');
    fixture.detectChanges();

    const boton = fixture.nativeElement.querySelector('[data-testid="boton-importar"]');
    expect(boton).toBeTruthy();
    expect(boton.textContent).toContain('1');
  });

  it('importa directamente cuando ninguna categoría necesita mapeo (CA6)', async () => {
    const { importar, obtenerCategoriasPendientes, mostrarExito } = configurar({
      buscar: vi.fn().mockResolvedValue([ejercicioComun()]),
      obtenerCategoriasPendientes: vi.fn().mockResolvedValue([]),
      importar: vi.fn().mockResolvedValue({ creados: 1, imagenesOmitidas: 0 }),
    });
    const fixture = await crearComponente();
    await fixture.componentInstance.buscar();
    fixture.componentInstance.alternarSeleccion('comun-1');
    fixture.detectChanges();

    await fixture.componentInstance.importar();

    expect(obtenerCategoriasPendientes).toHaveBeenCalledWith([ejercicioComun()]);
    expect(importar).toHaveBeenCalledWith([ejercicioComun()], new Map());
    expect(mostrarExito).toHaveBeenCalledWith(expect.stringContaining('1'));
  });

  it('abre el diálogo de mapeo cuando hay categorías no reconocidas y aplica el resultado al importar (CA7)', async () => {
    const dialogOpen = vi.fn().mockReturnValue({ afterClosed: () => of(new Map([['cat-comun-x', 'cat-local-1']])) });
    const { importar, obtenerCategoriasPendientes } = configurar({
      buscar: vi.fn().mockResolvedValue([ejercicioComun({ categoriaIds: ['cat-comun-x'] })]),
      obtenerCategoriasPendientes: vi.fn().mockResolvedValue([{ id: 'cat-comun-x', nombre: 'Cadera' }]),
      dialogOpen,
    });
    const fixture = await crearComponente();
    await fixture.componentInstance.buscar();
    fixture.componentInstance.alternarSeleccion('comun-1');

    await fixture.componentInstance.importar();

    expect(dialogOpen).toHaveBeenCalled();
    expect(importar).toHaveBeenCalledWith(
      [ejercicioComun({ categoriaIds: ['cat-comun-x'] })],
      new Map([['cat-comun-x', 'cat-local-1']])
    );
  });

  it('no importa nada si se cancela el diálogo de mapeo (FR-009)', async () => {
    const dialogOpen = vi.fn().mockReturnValue({ afterClosed: () => of(null) });
    const { importar } = configurar({
      buscar: vi.fn().mockResolvedValue([ejercicioComun({ categoriaIds: ['cat-comun-x'] })]),
      obtenerCategoriasPendientes: vi.fn().mockResolvedValue([{ id: 'cat-comun-x', nombre: 'Cadera' }]),
      dialogOpen,
    });
    const fixture = await crearComponente();
    await fixture.componentInstance.buscar();
    fixture.componentInstance.alternarSeleccion('comun-1');

    await fixture.componentInstance.importar();

    expect(importar).not.toHaveBeenCalled();
  });

  it('bloquea la importación con acceso a categorías si el usuario no tiene categorías propias (FR-010)', async () => {
    const dialogOpen = vi.fn();
    const { importar } = configurar({
      buscar: vi.fn().mockResolvedValue([ejercicioComun()]),
      categoriasLocales: [],
      dialogOpen,
    });
    const fixture = await crearComponente();
    await fixture.componentInstance.buscar();
    fixture.componentInstance.alternarSeleccion('comun-1');

    await fixture.componentInstance.importar();

    expect(importar).not.toHaveBeenCalled();
    expect(importar).not.toHaveBeenCalled();
  });
});
