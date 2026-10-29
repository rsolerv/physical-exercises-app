import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { BuscarEjerciciosComunesUseCase } from '../../../src/app/application/casos-uso/buscar-ejercicios-comunes.use-case';
import { ImportarEjerciciosComunesUseCase } from '../../../src/app/application/casos-uso/importar-ejercicios-comunes.use-case';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import { PrevisualizarEjercicioComunComponent } from '../../../src/app/presentation/importar-ejercicios/previsualizar-ejercicio-comun.component';
import type { EjercicioComunArchivo } from '../../../src/app/application/ports/repositorio-comun.port';

const ejercicioComun: EjercicioComunArchivo = {
  id: 'remoto-1',
  nombre: 'Almeja',
  descripcion: 'Tumbada de lado.',
  categoriaIds: ['cat-comun-1'],
  enlaces: [],
  imagenes: [],
  observaciones: 'Dato que no debe aparecer en la vista previa.',
};

describe('PrevisualizarEjercicioComunComponent', () => {
  function configurar(opciones: {
    datosVistaPrevia?: unknown;
    categoriasComunes?: unknown;
    categoriasLocales?: unknown;
    categoriasPendientes?: unknown;
    importar?: ReturnType<typeof vi.fn>;
    dialogOpen?: ReturnType<typeof vi.fn>;
    mostrarExito?: ReturnType<typeof vi.fn>;
  } = {}) {
    const obtenerVistaPrevia = vi.fn().mockResolvedValue(
      opciones.datosVistaPrevia ?? {
        ejercicio: ejercicioComun,
        imagenesArchivo: new Map(),
        imagenesOmitidas: 0,
      }
    );
    const listarCategorias = vi.fn().mockResolvedValue(
      opciones.categoriasComunes ?? [{ id: 'cat-comun-1', nombre: 'Movilidad' }]
    );
    const obtenerCategoriasPendientes = vi.fn().mockResolvedValue(opciones.categoriasPendientes ?? []);
    const importar = opciones.importar ?? vi.fn().mockResolvedValue({ creados: 1, imagenesOmitidas: 0 });
    const mostrarExito = opciones.mostrarExito ?? vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'remoto-1' }) } },
        },
        { provide: BuscarEjerciciosComunesUseCase, useValue: { obtenerVistaPrevia, listarCategorias } },
        { provide: ImportarEjerciciosComunesUseCase, useValue: { obtenerCategoriasPendientes, importar } },
        {
          provide: CategoriaRepositoryPort,
          useValue: {
            listarTodas: vi.fn().mockResolvedValue(opciones.categoriasLocales ?? [{ id: 'cat-local-1', nombre: 'Rodilla' }]),
          },
        },
        { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarError: vi.fn() } },
        {
          provide: MatDialog,
          useValue: {
            open:
              opciones.dialogOpen ??
              vi.fn().mockReturnValue({ afterClosed: () => of(new Map([['cat-comun-1', 'cat-local-1']])) }),
          },
        },
      ],
    });

    return { obtenerVistaPrevia, obtenerCategoriasPendientes, importar, mostrarExito };
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(PrevisualizarEjercicioComunComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra la ficha remota en lectura y omite las observaciones', async () => {
    configurar();
    const fixture = await crearComponente();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Almeja');
    expect(texto).toContain('Tumbada de lado.');
    expect(texto).not.toContain('Dato que no debe aparecer');
    expect(fixture.nativeElement.querySelector('button[aria-label*="Editar"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[aria-label*="Eliminar"]')).toBeNull();
    expect(texto).toContain('Importar ejercicio');
  });

  it('importa desde la ficha previa y vuelve a la búsqueda tras completar', async () => {
    const { obtenerCategoriasPendientes, importar, mostrarExito } = configurar();
    const fixture = await crearComponente();

    await fixture.componentInstance.importar();

    expect(obtenerCategoriasPendientes).toHaveBeenCalledWith([ejercicioComun]);
    expect(importar).toHaveBeenCalledWith([ejercicioComun], new Map());
    expect(mostrarExito).toHaveBeenCalledWith('1 ejercicio importado.');
  });

  it('abre el mapeo de categorías antes de importar cuando falta una equivalencia local', async () => {
    const dialogOpen = vi.fn().mockReturnValue({ afterClosed: () => of(new Map([['cat-comun-1', 'cat-local-1']])) });
    const { importar } = configurar({
      categoriasPendientes: [{ id: 'cat-comun-1', nombre: 'Movilidad' }],
      dialogOpen,
    });
    const fixture = await crearComponente();

    await fixture.componentInstance.importar();

    expect(dialogOpen).toHaveBeenCalled();
    expect(importar).toHaveBeenCalledWith([ejercicioComun], new Map([['cat-comun-1', 'cat-local-1']]));
  });
});
